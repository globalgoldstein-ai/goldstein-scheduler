---
type: app
status: active
updated: 2026-10-24
app: Goldstein Scheduler
repo: globalgoldstein-ai/goldstein-scheduler
live: https://goldstein-scheduler.netlify.app
---
<!-- Goldstein Scheduler | Phase 7 | Session 3 | Build 3 | 2026-10-24 12:44 ET | REQUIREMENTS.md: current deployed state -->

# Goldstein Kids Scheduler — REQUIREMENTS.md

**Current deployed state, not a changelog.** Describes what `main` does today (as of commit `558a88b`). History lives in git. The database schema is defined in `supabase/schema.sql`; this file records only the rules that schema cannot express.

## 1. Purpose

Shared custody and event tracker for two households. Zoe alternates weeks between them; swaps move days between households; Noah (college) appears occasionally. **Core thesis: custody is computed from rules, never typed, and conflicts are detected automatically.**

- **Aaron/Rebecca** — one household (Mount Pleasant)
- **Lisa** — one household (NoMa DC)

## 2. Stack and deploy

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite 5, inline styles, single page (`Dashboard`) |
| Database | Supabase (Postgres + RLS), project `goldstein-scheduler` |
| Server code | One Netlify Function: `netlify/functions/draft-message.js` |
| AI | Claude Sonnet (`claude-sonnet-4-6`), server-side only |
| Source of truth | GitHub `globalgoldstein-ai/goldstein-scheduler`, branch `main` |
| Production | Netlify auto-deploy from `main` → goldstein-scheduler.netlify.app |
| Build/edit | Claude Code on Windows. Replit is retired. |

## 3. Schedule rules (`src/lib/schedule.js`)

- Default holder: Aaron/Rebecca on **odd ISO weeks**, Lisa on **even**.
- Rules are effective-dated. To change parity, **append** a rule with a later `from` — never edit history.
- Effective holder = default, unless an **agreed** swap covers the date.
- Swap balance counts **agreed** swaps only, in days, per receiving household.

## 4. Data invariants

- A swap belongs to the **receiving** household. `default_parent` is snapshotted at creation and never rewritten.
- Receiving household is derived from the start date, never typed. Creating a swap for a household that already holds Zoe that week is rejected.
- Swaps are created as `proposed`. Statuses: `proposed | agreed | needs_discussion`.
- Events carry a `category` (`holiday | school | trip | other`) that drives conflict detection, and a `kid` (`zoe | noah | both`).
- `audit_log` is append-only, enforced by the database (insert + select policies only). Every create and status change writes one row with before/after JSON. An audit failure never rolls back the write it logs.
- RLS is on with permissive anon policies. There is no login.

## 5. What the app does today

- **Balance tile** — who is ahead, or "Even".
- **"I am" selector** — Aaron / Rebecca / Lisa. Self-declared, not verified. It sets the audit actor and the draft sender.
- **+ Swap / + Event forms** — create records, each audited.
- **Mark agreed** — one click by any actor, on swaps and events. Audited.
- **Conflict list** — every **agreed** swap overlapping a `holiday` or `school` event. Event status is ignored.
- **Draft message** — on each amber conflict card (§6).
- **Lists** — all swaps and all events with status.

## 6. Conflict → Draft message

1. `suggestAlternate(swap, event)` (`src/lib/suggest.js`) computes an alternate window. **Deterministic — not AI. Do not replace with a model call.** It keeps the swap length, tries before the event then after, and only accepts a window whose both ends fall in weeks where the swap's `default_parent` is unchanged. Returns `null` if none.
2. `Dashboard.jsx` POSTs `{ sender, alternate, conflict }` to `/.netlify/functions/draft-message`, where `conflict` is `{ swapStart, swapEnd, eventTitle, eventCategory, eventStart, eventEnd }`.
3. The function asks Claude for a text under 320 characters, using only the supplied dates, proposing the alternate and inviting a counter. With a `null` alternate it asks to discuss. Returns `{ text }`; on failure `{ error }` with status 502 or 500.
4. The card shows a loading state, an error state, the draft with **Copy**, and **Redraft**. Code fences are stripped from the response.
5. **Drafting is read-only and writes no audit row.**

`ConflictCard` is declared at module scope on purpose: defined inside `Dashboard()`, it would remount every render and wipe the draft.

## 7. Configuration

| Variable | Set in | Visible to browser | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Netlify (build) and `.env.local` | Yes, by design | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Netlify (build) and `.env.local` | Yes, by design | Supabase anon key |
| `ANTHROPIC_API_KEY` | Netlify (Functions) | **No — never** | Claude API. No `VITE_` prefix. |

Netlify reads env vars at build time: after changing any variable, run **Deploys → Trigger deploy → Clear cache and deploy site**. There is no `netlify.toml`.

## 8. Operations

| Symptom | Cause | Fix |
|---|---|---|
| Page shows `Error: TypeError: Failed to fetch` | Free-tier Supabase project paused after ~7 days idle. The project hostname returns DNS NXDOMAIN. | Supabase dashboard → **Restore project**; wait a few minutes. This project stays resumable until 2027-08-24. |
| Draft button: `invalid x-api-key` | `ANTHROPIC_API_KEY` missing or stale in Netlify | Create a key in the Anthropic Console, set it in Netlify, redeploy with cache cleared |
| Draft button: other error | Read the message in the card; a bad `model` string looks like a key error | Check `draft-message.js` |

`ERR_BLOCKED_BY_CLIENT` lines in the browser console are unrelated tracker blocking, not a Supabase fault.

## 9. Not built

Original spec items that do not exist yet:

- Calendar view (lists only)
- Audit log viewer (rows are fetched but not displayed)
- Edit and delete flows (create and mark-agreed only)
- Setting `needs_discussion` from the UI
- Per-household approval — one click by anyone marks a record agreed
- Hard-to-guess URL slug — the site is on its plain Netlify address
- Auth. Out of scope until deliberately started.
- School-calendar auto-fetch, push/SMS notifications, full Noah scheduling

## 10. Known limitations and open decisions

- **`suggestAlternate` returns `null` for most full-week swaps.** Measured over a year of synthetic swaps: 0% for 1–3 days, 28% for 4 days, **98% for 7 days**. Weekly rotation means a 7-day window rarely sits inside one parity week. The rule works as written; the constraint may be too strict. **Decide before relaxing it.**
- **Drafts always address Lisa.** The function prompt says "my co-parent Lisa" regardless of sender, so a draft generated with "I am: Lisa" is addressed to herself.
- **Anyone with the URL can read and write.** Permissive anon RLS plus a public site, until auth lands.
- Free-tier Supabase will pause again after idle weeks. Upgrade, or add a scheduled keep-alive.

## 11. Conventions

Working rules for Claude Code (file headers, diffs, do-not-touch list) live in `CLAUDE.md`. Markdown docs carry YAML frontmatter (`type`, `status`, `updated`).

## 12. Last verified

**2026-10-24, live.** With a test swap (Nov 25–27) and holiday (Nov 26–27), **Draft message** returned text whose dates matched `suggestAlternate` exactly (alternate Nov 23–25).
