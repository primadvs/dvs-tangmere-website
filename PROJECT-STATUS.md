# Tangmere Website — Project Status

**Last updated:** 2026-09-15
**Written for:** anyone picking this project up — including a future version of whoever is reading this now who has forgotten the details.

This file exists so nobody has to reconstruct this project from memory or from a chat history. If you only read one thing in this repository, read this.

---

## 1. What this is, in plain terms

A website for **Tangmere Aircraft Sales**, a Guernsey based brokerage of working pilots who buy, sell and broker business jets and helicopters. The site is 11 static HTML pages — a homepage, a full fleet listing, an about page, and 8 individual aircraft detail pages — with no server side code today. It was built with Claude Code (Anthropic's AI coding assistant) across several sessions with Dane Shepherd.

**The person maintaining this is not a professional software engineer.** This document is written on that assumption — plain language over jargon, and every acronym explained the first time it's used.

---

## 2. If you're picking this up cold

Read in this order:

1. **§4 — what actually works right now** (and the one big thing that doesn't)
2. **§6 — where every account lives** (so you can actually get in)
3. **§7 — the plan** (confirmed and going ahead, not a proposal under discussion)
4. **§8 — the four open decisions**, all of which sit with Chris Edwards
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
| **Language switcher** | Visible in the header but does nothing when clicked — no translations exist. Decision pending, see §8. |

Hosting today is **GitHub Pages**, which is free but can only serve static files — it has no way to run a form backend. That's a hosting limitation, not a bug to fix in the code.

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
| **Hosting (planned)** | Netlify | **Not yet created.** Needed to fix the contact form (§7, Phase 3) |
| **Current domain** | tangmere-aircraft.com | Existing — registrar and account owner not documented here; confirm and add before this file is trusted as complete |
| **New domain** | A `.aero` domain, via **Netim.com** | **Not yet registered.** Requires an "Aero ID" membership first — see §7, Phase 1. Purchased under **Chris Edwards' email**, the designated account holder for this and related acquisitions |
| **Working email today** | sales@tangmere-aircraft.com | Listed as the site's contact address. **Not confirmed as an actively monitored inbox** — check this before relying on it |
| **Email** | Google Workspace, 6 mailboxes on the new domain | **Not yet purchased.** Business Standard, ~$84/month (annual billing) or $100.80/month (no commitment) — figures confirmed from Google's own pricing page in USD; convert to GBP and confirm before buying |
| **Backend (planned)** | Azure (Function + Table Storage + Gmail API) | **Not yet built.** See §7, Phase 3 and §10 |

### If you only do one thing from this section

**Turn on auto renewal for every domain, and make sure the card on file won't lapse.** A `.aero` domain in particular is gated behind an eligibility check (see §7) — if it lapses, getting it back isn't a simple re purchase, it's redoing that whole process.

---

## 7. The plan (domain, email, migration, testing, rollout)

**This is the confirmed plan Tangmere is going ahead with**, not a draft under discussion. The four items still open are all in §8, and none of them block Phases 1–3. The full version, with a to scale timeline and cost tables, is saved alongside this file at `proposal/launch-plan.html`.

### Phase 1 — Acquire the `.aero` domain (Week 1)

`.aero` is a restricted domain name, reserved for the civil aviation community. Registering one requires an **"Aero ID" membership** from the registry (an organisation called SITA) *before* any domain seller will register the name for you.

- Tangmere qualifies clearly — eligible categories include Business Aircraft Operator, Distribution, and Aviation Professional.
- The registry's own published turnaround for the membership is **around two working days** once eligibility is confirmed.
- Once approved, the domain is bought through **Netim.com**, an accredited `.aero` seller, for up to a 10-year term.
- **The current tangmere-aircraft.com is untouched throughout** — this runs alongside it with zero risk to the live site.
- **Chris Edwards' email is the account holder** for this purchase and related acquisitions.

**How the two domains relate — decided:** they **run alongside** each other. New customer contact and new enquiries route through `.aero`; tangmere-aircraft.com keeps its existing traffic and links exactly as they are. Nothing already in circulation breaks, and the new domain carries the aviation specific credibility of a `.aero` address from day one.

### Phase 2 — Set up working email (Weeks 1–2)

- Create 6 real mailboxes: the five employees named on the About page (James Hughes, Chris Edwards, Will Fanshawe, Pawel Chorzelski, Josh Le Breton), plus a shared `sales@` address.
- Configure the technical settings that stop email landing in spam (these are called MX, SPF, DKIM and DMARC records — Google Workspace will give exact instructions for these when the mailboxes are created).
- **Wire the actual contact form to these mailboxes.** This is the fix for §3.

### Phase 3 — Fix the form and plan the migration (Weeks 2–3)

Two systems work together, not one replacing the other:

- **Netlify (fast fix):** move hosting off GitHub Pages onto Netlify. Netlify can send a form submission straight to an email address with almost no setup — this alone fixes §3 within days, without waiting for anything else.
- **Azure (the durable version, built in parallel):** a small piece of custom code (an "Azure Function") that receives the form submission, checks it isn't spam, **saves a permanent record of the enquiry**, and then sends the notification email. This is what turns "an email was sent" into "an enquiry exists and can be found again later" — Netlify's version has no memory of a submission once the email is sent.
- **Why keep both running:** if the Azure side is ever down or mid update, the same form submission still reaches Netlify and still emails someone — nothing depends on one system's uptime. Combined cost at Tangmere's enquiry volume is close to $0/month, which is the actual reason to run both rather than picking one.
- Also in this phase: redirect every old tangmere-aircraft.com page to its new equivalent so no bookmarked or shared link breaks, and write down a rollback plan (how to point everything back at the current site within minutes if something goes wrong).

### Phase 4 — Internal testing, i.e. UAT (Weeks 3–4)

"UAT" stands for **User Acceptance Testing** — before anyone outside the team sees the new setup, the team itself tests it:

- Every page, every link, every image
- A real test enquiry, checked by each employee in their own new mailbox
- The WhatsApp button, on both a phone and a computer
- The hero video is placeholder stock footage, kept deliberately until Tangmere's own is filmed — a confirmed choice, not something to re decide here. The language switcher decision (§8) should be settled before this phase closes.

### Phase 5 — A slow rollout, not a switch flip (Weeks 4–6)

- **Week 4:** share the new setup with a small number of trusted existing contacts first — not a public announcement yet.
- **Week 5:** watch. Confirm enquiries are actually arriving in mailboxes (not just showing the on screen confirmation), check for broken links, check email isn't landing in spam.
- **Week 6:** only once Week 5 has gone cleanly — the full cutover, on the `.aero` for new enquiries basis decided in Phase 1. The old address keeps redirecting rather than disappearing.

### Budget summary

| Item | Cost | Notes |
|---|---|---|
| `.aero` domain | $50–90/year | Via Netim.com; indicative, not a quote |
| Aero ID membership | Confirm with SITA | One time eligibility step |
| 6 mailboxes (Google Workspace Business Standard) | $84/mo (annual) or $100.80/mo (monthly) | Confirmed from Google's pricing page, in USD — convert to GBP before buying |
| Netlify hosting | Likely free at this scale | |
| Azure backend | ~$0/month | Function calls, storage and Gmail API calls all sit inside free usage tiers at Tangmere's enquiry volume |

---

## 8. Open decisions — Chris Edwards decides

Everything in §7 is the confirmed plan. These four items are the only things still open, and all four sit with Chris, as the person taking ownership of the site's copy, voice and content. None of them block Phases 1–3; all four can be settled any time before Phase 4 sign off.

| Decision | The options | Notes |
|---|---|---|
| **The "Speak to a Pilot" button** | *Enquire Now* (neutral, covers buying and selling equally) · *Get in Touch* (warmer, less transactional) · *Talk to Us* (personal tone, drops the "pilot" framing) · or keep the original | Part of a broader copy pass — a few phrases across the site read as generic rather than in Tangmere's own voice. That whole pass is Chris's, not just this one button. |
| **Display font** | Keep **EB Garamond** (free, chosen deliberately to avoid a generic AI website look) · or switch to **Avenir** (Adobe Fonts, ~$20–60/mo) · or a **Hoefler & Co** face (Cloud.typography, from $99/yr — specific face still TBD: Hoefler Text, Mercury, Gotham all differ) | Real cost either way except keeping what's there. |
| **File storage** | Google Workspace Business Standard already bundles Drive — 2TB pooled storage per mailbox, shared drives — already in the §7 budget. If something beyond that was meant (a dedicated shared drive structure for contracts and aircraft documentation, say), that's a separate ask worth spelling out. | Needs clarifying, not just confirming. |
| **Language switcher** | Commission real translations, or remove it | A control that visibly does nothing costs more trust than not having it at all. |

---

## 9. Known issues (the honest list)

| Issue | Detail | Urgency |
|---|---|---|
| **Contact form doesn't send** | See §3. The single blocker before real traffic should be sent to this site. | Fix before launch |
| **Hero video is stock footage** | The homepage's background video is free stock footage (from a site called Pexels), not Tangmere's own — it shows a jet that isn't part of the fleet. **This was a deliberate decision, not an oversight** — it stays until Tangmere films its own footage. | On hold, by choice |
| **2014 Bell 429 has no photos** | Shows a placeholder logo instead of the aircraft, since it hasn't arrived into inventory yet. | Fix when it arrives |
| **2027 Bell 429 photo isn't the real aircraft** | It's Bell's own manufacturer photo, since this is a new build aircraft that doesn't exist yet. Reasonable for now, but not genuinely Tangmere's. | Fix at delivery |

The language switcher, copy tone, and font choice are also open — see §8, where they're written up properly rather than repeated here.

---

## 10. The backend build (in progress, paused)

An Azure Function project was designed but **not yet written or deployed**. The agreed shape:

```
Customer submits the form
   → POST to /api/enquiry
   → Azure Function receives it
   → checks it isn't spam (a simple hidden field trick called a "honeypot")
   → saves a permanent record (in a lightweight Azure database called "Table Storage")
   → sends a notification email (via the Gmail API, using the same
     Google Workspace mailboxes from Phase 2)
```

The Function will live in its own folder, separate from the website itself, and deployed as its own independent piece — the site's hosting (Netlify) and this backend don't depend on each other.

**Still needed before this can be built and go live:**
- The Google Workspace mailboxes from Phase 2 need to exist first (the Function sends email through them)
- An Azure account, and inside it: a "Function App" resource and a "Storage Account" — both require someone to click through Azure's own sign up
- A "Table Storage" (this is not the same thing as the Google Cloud Storage question that was also discussed and set aside — see below)
- A Google Cloud service account with domain wide delegation, with permission to send email as `sales@` — this step specifically requires an administrator of the Google Workspace account to approve it; it can't be done by a script or by Claude Code

### A related idea that was set aside: Google Cloud Storage

Separately, moving the website's large files (mainly the 32.9 MB hero video) out of the GitHub repository and into a dedicated storage service (Google Cloud Storage) was discussed. This is **not required to launch** — it solves a narrower problem: every time the video file changes, git keeps the old version forever, so the repository slowly grows. The 32.9 MB figure is today's placeholder stock footage, not a stable number — once Tangmere's own footage and photography replace it, the real footprint could end up smaller or larger depending on what's actually shot. Storage cost for Tangmere's current files would be $0/month, comfortably inside a free allowance regardless; the real cost is "egress" (bandwidth for serving the video to visitors), roughly $4–40/month depending on how many people visit. Worth revisiting once the video is replaced with real footage, not before.

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
