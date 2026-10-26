---
type: app
status: active
updated: 2026-10-26
app: Goldstein Scheduler
---
<!-- Goldstein Scheduler | Phase 11 | Session 6 | Build 7 | 2026-10-26 08:19 ET | CLAUDE.md: steering file for Claude Code -->

# CLAUDE.md — Goldstein Scheduler

Steering for Claude Code in this repo. **Read `REQUIREMENTS.md` first.** It is the canonical spec and the current deployed state; this file does not restate it.

## Working rules
- Edit with diffs, not rewrites.
- First line of every source file: `// Goldstein Scheduler | Phase N | Session N | Build N | YYYY-MM-DD HH:MM ET | description`. Update it on every change. Build increments on each retry within a session.
- Markdown docs: YAML frontmatter first (`type`, `status`, `updated`), then the same header as an HTML comment.
- Do not touch schema, RLS, `schedule.js` parity logic, `swapBalance` / `borrowedDays` (the balance counts only borrowed days, by Aaron's explicit decision 2026-10-25), or the append-only audit constraint without an explicit decision.
- Email alerts (`netlify/functions/notify.js`, `src/lib/notify.js`) must never block or undo a save. Recipients and credentials live only in Netlify env vars, never in the repo. Beta sends only to Aaron until `ALERT_LIVE=true`.
- localStorage keys never change: `gs.actor`, `gs.calendarMonth`, `gs.holidayCalendarMonth`.
- `suggest.js` stays deterministic. Never replace it with a model call.
- Drafting is read-only: no audit rows.
- Claude API calls live only in `netlify/functions/`, using `ANTHROPIC_API_KEY` (no `VITE_` prefix, never in browser code).
- Never commit `.env*` or `dist/`.

## After a verified deploy
Update `REQUIREMENTS.md` to the new current state (not a changelog), including its `updated` date and header. Record decisions and ideas in the vault hub note `Apps/Goldstein Scheduler.md`, not here.
