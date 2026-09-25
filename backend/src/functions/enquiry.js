// The Tangmere website's contact form posts here. Four things happen,
// in order, for every real enquiry:
//   1. It's checked for obvious spam (a hidden field a visitor never
//      sees, but a bot filling in every field tends to fill in too).
//   2. It's saved permanently in Azure Table Storage, so an enquiry
//      exists and can be found again even if an email or a sheet
//      write goes astray.
//   3. It's added as a new row in a shared Google Sheet, so anyone at
//      Tangmere can open one familiar spreadsheet in Drive and see
//      every enquiry, without needing to look at Azure at all.
//   4. A notification email is sent, via the Gmail API, to Tangmere's
//      sales@ group — with the enquirer's own address set as Reply To,
//      so a reply goes straight back to them.
//
// This Function is deployed on its own, separate from the website's
// hosting on Cloudflare Pages. Nothing here depends on how the site is
// built or hosted; it only needs the site to POST to its URL.

const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { google } = require('googleapis');
const crypto = require('crypto');

// -------- CORS --------
// Only the website's own addresses may call this from a browser.
// Everything else (a stray script, a scraped copy of the site) is refused.
function allowedOrigin(req) {
  const origin = req.headers.get('origin');
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// -------- Validation --------
const INTERESTS = ['Buying an aircraft', 'Selling an aircraft', 'Helicopter operations', 'Something else'];

function validate(body) {
  const errors = [];
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const interest = (body.interest || '').trim();
  const message = (body.message || '').trim();

  if (!name) errors.push('name is required');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('a valid email is required');
  if (!INTERESTS.includes(interest)) errors.push('interest must be one of the listed options');
  if (!message) errors.push('message is required');
  if (name.length > 200 || email.length > 200 || message.length > 5000) errors.push('a field is too long');

  return { errors, clean: { name, email, interest, message } };
}

// -------- Table Storage --------
async function saveEnquiry(clean) {
  const client = TableClient.fromConnectionString(
    process.env.TABLES_CONNECTION_STRING,
    process.env.TABLE_NAME || 'Enquiries'
  );
  await client.createTable().catch(() => {}); // no-op if it already exists

  const now = new Date();
  const entity = {
    partitionKey: now.toISOString().slice(0, 7), // groups rows by year-month
    rowKey: crypto.randomUUID(),
    receivedAt: now.toISOString(),
    name: clean.name,
    email: clean.email,
    interest: clean.interest,
    message: clean.message,
  };
  await client.createEntity(entity);
  return entity;
}

// -------- Shared Google credentials --------
// Both the Sheet and the Gmail notification use the same service
// account, impersonating one real Tangmere mailbox. One authorisation
// step in Google Workspace (see backend/README.md) covers both.
function googleAuth(scopes) {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes,
    subject: process.env.GOOGLE_SENDER_EMAIL, // impersonates this mailbox
  });
}

// -------- Shared Google Sheet --------
// Appends one row per enquiry to a Sheet living in a Shared Drive, so
// staff can browse every enquiry in a familiar spreadsheet, without
// needing to look at Azure at all. This is a convenience view — Table
// Storage above is the permanent record of record.
async function appendToSheet(clean, entity) {
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) return; // not set up yet — skip quietly, nothing else depends on this
  const auth = googleAuth(['https://www.googleapis.com/auth/spreadsheets']);
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Enquiries!A:F',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[entity.receivedAt, clean.name, clean.email, clean.interest, clean.message, entity.rowKey]],
    },
  });
}

// -------- Gmail API notification --------
// A Google Group can't send mail itself, so this sends from one real,
// authorised mailbox (GOOGLE_SENDER_EMAIL) and addresses it to the
// sales@ group, which then delivers it to everyone in the group.
async function sendNotification(clean) {
  const auth = googleAuth(['https://www.googleapis.com/auth/gmail.send']);
  const gmail = google.gmail({ version: 'v1', auth });

  const to = process.env.SALES_GROUP_EMAIL;
  const subject = `New enquiry: ${clean.interest} — ${clean.name}`;
  const body = [
    `Name: ${clean.name}`,
    `Email: ${clean.email}`,
    `Interest: ${clean.interest}`,
    '',
    clean.message,
  ].join('\n');

  const raw = [
    `To: ${to}`,
    `From: ${process.env.GOOGLE_SENDER_EMAIL}`,
    `Reply-To: ${clean.email}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  const encoded = Buffer.from(raw).toString('base64url');
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
}

// -------- The Function itself --------
app.http('enquiry', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'enquiry',
  handler: async (request, context) => {
    const origin = allowedOrigin(request);

    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders(origin) };
    }
    if (!origin) {
      return { status: 403, jsonBody: { error: 'Origin not allowed' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, headers: corsHeaders(origin), jsonBody: { error: 'Invalid JSON' } };
    }

    // Honeypot: a real visitor never sees or fills this field. If it's
    // filled in, say nothing to the bot — just pretend it worked.
    const honeypotField = process.env.HONEYPOT_FIELD || 'company';
    if (body[honeypotField]) {
      context.log('Honeypot triggered, silently discarding');
      return { status: 200, headers: corsHeaders(origin), jsonBody: { ok: true } };
    }

    const { errors, clean } = validate(body);
    if (errors.length) {
      return { status: 422, headers: corsHeaders(origin), jsonBody: { errors } };
    }

    let entity;
    try {
      entity = await saveEnquiry(clean);
    } catch (err) {
      context.error('Failed to save enquiry', err);
      return { status: 500, headers: corsHeaders(origin), jsonBody: { error: 'Could not save enquiry' } };
    }

    try {
      await appendToSheet(clean, entity);
    } catch (err) {
      // Same reasoning as the email below: the permanent record in
      // Table Storage already exists, so a sheet hiccup is logged,
      // not failed back to the visitor.
      context.error('Enquiry saved but Sheet row failed', err);
    }

    try {
      await sendNotification(clean);
    } catch (err) {
      // The enquiry is already saved safely, so this is logged, not
      // failed back to the visitor — nobody's enquiry gets lost just
      // because an email hiccupped.
      context.error('Enquiry saved but notification email failed', err);
    }

    return { status: 200, headers: corsHeaders(origin), jsonBody: { ok: true } };
  },
});
