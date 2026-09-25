# Tangmere enquiry backend

This is the small piece of code that makes the website's contact form actually
work. Today, the form on the site just shows a "thank you" message locally and
sends nothing anywhere. This Function is what turns that into: **an enquiry is
saved permanently, shown in a shared spreadsheet, and the right people get an
email.**

It is deployed completely separately from the website itself. The website
lives on Cloudflare Pages; this lives on Azure. Neither depends on the other
being rebuilt or redeployed.

**Status as of 2026-09-25: deployed and tested successfully.** A direct test
request (standing in for the real website form) was validated, saved to Table
Storage, and confirmed row by row in Azure. See "What has not been done yet"
below for what's still missing before it's fully live.

## What it does, in order

1. A visitor submits the contact form on the website.
2. The website sends that data to this Function's URL (`/api/enquiry`).
3. This Function:
   - Rejects it quietly if a hidden "honeypot" field has been filled in
     (a sign of an automated bot, not a real visitor).
   - Checks the real fields are present and sensible.
   - Saves a permanent record in Azure Table Storage — a simple, cheap
     database built into the same Azure Storage Account the Function
     needs anyway. This is the record of record; everything else below
     is a convenience view on top of it.
   - Adds a row to a shared Google Sheet, so staff can browse every
     enquiry in a familiar spreadsheet in Drive, without needing to look
     at Azure at all.
   - Sends a notification email via the Gmail API to the `sales@` group,
     with the enquirer's own address set as "Reply To" so a reply goes
     straight back to them.

If saving the enquiry to Table Storage fails, the visitor sees an error.
If that succeeds but the Sheet row or the email fails, the visitor still
sees success — the enquiry is safely recorded either way, so nothing is
ever silently lost.

## What has **not** been done yet

- **The Google Cloud service account (below) does not exist yet.** Without
  it, saving to Table Storage will still work, but the Sheet row and the
  notification email will both fail every time (safely — the enquiry
  itself is still saved).
- **The Google Sheet itself does not exist yet either** — see step 5 below.
  Until `SHEET_ID` is set, the Function simply skips that step quietly.
- **The website's own contact form has not been changed yet** to actually
  call this Function. Right now `script.js` still just shows a fake
  "thank you" message.
- **Stronger spam protection** — a honeypot, origin checking and field
  validation are already built in, but Cloudflare Turnstile and a basic
  rate limit are worth adding before real traffic arrives.

## One-time setup: the pieces this needs

### 1. The Azure Function App, Storage Account, and their settings
Created directly in the Azure Portal (portal.azure.com) — no command line
needed. See PROJECT-STATUS.md §10 for the exact settings used and for two
mistakes made and fixed along the way, worth knowing about:

- **The Storage Account can end up not created at all**, if the hosting plan
  selection is changed partway through the Function App creation wizard (this
  happened here — Flex Consumption isn't supported on a Free Trial
  subscription, so the plan was switched to Consumption (Windows), and the
  storage step got skipped). If the Function App's own resource group has no
  Storage Account in it, create one manually and add its connection string as
  both `AzureWebJobsStorage` and `TABLES_CONNECTION_STRING`.
- **Copy the connection string using its copy icon, not by selecting the text
  by hand.** A manually copied string lost characters twice in testing here,
  causing confusing failures ("Invalid TableEndpoint in the provided SAS
  Connection String") that had nothing to do with the code itself.

### 2. `ALLOWED_ORIGINS`
Every address the real contact form could ever be loaded from, comma
separated, no spaces needed:
```
https://tangmere.aero,https://www.tangmere.aero,https://dvs-tangmere-website.pages.dev,https://tangmere-aircraft.com
```
Without this, every request is correctly rejected with "Origin not allowed" —
this is the CORS check working as designed, not a bug.

### 3. A Google Cloud service account with domain-wide delegation
This is the one step that **must be done by a Google Workspace administrator**
(Chris Edwards) — it cannot be scripted or done by Claude Code, because it
requires clicking "Authorize" inside the Google Workspace admin console.

1. Go to **console.cloud.google.com** and create a project (or reuse one).
2. **APIs & Services → Library** → enable both the **Gmail API** and the
   **Google Sheets API**.
3. **IAM & Admin → Service Accounts → Create service account.** Give it a
   name like `tangmere-enquiry-sender`. No roles need to be granted here.
4. Open the new service account → **Keys → Add key → Create new key → JSON**.
   This downloads a `.json` file. **Treat this file like a password** — it
   can send email and edit the Sheet as your organisation once authorised.
   Never commit it to Git or paste it into chat.
5. Copy the long **Client ID** number shown on the service account's
   **Details** tab.
6. In **admin.google.com → Security → API controls → Domain-wide delegation**,
   click **Add new**, paste that Client ID, and for **OAuth scopes** enter
   both, comma separated:
   `https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/spreadsheets`
7. Save. This is the step that only an administrator can approve.

The contents of the downloaded JSON file become the
`GOOGLE_SERVICE_ACCOUNT_JSON` application setting (as one line — most JSON
editors or `jq -c . file.json` can flatten it).

### 4. The sending mailbox
Set `GOOGLE_SENDER_EMAIL` to one real, existing mailbox on `tangmere.aero`
(for example `chris@tangmere.aero`, until a dedicated one like
`website@tangmere.aero` is created). A Google Group such as `sales@` cannot
send mail itself, which is why one real mailbox sends on the group's behalf.

Set `SALES_GROUP_EMAIL` to `sales@tangmere.aero` once that group exists.

### 5. The shared Google Sheet
1. In Google Drive, create a **Shared Drive** (if one doesn't already exist
   for this purpose), then a new **Google Sheet** inside it, named something
   like `Tangmere Enquiries`.
2. Rename its first tab to exactly `Enquiries` (matching the code), and add a
   header row: `Received At`, `Name`, `Email`, `Interest`, `Message`, `Id`.
3. Share the Sheet (or the whole Shared Drive) with the service account's own
   email address (shown on its Details tab, looks like
   `tangmere-enquiry-sender@your-project.iam.gserviceaccount.com`), given
   **Editor** access.
4. Copy the Sheet's id from its URL — the long string between `/d/` and
   `/edit`, e.g. `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
5. Set that as the `SHEET_ID` application setting.

## Deploying (no command line needed)

1. In the Azure Portal, open the Function App.
2. Go to **Deployment Center**.
3. Choose **GitHub** as the source, authorise it, and pick this repository
   (`primadvs/dvs-tangmere-website`) and branch `main`.
4. **Important:** the generated workflow defaults to building from the
   repository root. Edit `.github/workflows/main_<function-app-name>.yml` and
   change `AZURE_FUNCTIONAPP_PACKAGE_PATH` to `'backend'` — this repository's
   own workflow is already fixed, but a Function App created under a
   different name will generate a new one with the same default mistake.
5. Azure builds and deploys automatically from there. Every future push to
   `main` redeploys it — the same automatic pattern as Cloudflare Pages for
   the website itself.
6. In **Environment variables → App settings**, add every value shown in
   `local.settings.json.example` (except the two Azure-internal ones, which
   Azure fills in on its own): `AzureWebJobsStorage`, `TABLES_CONNECTION_STRING`,
   `TABLE_NAME`, `ALLOWED_ORIGINS`, `HONEYPOT_FIELD`, `GOOGLE_SENDER_EMAIL`,
   `SALES_GROUP_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEET_ID`.

## Testing it once deployed

The Function's real URL is shown on its **Overview** page in Azure — copy it
using the copy icon next to "Default domain" rather than retyping it (an easy
place to lose a character, as happened during testing here).

A quick test, matching an allowed origin so it isn't rejected (replace the URL
with the real one):

```bash
curl -X POST https://tangmere-backend-xxxxxxxx.ukwest-01.azurewebsites.net/api/enquiry \
  -H "Content-Type: application/json" \
  -H "Origin: https://dvs-tangmere-website.pages.dev" \
  -d '{"name":"Test Person","email":"test@example.com","interest":"Something else","message":"Just testing"}'
```

A successful response is `{"ok":true}`. Then check the Storage Account's
**Enquiries** table for the new row (Storage browser → Tables → Enquiries —
double-click the row to open it, a single click on the table name doesn't
open the data view), the shared Sheet for the new row, and the `sales@` group
for the notification email.

**Remember to delete any test rows** from both Table Storage and the Sheet
before real enquiries start arriving.
