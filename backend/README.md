# Tangmere enquiry backend

This is the small piece of code that makes the website's contact form actually
work. Today, the form on the site just shows a "thank you" message locally and
sends nothing anywhere. This Function is what turns that into: **an enquiry is
saved permanently, and the right people get an email.**

It is deployed completely separately from the website itself. The website
lives on Cloudflare Pages; this lives on Azure. Neither depends on the other
being rebuilt or redeployed.

## What it does, in order

1. A visitor submits the contact form on the website.
2. The website sends that data to this Function's URL (`/api/enquiry`).
3. This Function:
   - Rejects it quietly if a hidden "honeypot" field has been filled in
     (a sign of an automated bot, not a real visitor).
   - Checks the real fields are present and sensible.
   - Saves a permanent record in Azure Table Storage — a simple, cheap
     database built into the same Azure Storage Account the Function
     needs anyway.
   - Sends a notification email via the Gmail API to the `sales@` group,
     with the enquirer's own address set as "Reply To" so a reply goes
     straight back to them.

If saving the enquiry fails, the visitor sees an error. If saving succeeds but
the email fails, the visitor still sees success — the enquiry is safely
recorded either way, so nothing is ever silently lost.

## What has **not** been done yet

- **This code has not been run or tested anywhere yet.** It was written
  without Node.js installed on the machine it was written on, so there has
  been no local test run. The first real test is the deployment itself.
- **The Google Cloud service account (below) does not exist yet.** Without
  it, saving to Table Storage will still work, but sending the notification
  email will fail every time (safely — the enquiry itself is still saved).
- **The website's own contact form has not been changed yet** to actually
  call this Function. Right now `script.js` still just shows a fake
  "thank you" message. That's a small, separate change, done once this
  Function is deployed and its real URL is known.

## One-time setup: the pieces this needs

### 1. The Azure Function App and Storage Account
Created directly in the Azure Portal (portal.azure.com) — no command line
needed. See PROJECT-STATUS.md §10 for the exact settings used.

### 2. The Storage Account's connection string
In the Azure Portal: your Storage Account → **Access keys** → copy a
connection string. This becomes the `TABLES_CONNECTION_STRING` application
setting.

### 3. A Google Cloud service account with domain-wide delegation
This is the one step that **must be done by a Google Workspace administrator**
— it cannot be scripted or done by Claude Code, because it requires clicking
"Authorize" inside your own Google Workspace admin console.

1. Go to **console.cloud.google.com** and create a project (or reuse one).
2. **APIs & Services → Library** → enable the **Gmail API**.
3. **IAM & Admin → Service Accounts → Create service account.** Give it a
   name like `tangmere-enquiry-sender`. No roles need to be granted here.
4. Open the new service account → **Keys → Add key → Create new key → JSON**.
   This downloads a `.json` file. **Treat this file like a password** — it
   can send email as your organisation once authorised. Never commit it to
   Git or paste it into chat.
5. Copy the long **Client ID** number shown on the service account's
   **Details** tab.
6. In **admin.google.com → Security → API controls → Domain-wide delegation**,
   click **Add new**, paste that Client ID, and for **OAuth scopes** enter:
   `https://www.googleapis.com/auth/gmail.send`
7. Save. This is the step that only an administrator (Chris, or the second
   administrator once chosen) can approve.

The contents of the downloaded JSON file become the
`GOOGLE_SERVICE_ACCOUNT_JSON` application setting (as one line — most JSON
editors or `jq -c . file.json` can flatten it).

### 4. The sending mailbox
Set `GOOGLE_SENDER_EMAIL` to one real, existing mailbox on `tangmere.aero`
(for example `chris@tangmere.aero`, until a dedicated one like
`website@tangmere.aero` is created). A Google Group such as `sales@` cannot
send mail itself, which is why one real mailbox sends on the group's behalf.

Set `SALES_GROUP_EMAIL` to `sales@tangmere.aero` once that group exists.

## Deploying (no command line needed)

1. In the Azure Portal, open the Function App.
2. Go to **Deployment Center**.
3. Choose **GitHub** as the source, authorise it, and pick this repository
   (`primadvs/dvs-tangmere-website`) and the `backend` folder as the source.
4. Azure builds and deploys automatically from there. Every future push to
   `main` that touches the `backend` folder redeploys it — the same
   automatic pattern as Cloudflare Pages for the website itself.
5. In **Configuration → Application settings**, add every value shown in
   `local.settings.json.example` (except the two Azure-internal ones, which
   Azure fills in on its own): `TABLES_CONNECTION_STRING`, `TABLE_NAME`,
   `ALLOWED_ORIGINS`, `HONEYPOT_FIELD`, `GOOGLE_SENDER_EMAIL`,
   `SALES_GROUP_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_JSON`.

## Testing it once deployed

Once deployed, the Function has a real URL, shown on its **Overview** page —
something like `https://tangmere-enquiry.azurewebsites.net/api/enquiry`.

A quick test (replace the URL, and note this bypasses the browser's CORS
check, which only applies to requests from a web page):

```bash
curl -X POST https://tangmere-enquiry.azurewebsites.net/api/enquiry \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Person","email":"test@example.com","interest":"Something else","message":"Just testing"}'
```

A successful response is `{"ok":true}`. Then check the Storage Account's
**Enquiries** table for the new row, and check the `sales@` group for the
notification email.
