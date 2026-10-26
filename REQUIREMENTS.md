---
type: app
status: active
updated: 2026-10-26
app: Goldstein Scheduler
repo: globalgoldstein-ai/goldstein-scheduler
live: https://goldstein-scheduler.netlify.app
---
<!-- Goldstein Scheduler | Phase 11 | Session 6 | Build 7 | 2026-10-26 08:19 ET | REQUIREMENTS.md: current deployed state (11b + 11c + round 2 + email alerts + beta banner) -->

# Goldstein Kids Scheduler — REQUIREMENTS.md

**Current deployed state, not a changelog.** Describes what `main` does today (as of commit `fb75b46`). History lives in git. The database schema is defined in `supabase/schema.sql`; this file records only the rules that schema cannot express.

**The app is in BETA.** The data is sample data until Aaron finalizes it. A yellow banner at the top of every screen says so (`BETA` in `src/version.js`). Email alerts go only to Aaron until launch (§7, launch checklist).

## 1. Purpose

Shared custody and event tracker for two households. Zoe alternates weeks between them; swaps move days between households; Noah (college) appears occasionally. **Core thesis: custody is computed from rules, never typed, and holiday swaps are detected automatically.** Design goal for the whole UI: usable with no training.

- **Aaron/Rebecca** — one household (Mount Pleasant)
- **Lisa** — one household (NoMa DC)

## 2. Stack and deploy

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite 5, inline styles, single page (`Dashboard`) with four tabs |
| Database | Supabase (Postgres + RLS), project `goldstein-scheduler` |
| Server code | Netlify Functions in `netlify/functions/`: `draft-message.js` (HTTP), `notify.js` (HTTP, email alerts), `keep-alive.js` (scheduled daily) |
| Email | Gmail SMTP via `nodemailer`, sent from the Netlify Function with a Google app password |
| AI | Claude Sonnet (`claude-sonnet-4-6`), server-side only |
| Source of truth | GitHub `globalgoldstein-ai/goldstein-scheduler`, branch `main` |
| Production | Netlify auto-deploy from `main` → goldstein-scheduler.netlify.app |
| Build/edit | Claude Code on Windows. Replit is retired. |
| Static assets | `public/`: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` (green/purple tile, white Z for Zoe, gold N badge for Noah) |

## 3. Schedule rules (`src/lib/schedule.js`)

- Default holder: Aaron/Rebecca on **odd ISO weeks**, Lisa on **even**. Custody weeks run **Monday to Sunday**; the handover is on Monday.
- Rules are effective-dated. To change parity, **append** a rule with a later `from` — never edit history.
- Effective holder = default, unless an **agreed** swap covers the date.
- `ruleFor(date)` returns the rule in force and is **read-only**; the calendar legend uses it for "Aaron/Rebecca: odd weeks" / "Lisa: even weeks". Parity logic itself is only in `defaultHousehold`.
- **Borrowed days.** A swap's range may include days the receiving household already holds (a two-week trip, say). Only **borrowed** days, where `defaultHousehold(day)` is not the receiving household, count (`borrowedDays` in `schedule.js`).
- **Swap balance** counts **agreed** swaps only, in **borrowed days**, per receiving household. (`swapBalance` was changed to count borrowed days at Aaron's explicit request on 2026-10-25; parity logic is unchanged.)
- **Holiday swap** = an agreed swap overlapping a `holiday` or `school` (shown as "No school") event that applies to Zoe (`kid` is `zoe` or `both`; `noah`-only events never count), where at least one **borrowed** day falls on the overlap. Swapping on holidays is normal, so this is information, not an error. Each swap counts once.
- Running totals start at the earliest agreed swap and are labeled "since <date>", because history before the app is not recorded.

## 4. Data invariants

- A swap belongs to the **receiving** household. `default_parent` is the household that **lends** the days: derived as the other household than `receiving_parent` and never rewritten after creation. A swap must **borrow at least one day**; one that borrows none is rejected on create and on change.
- Swaps are created as `proposed`. Statuses: `proposed | agreed | needs_discussion` (shown as Waiting for <household> / Agreed / Let's talk).
- `proposed_by` is the asker. The household that did not ask is the one that answers.
- **Change swap** (anyone, any swap, past included, also the other household's): new dates and/or note. Changing dates sets status back to `proposed` and makes the editor `proposed_by`, so the other household must agree again. A note-only change leaves status. The update is guarded with `.eq('status', row.status)` so it fails safely if someone else changed the swap first. Logged as `edit`.
- **Cancel swap** (anyone, any status): hard-deletes the swap after a confirm. The audit row (`action: delete`) keeps the full deleted record and shows in History. This replaces the old Withdraw and Give days back.
- **Trades are no longer a user concept.** `swaps.trade_id` stays in the schema and old links still read ("Gives back <dates>" / "Given back for <dates>"). `createTrade`, `suggestReturn` and `trades.js groupSwaps` remain in code but nothing in the UI calls them.
- Events carry an optional `institution` (nullable text, `DCPS` or `UMN` today; null for family events), a `category` (`holiday | school | trip | other`; `school` is displayed as "No school"; stored values never change) and a `kid` (`zoe | noah | both`). New events are saved as `proposed`; event status is not shown anywhere and nothing depends on it.
- `audit_log` is append-only, enforced by the database (insert + select policies only). Every create, edit, status change and cancel writes one row with before/after JSON. An audit failure never rolls back the write it logs.
- **Every audit row also triggers an email alert** (§6a). The alert is fire-and-forget: it can never block or undo a save.
- RLS is on with permissive anon policies. There is no login.

## 5. What the app does today

**Who is using this phone.** First visit asks "Who's using this phone?" (Aaron / Rebecca / Lisa), remembered in `localStorage` key `gs.actor` (**never rename**). A chip at the top right shows the choice and switches it. Self-declared, not verified. It sets the audit actor, the draft sender and which cards offer Agree. Agree and Let's talk are offered only to the household that did not ask (UI-only until auth).

**Beta banner.** Yellow notice at the top of every screen and on the picker, with the version label (`Version 11c · build <commit> · <time> ET`).

**Four bottom tabs:** Schedule · Holidays · Swaps · History.

- **Schedule tab**
  - **Right now** card: who has Zoe, until when, and who has her next.
  - **Needs your OK** card (only when the other household asked, not past): Agree · Let's talk · Change.
  - **Calendar:** month grid, **Sunday-first**, plus the following week under a **Next week** divider so the next handover is always visible. Each row's **Wk** label is the Monday-to-Sunday custody week of that row's Monday, coloured by the household that holds it by default; the handover therefore falls mid-row between Sunday and Monday. Squares are 66px tall and tinted by the household that has Zoe (default schedule plus agreed swaps). Swaps draw as ribbons along the bottom in the receiving household's colour: solid = agreed, striped = waiting; at most two per square. A teal inner ring marks **borrowed** days where an agreed swap falls on a holiday or no-school day. Events: red bar across the top for `holiday` and `school`, ✈ for `trip`, grey dot for `other`. The legend has four items, including "holiday or no school (tap the day)" for the red bar. The viewed month is remembered in `localStorage` (`gs.calendarMonth`; the Holidays calendar uses `gs.holidayCalendarMonth`). **Never rename these keys.**
  - **Day sheet** (tap a day): who has Zoe, swaps, events, and a button **Ask for schedule change starting this day**.
  - **Ask for schedule change** (the one big button) and **Change** on a swap both open the same sticky pick panel above the calendar: tap the first day, tap the last day (same day for one day; tapping again restarts). The panel shows the range, "N of M days are <lender>'s and count toward the swap balance" when the range includes own days, an optional note, and Ask / Save · Start over · Cancel. A range with no borrowed day shows a plain error.
  - **Tiles** (one line each, tap to expand, labelled "since <date>"): **Swap balance** (borrowed days; who is ahead or "Even") and **Holiday swaps**.
- **Swaps tab:** one card per swap, upcoming first, past in a collapsed section. Each card shows who has Zoe, the dates, status, a "N of M days borrowed" line when the range includes own days, the note, and a ⋯ menu with **Change** and **Cancel swap** (anyone, any swap). Agree / Let's talk appear on the other household's open ask. **+ Add an event** lives here.
- **Holidays tab:** "Swaps during holidays" cards (one per agreed swap on a holiday or no-school day, in plain words, with an "Agreed swap during a holiday" label, an explanation that this is allowed, and the optional **Suggest other dates** draft, §6), then every `holiday` and `school` event as a **List** (grouped by month, upcoming first, "Show past"; each row names the weekdays and "N days off", who has Zoe, Noah's events tagged) or a **Calendar**, with institution chips and **All / DCPS / UMN** filters.
- **History tab:** every audit row newest first (latest 200), in plain words ("Aaron asked for … Aaron/Rebecca would have Zoe", "Lisa agreed", "Aaron cancelled the agreed swap for …"), with a **Details** toggle showing the changed fields and time in ET; filters All / Swaps / Events. Version label at the bottom.
- **Email link:** `/?swap=<id>` opens the Swaps tab on that swap, highlighted "FROM YOUR EMAIL" with Agree and Let's talk on the card. If the person has not picked who they are, the picker comes first. If the swap was cancelled or changed, a note says so. The address bar is tidied after landing.

## 6. Holiday swap → Suggest other dates (draft message)

1. `suggestAlternate(swap, event, ctx)` (`src/lib/suggest.js`) computes an alternate window. **Deterministic — not AI. Do not replace with a model call.** It keeps the swap length and the swap's `default_parent`:
   - First it tries the window right before the event, then right after, accepting one only if both ends fall in weeks where `default_parent` is unchanged.
   - Otherwise it moves the same window by whole 2-week steps (±2, ±4, ±6 weeks, earlier first, nearest first). A 14-day step keeps every day's default household, which is what makes full-week swaps work.
   - `ctx` is `{ swaps, events, today }`. A candidate is skipped if it overlaps another holiday or school event, another agreed swap, or starts before `today`.
   - Returns `null` if nothing fits, and the draft asks to discuss.
2. `ConflictCard` POSTs `{ sender, alternate, conflict }` to `/.netlify/functions/draft-message`, where `conflict` is `{ swapStart, swapEnd, eventTitle, eventCategory, eventStart, eventEnd }`.
3. The function asks Claude for a text under 320 characters, addressed to the other household (Lisa, or Aaron and Rebecca when the sender is Lisa), using only the supplied dates, proposing the alternate and inviting a counter. With a `null` alternate it asks to discuss. Returns `{ text }`; on failure `{ error }` with status 502 or 500.
4. The card shows a loading state, an error state, the draft with **Copy text**, and **Redraft**, plus a line saying it is only a draft and changes nothing. Code fences are stripped from the response.
5. **Drafting is read-only and writes no audit row.**

`ConflictCard` is declared at module scope on purpose: defined inside `Dashboard()`, it would remount every render and wipe the draft. Both suggestion functions ignore Noah-only events.

## 6a. Email alerts (`netlify/functions/notify.js`, `src/lib/notify.js`)

- `logAudit` (`src/lib/audit.js`) calls `notifyChange` after every successful audit insert. `buildAlert` (`src/lib/notify.js`) builds `{ actor, headline, subject, facts, lines, swapId, needs }` from the audit row, reusing the History wording. `needs` is the household that must respond: the other household after an ask or a date change; the asker's household after "Let's talk"; none after agree, cancel, note edit or event.
- The Function (`buildMessages`, pure and unit-testable) sanitizes the payload and renders an **HTML + plain-text** email: an **ACTION NEEDED FROM <household>** or **FOR YOUR INFO** badge, the headline, a small facts table (Days, Zoe would be with, Normally with, Note), one big button, a hidden preview line. The button is "Review and respond" for the household that must act, otherwise "Open the request" / "Open the scheduler". It links to `<site>/?swap=<id>` (§5).
- **Subject** puts the key words first: `Action needed: Aaron asks for Nov 12–14` (BETA copies end with ` [BETA]`). Other subjects: "agreed to", "wants to talk about", "changed it to", "cancelled".
- **Recipients.** **Beta (default): only `ALERT_EMAIL_AARON`**, with a yellow strip saying what would happen after launch. **Live (`ALERT_LIVE=true`): everyone except the person who made the change**; the household that must respond gets the action version, the rest get FOR YOUR INFO copies.
- The sender shows as "Goldstein Scheduler" from `GMAIL_USER`. Failure never affects the save. If `GMAIL_USER` / `GMAIL_APP_PASSWORD` are missing, the Function answers `{ sent: false }`.

## 7. Configuration

| Variable | Set in | Visible to browser | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Netlify (build) and `.env.local` | Yes, by design | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Netlify (build) and `.env.local` | Yes, by design | Supabase anon key |
| `ANTHROPIC_API_KEY` | Netlify (Functions) | **No — never** | Claude API. No `VITE_` prefix. |
| `GMAIL_USER` | Netlify (Functions) | **No** | Gmail account that sends alerts |
| `GMAIL_APP_PASSWORD` | Netlify (Functions) | **No — never** | Google app password (needs 2-step verification) |
| `ALERT_EMAIL_AARON` / `_REBECCA` / `_LISA` | Netlify (Functions) | **No** | Recipient addresses; kept out of the repo |
| `ALERT_LIVE` | Netlify (Functions) | **No** | Unset = beta (only Aaron gets mail). `true` = live. |

Netlify reads env vars at build time: after changing any variable, run **Deploys → Trigger deploy → Clear cache and deploy site**. `keep-alive.js` reads the two `VITE_SUPABASE_*` variables at runtime. There is no `netlify.toml`. A local `.env` is git-ignored; delete it after importing it into Netlify.

**Launch checklist (beta → live):** set `ALERT_LIVE=true` in Netlify; set `BETA = false` in `src/version.js` (removes the banner); clear the sample data; redeploy.

## 8. Operations

| Symptom | Cause | Fix |
|---|---|---|
| Page shows `Error: TypeError: Failed to fetch` | Free-tier Supabase project paused after ~7 days idle. The project hostname returns DNS NXDOMAIN. | Supabase dashboard → **Restore project**; wait a few minutes. This project stays resumable until 2027-08-24. |
| Draft button: `invalid x-api-key` | `ANTHROPIC_API_KEY` missing or stale in Netlify | Create a key in the Anthropic Console, set it in Netlify, redeploy with cache cleared |
| Draft button: other error | Read the message in the card; a bad `model` string looks like a key error | Check `draft-message.js` |
| No alert email arrives | `notify` not in Netlify → Functions, or env vars missing, or bad app password | Check the Function is listed, then Logs → Functions → notify. Also check Spam. |
| Favicon does not change | Browsers cache favicons hard | Hard-refresh, open `/favicon.svg` directly, reopen the tab |

**Pause prevention:** `keep-alive.js` runs daily at 00:00 UTC and reads one row (read-only, no audit row). Check Netlify → Functions → keep-alive → logs for `Supabase responded 200`. If it logs an error or stops running, the project pauses after about 7 idle days.

`ERR_BLOCKED_BY_CLIENT` lines in the browser console are unrelated tracker blocking, not a Supabase fault.

## 9. Not built

- Auth, and per-household approval that is actually enforced (Agree is only hidden in the UI from the asker's household).
- Events cannot be edited or deleted.
- "Also add as a trip event" when asking for days (a two-week trip as both a swap and an event).
- Dark mode, colour variables, 44px tap-target audit everywhere (planned as 11d).
- Hard-to-guess URL slug — the site is on its plain Netlify address.
- School-calendar auto-fetch (2026-27 dates were loaded once with `supabase/seed-2026-27.sql`), SMS/push notifications, full Noah scheduling. Noah's school breaks are in the calendar as events but never count toward swaps.

## 10. Known limitations and open decisions

- **Anyone with the URL can read and write.** Permissive anon RLS plus a public site, until auth lands. The notify Function also accepts any well-formed request; in beta it can only reach Aaron.
- **Seed gaps:** UMN dates (Thanksgiving Nov 23–27, spring break Mar 8–12) came from pasted UMN One Stop calendar text, not the registrar page itself; recheck if it matters. DCPS 2026-11-02 and 2027-04-09 are listed as half days in the district sidebar but no school in its monthly pages; they are seeded as no school.
- **Tallies are only as complete as the swap history entered.** Swaps before the "since" date are not counted.
- **Week 53:** `defaultHousehold` uses ISO-week parity. 2026 has 53 ISO weeks, so week 53 (Dec 28, 2026 – Jan 3, 2027) and week 1 (Jan 4–10) are both odd and Aaron/Rebecca hold two weeks in a row. The next 53-week year is 2032. The approved fix, to apply once Aaron has told Lisa, is to append `{ from: '2027-01-04', oddWeek: 'lisa', evenWeek: 'aaron_rebecca' }` to `schedule.js`, never to edit history. Check swaps dated on or after 2027-01-04 first.
- **Sunday-first grid vs Monday handover:** a Sunday cell can be tinted differently from its row's week number (the Sunday belongs to the previous custody week).

## 11. Conventions

Working rules for Claude Code (file headers, diffs, do-not-touch list) live in `CLAUDE.md`. Markdown docs carry YAML frontmatter (`type`, `status`, `updated`).

## 12. Last verified

**Verified on the live site by Aaron (2026-10-24 to 2026-10-26):**
- Draft message, keep-alive, full-week swap alternate, Holidays view and seed, holiday-swap tally (details in git history of this file).
- 11a / calendar declutter, 11b tap-to-select, Change swap and History (iPhone).
- **Email alert (plain-text version):** an ask by Aaron sent a `[BETA]` email to Aaron's inbox with the sentence, field list and site link.

**Built, passes 58 automated checks and a production build, pushed, not yet confirmed on the live site by Aaron:**
- Four-tab layout, who's-using-this-phone picker, Right now and Needs your OK cards, Swaps tab.
- Ranges that include own days (borrowed-days balance), Cancel swap, Change on any swap, Holidays "N days off", "Ask for schedule change" wording, clearer holiday-swap card.
- HTML email with action-needed badge and the `?swap=` deep link, shorter subject lines, version label in the beta banner, Sunday-first calendar, favicon and home-screen icon.
