# Tangmere Website — Project Status

**Last updated:** 2026-09-21
**Written for:** anyone picking this project up — including a future version of whoever is reading this now who has forgotten the details.

This file exists so nobody has to reconstruct this project from memory or from a chat history. If you only read one thing in this repository, read this.

---

## 1. What this is, in plain terms

A website for **Tangmere ~~Aircraft~~ Aero Sales**, a Guernsey based brokerage of working pilots who buy, sell and broker business jets and helicopters. The site is 11 static HTML pages — a homepage, a full fleet listing, an about page, and 8 individual aircraft detail pages — with no server side code today. It was built with Claude Code (Anthropic's AI coding assistant) across several sessions with Dane Shepherd.

**The person maintaining this is not a professional software engineer.** This document is written on that assumption — plain language over jargon, and every acronym explained the first time it's used.

---

## 2. If you're picking this up cold

Read in this order:

1. **§4 — what actually works right now** (and the one big thing that doesn't)
2. **§6 — where every account lives** (so you can actually get in)
3. **§7 — the plan** (confirmed and going ahead, not a proposal under discussion)
4. **§8 — the three open decisions**, all of which sit with Chris Edwards
5. **§9 — known issues**, so you don't rediscover them the hard way

Then run the site locally (§5) before touching anything.

---

## 3. The single most important fact

> **The contact form on the website does not send anywhere.** It shows a "Thank you" confirmation, but no email is generated and nothing is stored. Anyone using the form today believes their enquiry was sent. It was not.

This is documented in detail in §7 and §9. Fixing it is the top priority of the plan in §7.

---

## 4. What actually works right now

| | Status |
|---|---|
| **Live site** | [primadvs.github.io/dvs-tangmere-website](https://primadvs.github.io/dvs-tangmere-website/) — public, works, free |
| **All 11 pages** | Load correctly: homepage, fleet listing, about, 8 aircraft detail pages |
| **Hero video, photos, styling** | All working as designed |
| **Contact form** | **Does not send anywhere** — see §3 |
| **WhatsApp button** | Works — opens WhatsApp with a pre filled message |
| **Language switcher** | Visible in the header but does nothing when clicked — no translations exist. |

Hosting today is **GitHub Pages**, which is free but can only serve static files — it has no way to run a form backend. That's a hosting limitation, not a bug to fix in the code. Hosting is planned to move to **Cloudflare Pages** (see §7, Phase 3).

---

## 5. Running it on your own computer

The site needs a local server to preview properly (a script called `serve.py` is included, in the root of this repository). From a terminal, in this folder:

```bash
python3 serve.py
```

Then open **http://127.0.0.1:4173/index.html** in a browser. Press `Ctrl+C` in the terminal to stop it.

You do not need this to just *look* at the site — the live link in §4 already works. You only need this to preview changes before they're pushed to GitHub.

---

## 6. Where every account lives

This is the part that matters most if whoever built this steps away. **Every account below should be in a password manager** (Apple's built in Passwords app on a Mac works fine — it doesn't need to be a paid tool), not remembered or left in browser autofill only.

| Account | Where | Status |
|---|---|---|
| **Code repository** | GitHub — `primadvs/dvs-tangmere-website` | Live. Owned by the personal GitHub account `primadvs`. |
| **Hosting (current)** | GitHub Pages | Live, free, no login needed beyond GitHub itself |
| **Hosting (planned)** | Cloudflare Pages (free plan) | **Not yet created.** Chosen over Netlify, whose free plan is 300 credits a month with a hard stop. Builds the site from the GitHub repository. See §7, Phase 3 |
| **Current domain** | tangmere-aircraft.com | Existing — registrar and account owner not documented here; confirm and add before this file is trusted as complete |
| **New domain** | `tangmere.aero`, registered through **Netim.com** | **Registered.** $68.49 for year one at checkout, renewing at $89.99 a year. Held under **Chris Edwards' email**, the designated account holder for this and related acquisitions. Registration and renewal stay at Netim. The nameservers now point to Cloudflare (see the DNS row below), so DNS records are no longer edited at Netim |
| **DNS** | Cloudflare (free plan) | **Active since 2026-09-21.** Nameservers `emely.ns.cloudflare.com` and `rick.ns.cloudflare.com`. Every DNS record (Google Workspace mail records, later the website) is edited here, not at Netim. Confirm which email address holds the Cloudflare account and record it in the password manager |
| **Working email today** | sales@tangmere-aircraft.com | Listed as the site's contact address. **Not confirmed as an actively monitored inbox** — check this before relying on it |
| **Email** | Google Workspace, planned 6 paid mailboxes plus a free `sales@` group on `tangmere.aero` | **Signed up, domain verified, mail flowing to Google.** The first administrator mailbox exists. Business Standard was the plan at ~$84/month for 6 seats (annual billing) or $100.80/month (no commitment), in USD from Google's pricing page. Confirm and record here which plan, seat count and billing option was actually chosen at sign up |
| **Backend (planned)** | Azure (Function + Table Storage + Gmail API) | **Not yet built.** See §7, Phase 3 and §10 |

### If you only do one thing from this section

**Turn on auto renewal for every domain, and make sure the card on file won't lapse.** A `.aero` domain in particular is gated behind an eligibility check (see §7) — if it lapses, getting it back isn't a simple re purchase, it's redoing that whole process.

---

## 7. The plan (domain, email, migration, testing, rollout)

**This is the confirmed plan Tangmere is going ahead with**, not a draft under discussion. The three items still open are all in §8, and none of them block Phases 1–3. The full version, with a to scale timeline and cost tables, is saved alongside this file at `proposal/launch-plan.html`.

### Phase 1 — Acquire the `.aero` domain (Week 1)

`.aero` is a restricted domain name, reserved for the civil aviation community. Registering one requires an **"Aero ID" membership** from the registry (an organisation called SITA) *before* any domain seller will register the name for you.

- Tangmere qualifies clearly — eligible categories include Business Aircraft Operator, Distribution, and Aviation Professional.
- The registry's own published turnaround for the membership is **around two working days** once eligibility is confirmed.
- The domain is registered through **Netim.com**, an accredited `.aero` seller: $68.49 for year one at checkout, renewing at $89.99 a year. Not needed, so not bought: a separate email hosting plan (Google Workspace hosts the email), an SSL certificate and the registrar's CDN add on (the site host provides both). WHOIS privacy is optional; confirm what was chosen.
- **The current tangmere-aircraft.com is untouched throughout** — this runs alongside it with zero risk to the live site.
- **Chris Edwards' email is the account holder** for this purchase and related acquisitions.

**Move the domain's DNS to Cloudflare — done.** Cloudflare Pages can only attach a bare domain like tangmere.aero if the domain's DNS is on Cloudflare, so the nameservers at Netim now point to Cloudflare. Cloudflare copied Netim's default records first, and the ones no longer wanted were then removed (see the progress list below).

**How the two domains relate — decided:** this is a **move to tangmere.aero**, not a permanent split. Both domains run alongside each other during the migration itself, specifically to limit friction and downtime while the switch happens. Once the transition is complete, tangmere.aero is the one home for the site and tangmere-aircraft.com redirects fully to it. Nothing already in circulation breaks at any point, and the new domain ends up carrying the aviation specific credibility of a `.aero` address as Tangmere's single address, not a parallel one.

### Progress so far (updated 2026-09-21)

Done:
- `tangmere.aero` registered at Netim ($68.49 first year, renewing at $89.99).
- DNS moved to Cloudflare and confirmed active from outside.
- Google Workspace signed up and the domain verified with a TXT record.
- Mail records set: one MX record to `smtp.google.com` (priority 1), one SPF record with Google's value, and Netim's old MX and SPF records deleted.
- DKIM record published and authentication started in Google (can take up to 48 hours).
- A first test email from the new address landed in iCloud's junk folder. That is expected for a brand new domain before DKIM is active. Retest once Google shows DKIM as working.
- Two mailboxes created in Google Workspace: `chris@tangmere.aero` (Chris Edwards) and `craig@tangmere.aero` (Craig Lammiman).
- **Cloudflare Pages connected to the GitHub repository, live at `dvs-tangmere-website.pages.dev`.** Checked and confirmed rendering correctly (hero, fleet cards, contact form all load). This is a free preview address only — `tangmere.aero` still points nowhere near it yet, so nothing changed for real site visitors. That switch is a deliberate later step (see Phase 3 below).

**Still paused as of 2026-09-24: email is deliberately not being pushed forward.** Google's DKIM page is still showing "Authenticating email with DKIM" (checked 2026-09-23). The TXT record it is waiting on was confirmed live in Cloudflare's DNS, so nothing is misconfigured — this is simply Google's normal checking window (up to 48 hours from when it was published on 2026-09-21). Pick back up once it shows as authenticated.

Still to do (once resumed):
- Confirm DKIM is working, then add the DMARC record (start with `p=none`, about two days after SPF and DKIM are confirmed).
- Create the remaining 4 mailboxes: James Hughes, Will Fanshawe, Pawel Chorzelski, Josh Le Breton.
- Create `sales@`. **Decided 2026-09-21: it will be a free Google Group, not a paid mailbox**, with a Shared Drive for shared files. The group should be private (only invited people can post, or only people inside the organization — not open to the public web), so it does not need to be published anywhere on the site. Still open: who the second administrator is, and confirming the seat count chosen at sign up is 6 (it was planned as 7 before this decision).
- The two A records for `tangmere.aero` and `www` still point at Netim's parking page. They are replaced when the website is connected to Cloudflare Pages.
- Nothing has been added to the website itself yet, and the contact form still sends nothing.

### Phase 2 — Set up working email (Weeks 1–2)

- Create 6 real mailboxes: the five employees named on the About page (James Hughes, Chris Edwards, Will Fanshawe, Pawel Chorzelski, Josh Le Breton) and Craig Lammiman (not yet reflected on the About page). `sales@` is a free Google Group that delivers to the chosen people, so it costs nothing extra. Shared files live in a Google Shared Drive (included in Business Standard). Groups can be set so members reply as `sales@`; that setting needs turning on in the admin console.
- Configure the technical settings that stop email landing in spam (these are called MX, SPF, DKIM and DMARC records — Google Workspace will give exact instructions for these when the mailboxes are created; they are entered in Cloudflare's DNS once the move above is done).
- **Wire the actual contact form to these mailboxes.** This is the fix for §3.

### Phase 3 — Fix the form and plan the migration (Weeks 2–3)

- **Hosting: Cloudflare Pages (chosen).** The site moves off GitHub Pages, which can't run a form and whose terms say it isn't meant for running an online business. Cloudflare's free plan has unlimited bandwidth, 500 builds a month and needs no card, and it builds the site straight from the GitHub repository, so GitHub stays the master copy.
- **Why not Netlify:** its free plan is 300 credits a month with a hard stop. Each publish costs 15 credits, bandwidth costs 20 credits per GB, and running out pauses every site on the account. The one thing given up is Netlify's free, ready made form handling.
- **Terms check (read on 2026-09-19):** the terms don't ban business use. A free site can't collect card details, and Tangmere's takes none. Free services carry no liability and Cloudflare may suspend an account at any time, so the site can be redeployed elsewhere within minutes if that happens. Cloudflare's CDN terms let it limit customers who serve video or a large share of big files without paid services; a short looping clip of a few MB is unlikely to count.
- **File limit:** a single file can be at most 25 MiB. The current 32.9 MB hero video is over that and would not deploy. The replacement has a size target: 1080p, 10 to 15 seconds, no audio, roughly 3 to 6 MB, with a poster frame taken from the video itself.
- **The contact form runs on Azure.** A small piece of custom code (an "Azure Function") receives the form submission, checks it isn't spam, **saves a permanent record of the enquiry**, and then sends the notification email. This is what turns "an email was sent" into "an enquiry exists and can be found again later". Cloudflare Pages has no form handling of its own, so this is now the only way enquiries reach a mailbox. Until it is built and tested the contact form still sends nothing, which puts it on the critical path of this phase.
- Also in this phase: redirect every old tangmere-aircraft.com page to its new equivalent so no bookmarked or shared link breaks, and write down a rollback plan (how to point everything back at the current site within minutes if something goes wrong).

| Hosting option | Cost | Why, or why not |
|---|---|---|
| **Cloudflare Pages** (chosen) | Free | Unlimited bandwidth, 500 builds a month, 25 MiB per file |
| Netlify | Free, or $9 to $19 a month | Free plan is 300 credits a month with a hard stop that pauses every site. Forms are free and unlimited |
| Azure Static Web Apps | Free tier, or about $9 a month | One source calls the free tier hobby use with no uptime guarantee |
| GitHub Pages (today) | Free | 100 GB a month soft limit, no forms, terms say it isn't meant for running an online business |
| Firebase Hosting | Free | 10 GB a month, site disabled if exceeded |
| Vercel | Paid | Its free plan is for non commercial use only |

### Phase 4 — Internal testing, i.e. UAT (Weeks 3–4)

"UAT" stands for **User Acceptance Testing** — before anyone outside the team sees the new setup, the team itself tests it:

- Every page, every link, every image
- A real test enquiry, checked by each employee in their own new mailbox
- The WhatsApp button, on both a phone and a computer
- The hero video is placeholder stock footage, kept deliberately until Tangmere's own is filmed — a confirmed choice, not something to re decide here.

### Phase 5 — A slow rollout, not a switch flip (Weeks 4–6)

- **Week 4:** share the new setup with a small number of trusted existing contacts first — not a public announcement yet.
- **Week 5:** watch. Confirm enquiries are actually arriving in mailboxes (not just showing the on screen confirmation), check for broken links, check email isn't landing in spam.
- **Week 6:** only once Week 5 has gone cleanly — tangmere.aero becomes Tangmere's one address, and tangmere-aircraft.com switches from running alongside it to redirecting fully to it. The old address keeps working as a redirect rather than disappearing.

### After launch — fleet updates by staff

The goal: staff open an admin page, edit an aircraft on a form, upload photos and press Publish. The change is saved to the GitHub repository, Cloudflare rebuilds the pages, and the live site updates within minutes. Cloudflare only hosts the site; the admin page is what staff use.

- **Tool:** Decap CMS (free, open source), with the site generated from one data file per aircraft (Eleventy suggested).
- **Login:** Google sign in through DecapBridge, so each person uses the Google Workspace account they already have. No new passwords, no GitHub accounts, and removing someone who leaves is one step. DecapBridge has a free plan; its limits are not yet confirmed.
- **Photos:** chosen in the aircraft form. Resizing to web sizes is planned as part of the build, and any single file must stay under Cloudflare's 25 MiB limit.
- **Cost:** $0 a month expected.
- **Not built or tested yet.** An engineer is needed once, to rebuild the fleet pages so each aircraft lives in a single place and to set up the admin page. Day to day use needs none. It follows Phase 5, since it depends on Cloudflare hosting and Phase 3 being done.

### Budget summary

| Item | Cost | Notes |
|---|---|---|
| `.aero` domain | $68.49 first year, then $89.99/year | Netim checkout price (confirmed) |
| Aero ID membership | Confirm with SITA | One time eligibility step |
| 6 mailboxes (Google Workspace Business Standard); `sales@` is a free group | $84/mo (annual) or $100.80/mo (monthly) | Confirmed from Google's pricing page, in USD — convert to GBP before buying |
| Hosting and DNS (Cloudflare Pages) | $0/month | Free plan: unlimited bandwidth, 500 builds a month, 25 MiB per file |
| Azure backend | ~$0/month | Function calls, storage and Gmail API calls all sit inside free usage tiers at Tangmere's enquiry volume |
| Fleet editing (Decap CMS, Google sign in) | $0/month | After launch. DecapBridge free plan limits not yet confirmed |

---

## 8. Open decisions — Chris Edwards decides

Everything in §7 is the confirmed plan. These three items are the only things still open, and all three sit with Chris, as the person taking ownership of the site's copy, voice and content. None of them block Phases 1–3; all three can be settled any time before Phase 4 sign off.

| Decision | The options | Notes |
|---|---|---|
| **The "Speak to a Pilot" button** | *Enquire Now* (neutral, covers buying and selling equally) · *Get in Touch* (warmer, less transactional) · *Talk to Us* (personal tone, drops the "pilot" framing) · or keep the original | Part of a broader copy pass — a few phrases across the site read as generic rather than in Tangmere's own voice. That whole pass is Chris's, not just this one button. |
| **Display font** | Keep **EB Garamond** (free, chosen deliberately to avoid a generic AI website look) · or switch to **Avenir** (Adobe Fonts, ~$20–60/mo) · or a **Hoefler & Co** face (Cloud.typography, from $99/yr — specific face still TBD: Hoefler Text, Mercury, Gotham all differ) | Real cost either way except keeping what's there. **Discovery and pricing needed** — neither alternative has a confirmed quote yet; the specific face still needs choosing before a real price can be requested. |
| **File storage** | Google Workspace Business Standard already bundles Drive — 2TB pooled storage per mailbox, shared drives — already in the §7 budget. If something beyond that was meant (a dedicated shared drive structure for contracts and aircraft documentation, say), that's a separate ask worth spelling out. | Needs clarifying, not just confirming. |

---

## 9. Known issues (the honest list)

| Issue | Detail | Urgency |
|---|---|---|
| **Contact form doesn't send** | See §3. The single blocker before real traffic should be sent to this site. | Fix before launch |
| **Hero video is stock footage** | The homepage's background video is free stock footage (from a site called Pexels), not Tangmere's own — it shows a jet that isn't part of the fleet. **This was a deliberate decision, not an oversight** — it stays until Tangmere films its own footage. | On hold, by choice |
| **2014 Bell 429 has no photos** | Shows a placeholder logo instead of the aircraft, since it hasn't arrived into inventory yet. | Fix when it arrives |
| **2027 Bell 429 photo isn't the real aircraft** | It's Bell's own manufacturer photo, since this is a new build aircraft that doesn't exist yet. Reasonable for now, but not genuinely Tangmere's. | Fix at delivery |

Copy tone and font choice are also open — see §8, where they're written up properly rather than repeated here.

---

## 10. The backend build (code written, not yet deployed)

**The Function's code has been written**, saved at `backend/` in the repository, with its own `backend/README.md` explaining every remaining step in plain language. It has not been run or deployed anywhere yet — there was no Node.js available to test it locally, so the first real test happens at deployment. The agreed shape:

```
Customer submits the form
   → POST to /api/enquiry
   → Azure Function receives it
   → checks it isn't spam (a simple hidden field trick called a "honeypot")
   → saves a permanent record (in a lightweight Azure database called "Table Storage")
   → sends a notification email (via the Gmail API, using the same
     Google Workspace mailboxes from Phase 2)
```

The Function will live in its own folder, separate from the website itself, and deployed as its own independent piece — the site's hosting (Cloudflare Pages) and this backend don't depend on each other.

**Still needed before this can be built and go live:**
- An Azure account, and inside it a "Function App" resource (creates its own "Storage Account" automatically, which doubles as the Table Storage the Function needs) — requires someone to click through Azure's own sign up. **In progress.**
- A Google Cloud service account with domain wide delegation, with permission to send the notification email (a group cannot be sent from directly, so it is sent from one real mailbox, for example `chris@tangmere.aero` to start, addressed to the `sales@` group, with the enquirer as Reply To) — this step specifically requires an administrator of the Google Workspace account to approve it; it can't be done by a script or by Claude Code. Full steps are in `backend/README.md`.
- Connect the Function App to this GitHub repository (Azure's "Deployment Center"), the same automatic pattern already working for the website on Cloudflare Pages.
- Once deployed and tested with a direct request, change the website's own contact form (`script.js`) to actually call it, instead of showing a fake "thank you" message locally.

### A related idea that was set aside: Google Cloud Storage

Separately, moving the website's large files (mainly the 32.9 MB hero video) out of the GitHub repository and into a dedicated storage service (Google Cloud Storage) was discussed. This is **not required to launch** — it solves a narrower problem: every time the video file changes, git keeps the old version forever, so the repository slowly grows. The 32.9 MB figure is today's placeholder stock footage, not a stable number — once Tangmere's own footage and photography replace it, the real footprint could end up smaller or larger depending on what's actually shot. Storage cost for Tangmere's current files would be $0/month, comfortably inside a free allowance regardless; the real cost is "egress" (bandwidth for serving the video to visitors), roughly $4–40/month depending on how many people visit. Cloudflare Pages caps a single file at 25 MiB, so the hero video has to be compressed to fit anyway. Worth revisiting once the video is replaced with real footage, not before.

---

## 11. What's deliberately excluded from this repository

Some local reference material — saved copies of other companies' websites kept only for design inspiration, design discussion screenshots, an early style guide document, and a few unused placeholder images — was never part of the live site and is not tracked here. If a file mentioned in an old conversation seems to be missing, that's most likely why.

---

## 12. How this was built

This site and this plan were built collaboratively with **Claude Code**, Anthropic's AI coding assistant, across multiple working sessions. Design decisions (typography, layout, copy tone) were made deliberately against a design brief that avoided generic "AI generated" website patterns — visible in choices like the typeface (EB Garamond, not the more common Fraunces), and italics used only where print convention actually calls for them (named aircraft, standfirsts), not as decoration.

If a future session with Claude Code picks this project back up, this file — along with the git commit history — is the intended starting point.

---

## 13. A note on this specific copy

This copy of the project lives at `~/tangmere.old`, reconstructed on 2026-09-12 after the working copy that previously lived at `~/Desktop/dvs-tangmere-website` went missing between sessions — it could not be found anywhere searchable on disk, and this environment could not inspect the macOS Trash to check whether it was recoverable there. Everything here was rebuilt from two verified safe sources: the live GitHub repository (`primadvs/dvs-tangmere-website`, which has the full site) and this document plus the proposal file, both reconstructed from content already produced earlier in the same working session. Nothing is believed to be lost, but **it's worth checking Trash yourself** in case the original folder is sitting there and easier to simply restore.
