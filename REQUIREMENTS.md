---
type: app
status: active
updated: 2026-10-25
app: Goldstein Scheduler
repo: globalgoldstein-ai/goldstein-scheduler
live: https://goldstein-scheduler.netlify.app
---
<!-- Goldstein Scheduler | Phase 11 | Session 5 | Build 1 | 2026-10-25 16:09 ET | REQUIREMENTS.md: current deployed state -->

# Goldstein Kids Scheduler — REQUIREMENTS.md

**Current deployed state, not a changelog.** Describes what `main` does today (as of commit `8f719ff`). History lives in git. The database schema is defined in `supabase/schema.sql`; this file records only the rules that schema cannot express.

## 1. Purpose

Shared custody and event tracker for two households. Zoe alternates weeks between them; swaps move days between households; Noah (college) appears occasionally. **Core thesis: custody is computed from rules, never typed, and holiday swaps are detected automatically.**

- **Aaron/Rebecca** — one household (Mount Pleasant)
- **Lisa** — one household (NoMa DC)

## 2. Stack and deploy

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite 5, inline styles, single page (`Dashboard`) |
| Database | Supabase (Postgres + RLS), project `goldstein-scheduler` |
| Server code | Netlify Functions in `netlify/functions/`: `draft-message.js` (HTTP) and `keep-alive.js` (scheduled daily) |
| AI | Claude Sonnet (`claude-sonnet-4-6`), server-side only |
| Source of truth | GitHub `globalgoldstein-ai/goldstein-scheduler`, branch `main` |
| Production | Netlify auto-deploy from `main` → goldstein-scheduler.netlify.app |
| Build/edit | Claude Code on Windows. Replit is retired. |

## 3. Schedule rules (`src/lib/schedule.js`)

- Default holder: Aaron/Rebecca on **odd ISO weeks**, Lisa on **even**.
- Rules are effective-dated. To change parity, **append** a rule with a later `from` — never edit history.
- Effective holder = default, unless an **agreed** swap covers the date.
- `ruleFor(date)` returns the rule in force and is **read-only**; the calendar legend uses it for "Aaron/Rebecca: odd weeks" / "Lisa: even weeks". Parity logic itself is only in `defaultHousehold`.
- Swap balance counts **agreed** swaps only, in days, per receiving household.
- **Holiday swap** = an agreed swap overlapping a `holiday` or `school` (shown as "No school") event that applies to Zoe (`kid` is `zoe` or `both`; `noah`-only events never count). Swapping on holidays is normal, so this is information, not an error. Each swap counts once.
- Running totals start at the earliest agreed swap and are labeled "since <date>", because history before the app is not recorded.

## 4. Data invariants

- A swap belongs to the **receiving** household. `default_parent` is snapshotted at creation and never rewritten.
- Receiving household is derived from the start date, never typed. Creating a swap for a household that already holds Zoe that week is rejected.
- Swaps are created as `proposed`. Statuses: `proposed | agreed | needs_discussion`.
- A **trade** is two swaps sharing `swaps.trade_id` (nullable `uuid`; null for a one-sided swap). The return side goes to the household that gave days up and must fall on days the other household holds by default. Balance nets automatically when the day counts match.
- Events carry an optional `institution` (nullable text, `DCPS` or `UMN` today; null for family events). It is a label and filter only and never affects detection. Events also carry a `category` (`holiday | school | trip | other`) that drives holiday-swap detection (stored values never change; `school` is displayed as "No school"), and a `kid` (`zoe | noah | both`).
- A swap can be **withdrawn** (hard-deleted) only while it is `proposed`, and the UI offers it only to the household that asked (judged from the self-declared "I am"). The database delete is guarded by `status = 'proposed'`. Agreed swaps cannot be withdrawn. The audit row (`action: delete`) keeps the full deleted record.
- `audit_log` is append-only, enforced by the database (insert + select policies only). Every create, status change, link and withdrawal writes one row with before/after JSON. An audit failure never rolls back the write it logs.
- RLS is on with permissive anon policies. There is no login.

## 5. What the app does today

- **Tiles** — two, each with a one-line plain explanation and labeled "since <date>": **Swap balance (days)** (who is ahead, or "Even") and **Holiday swaps** (count per household and who is ahead).
- **Schedule | Holidays switch** under the tiles.
- **Calendar (Schedule)** — month grid, Monday-first so custody weeks line up, plus the following week under a **Next week** divider so the next handover is always visible.
  - Squares are 66px tall. Each is tinted by the household that has Zoe (default schedule plus agreed swaps).
  - A **Wk** column shows the ISO week number, colored by the household that holds that week by default. The legend states which household has odd or even weeks (from `ruleFor`).
  - Swaps draw as ribbons along the bottom of the squares, in the receiving household's color: **solid = agreed**, **striped = asked, waiting**. Ribbons are rounded at a swap's first and last day and at week edges. At most two show per square.
  - A teal inner ring marks days where an agreed swap falls on a holiday or no-school day.
  - Events: a red bar across the top of the square for `holiday` and `school`, ✈ for `trip`, a grey dot for `other`. There are no text badges.
  - Tap a day for a detail panel (who has Zoe, swaps, events). Read-only.
  - The viewed month is remembered in `localStorage` (`gs.calendarMonth`; the Holidays calendar uses `gs.holidayCalendarMonth`). **Never rename these keys.** After saving a record, the calendar jumps to the month of its start date.
- **"I am" selector** — Aaron / Rebecca / Lisa. Self-declared, not verified. It sets the audit actor, the draft sender and who can withdraw.
- **+ Swap / + Event forms** — create records, each audited. The end date follows the start date, so the iPhone picker opens in the right month. Refetching after a save keeps the page mounted (`loading` is true only on first load), so open forms and the calendar month survive.
- **Mark agreed** — one click by any actor, on swaps and events. Audited.
- **Withdraw** — on a swap or trade side that is still waiting, shown to the household that asked, after a confirm. Audited as `delete`.
- **Holidays view** — every `holiday` and `school` event, with an **institution** chip, a left-edge color (DCPS gold, UMN maroon) and **All / DCPS / UMN** filter pills that apply to both views, as a **List** (grouped by month, upcoming first, "Show past" toggle; shows who has Zoe, Noah's events tagged, holiday swaps highlighted) or a **Calendar** of only those events.
- **Trades** — each one-sided swap has **Add the other side (trade)**. The form is prefilled with a same-length return window (`suggestReturn`, §6); with no suggestion it starts one week after the first side. It creates the return swap as `proposed`. A trade shows as one card with **Mark both agreed**. Linking the original swap is audited.
- **Swaps during holidays** — one card per agreed swap that lands on a holiday or no-school day, in plain words ("Aaron/Rebecca have Zoe Sat, Dec 26 – Sun, Dec 27 instead of Lisa, during Winter Break"), with an explanation that this is allowed. Event status is ignored.
- **Suggest other dates** — optional button on each of those cards (§6). It writes a copyable text and changes nothing in the app.
- **Lists** — all swaps and all events with status, with readable dates ("Fri, Dec 11 – Mon, Dec 14"). Status `proposed` reads "asked, waiting".

## 6. Holiday swap → Suggest other dates (draft message)

1. `suggestAlternate(swap, event, ctx)` (`src/lib/suggest.js`) computes an alternate window. **Deterministic — not AI. Do not replace with a model call.** It keeps the swap length and the swap's `default_parent`:
   - First it tries the window right before the event, then right after, accepting one only if both ends fall in weeks where `default_parent` is unchanged.
   - Otherwise it moves the same window by whole 2-week steps (±2, ±4, ±6 weeks, earlier first, nearest first). A 14-day step keeps every day's default household, which is what makes full-week swaps work.
   - `ctx` is `{ swaps, events, today }`. A candidate is skipped if it overlaps another holiday or school event, another agreed swap, or starts before `today`.
   - Returns `null` if nothing fits, and the draft asks to discuss.
2. `Dashboard.jsx` POSTs `{ sender, alternate, conflict }` to `/.netlify/functions/draft-message`, where `conflict` is `{ swapStart, swapEnd, eventTitle, eventCategory, eventStart, eventEnd }`.
3. The function asks Claude for a text under 320 characters, addressed to the other household (Lisa, or Aaron and Rebecca when the sender is Lisa), using only the supplied dates, proposing the alternate and inviting a counter. With a `null` alternate it asks to discuss. Returns `{ text }`; on failure `{ error }` with status 502 or 500.
4. The card shows a loading state, an error state, the draft with **Copy**, and **Redraft**. Code fences are stripped from the response.
5. **Drafting is read-only and writes no audit row.**

`suggestReturn(swap, ctx)` (same file) suggests the return side of a trade: same length, shifted by whole weeks (later before earlier, nearest first, up to 8 weeks), with every day held by default by the household that received the swap, skipping holidays, no-school days, other agreed swaps and past dates. Both suggestion functions ignore Noah-only events. Deterministic, not AI.

`ConflictCard` is declared at module scope on purpose: defined inside `Dashboard()`, it would remount every render and wipe the draft.

## 7. Configuration

| Variable | Set in | Visible to browser | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Netlify (build) and `.env.local` | Yes, by design | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Netlify (build) and `.env.local` | Yes, by design | Supabase anon key |
| `ANTHROPIC_API_KEY` | Netlify (Functions) | **No — never** | Claude API. No `VITE_` prefix. |

Netlify reads env vars at build time: after changing any variable, run **Deploys → Trigger deploy → Clear cache and deploy site**. `keep-alive.js` reads the two `VITE_SUPABASE_*` variables at runtime, so they must also be available to Functions. There is no `netlify.toml`.

## 8. Operations

| Symptom | Cause | Fix |
|---|---|---|
| Page shows `Error: TypeError: Failed to fetch` | Free-tier Supabase project paused after ~7 days idle. The project hostname returns DNS NXDOMAIN. | Supabase dashboard → **Restore project**; wait a few minutes. This project stays resumable until 2027-08-24. |
| Draft button: `invalid x-api-key` | `ANTHROPIC_API_KEY` missing or stale in Netlify | Create a key in the Anthropic Console, set it in Netlify, redeploy with cache cleared |
| Draft button: other error | Read the message in the card; a bad `model` string looks like a key error | Check `draft-message.js` |

**Pause prevention:** `keep-alive.js` runs daily at 00:00 UTC and reads one row (read-only, no audit row). Check Netlify → Functions → keep-alive → logs for `Supabase responded 200`. If it logs an error or stops running, the project pauses after about 7 idle days.

`ERR_BLOCKED_BY_CLIENT` lines in the browser console are unrelated tracker blocking, not a Supabase fault.

## 9. Not built

Original spec items that do not exist yet:

- Audit log viewer (rows are fetched but not displayed)
- Edit flows. The only delete is **Withdraw** for waiting swaps. Events cannot be edited or deleted.
- Setting `needs_discussion` from the UI
- Per-household approval — one click by anyone marks a record agreed
- Hard-to-guess URL slug — the site is on its plain Netlify address
- Auth. Out of scope until deliberately started.
- School-calendar auto-fetch (2026-27 dates were loaded once with `supabase/seed-2026-27.sql`), push/SMS notifications, full Noah scheduling

## 10. Known limitations and open decisions

- **Anyone with the URL can read and write.** Permissive anon RLS plus a public site, until auth lands.
- **Seed gaps:** UMN dates (Thanksgiving Nov 23–27, spring break Mar 8–12) came from pasted UMN One Stop calendar text, not the registrar page itself; recheck if it matters. DCPS 2026-11-02 and 2027-04-09 are listed as half days in the district sidebar but no school in its monthly pages; they are seeded as no school.
- **Tallies are only as complete as the swap history entered.** Swaps before the "since" date are not counted.
- **Week 53:** `defaultHousehold` uses ISO-week parity. 2026 has 53 ISO weeks, so week 53 (Dec 28, 2026 – Jan 3, 2027) and week 1 (Jan 4–10) are both odd and Aaron/Rebecca hold two weeks in a row. The next 53-week year is 2032. The fix, when approved, is to append a rule to `schedule.js`, never to edit history.
- **Swaps spanning a handover** (for example Fri–Mon) include days the receiving household already holds by default, and the swap balance counts them.

## 11. Conventions

Working rules for Claude Code (file headers, diffs, do-not-touch list) live in `CLAUDE.md`. Markdown docs carry YAML frontmatter (`type`, `status`, `updated`).

## 12. Last verified

**2026-10-24 and 2026-10-25, live.**
- **Draft message:** with a test swap (Nov 25–27) and holiday (Nov 26–27), the draft's dates matched `suggestAlternate` exactly (alternate Nov 23–25). Called as Aaron it is addressed to Lisa; as Lisa, to the other household.
- **Keep-alive:** a manual run from Netlify logged `Supabase responded 200`.
- **Full-week swap:** a Mon–Sun swap (Nov 23–29) colliding with a holiday (Nov 26–27) produced a draft proposing Nov 9–15, the window `suggestAlternate` computes (14 days earlier, same default household).
- **Calendar, Holidays view and seed (live):** the test rows were removed and `supabase/seed-2026-27.sql` loaded 25 events with no duplicates. The Holidays list renders with "Zoe with …" for each Zoe event, and Noah's UMN events show tagged "Noah". With zero swaps both tiles read "Even … no agreed swaps yet".
- **Holiday swap tally (live):** an agreed swap Dec 26–27, 2026 produced Swap balance "Aaron/Rebecca +2" and Holiday swaps "Aaron/Rebecca +1", both "since Dec 26, 2026", and one card naming Winter Break. A swap on a Noah-only break was tested locally and correctly not counted.
- **11a and calendar declutter (live, Aaron on iPhone, 2026-10-25):** ribbons, Next week row, week numbers with the odd/even legend, remembered month, jump to the saved record's month, readable dates, Withdraw, plain explanations, prefilled dates in forms, taller squares, red top bar for holiday and no school, ✈ for trips. The live site's text confirms the tile explanations, the legend, the "Next week" divider and the "Suggest other dates" wording.
