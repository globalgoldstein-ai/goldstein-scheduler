<!-- Goldstein Kids Scheduler | Spec v1 | 2026-07-03 11:51 ET (Friday) | initial requirements -->

# Goldstein Kids Scheduler — REQUIREMENTS.md

## Purpose
Shared custody + event scheduler for two households co-parenting Noah (college, occasional) and Zoe (alternating weeks). Replaces the localStorage-only single-file prototype with a shared, multi-user app.

## Households (not individual parents)
- **Aaron/Rebecca** — one household (Mount Pleasant)
- **Lisa** — one household (NoMa DC)
- Approvals are per-household: an agreed swap needs both households.

## Default schedule
- Aaron/Rebecca: odd ISO weeks
- Lisa: even ISO weeks
- Week-assignment change applies only after an effective date (never rewrites past).

## Core model: default + swaps
Zoe is at the default household unless a swap says otherwise. Swaps are first-class records, not inferred from event titles.

### swaps
```
id, date_start, date_end,
receiving_parent,        -- household getting Zoe (owns the swap)
default_parent,          -- snapshotted at creation, never back-rewritten
status,                  -- proposed | agreed | needs_discussion
proposed_by,             -- who initiated
notes,                   -- links, texts, approval docs
created_at, updated_at
```
Swap "belongs to" the **receiving** household. Balance = sum of swap-days each direction.

### events (holidays, trips, one-offs)
```
id, title, kid,          -- both | noah | zoe
date_start, date_end,
status, notes, created_at, updated_at
```

### audit_log (change log)
```
id, timestamp, actor, action,   -- create | edit | delete
entity_type, entity_id, before, after
```
Append-only. Every create/edit/delete writes one row. Used for "who changed what" and recovery.

## Display rules
- Calendar: color by household (Aaron/Rebecca vs Lisa), swap days visibly marked.
- Swap notation: `Lisa → Aaron/Rebecca (3 days)` = A/R receiving during Lisa's default week.
- List + detail views show the same arrow.
- Running balance tile: who's ahead / "Even".

## Auth
None at launch. Access via hard-to-guess shared URL slug. Row-level security scaffolded in Supabase for later opt-in auth. Do not build login now.

## Conflicts
Last-write-wins. No locking. Change log provides recovery. (Three trusted adults, low edit rate.)

## Stack
- Frontend: React + Vite (complexity justifies it — shared state, multiple views)
- Backend: **Supabase** (new project under Aaron's account, not Bolt's)
- Deploy: GitHub `globalgoldstein-ai/goldstein-scheduler` → Netlify auto-deploy from main
- Replit: one-time scaffold only

## Constraints (from protocol)
- `dist/` in `.gitignore` at scaffold time
- Any Anthropic API calls (future) via Netlify Functions, env `ANTHROPIC_API_KEY` (no VITE_ prefix)
- File headers: `// Goldstein Scheduler | Phase N | Session N | Build N | YYYY-MM-DD HH:MM ET | description`
- All code changes through GitHub web UI after scaffold; never edit in Replit again

## Out of scope (v1)
- Login/auth
- School-calendar auto-fetch (DCPS/UMN)
- Push/SMS notifications
- Noah's full scheduling (occasional events only for now)

## Phase plan
1. **Scaffold** — Replit: Vite+React, folder structure, Supabase client, `.gitignore` w/ dist → push to GitHub
2. **Data layer** — Supabase tables + RLS-ready schema; wire client
3. **Read views** — calendar + list pulling live data
4. **Write flows** — add/edit swaps & events, status changes, audit writes
5. **Balance + audit UI** — swap totals, change-log view
6. **Vibe check** — share link to all three, iterate
