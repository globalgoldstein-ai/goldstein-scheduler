---
type: note
status: active
updated: 2026-10-24
app: Goldstein Scheduler
---
<!-- Goldstein Scheduler | Phase 7 | Session 3 | Build 1 | 2026-10-24 11:56 ET | README: pointer to canonical docs -->

# goldstein-scheduler

Shared custody and event tracker for two households. Custody is computed from rules, never typed; conflicts are detected automatically. Live at https://goldstein-scheduler.netlify.app.

- **What it does, config, and operations:** [`REQUIREMENTS.md`](./REQUIREMENTS.md) — the single canonical doc
- **Database schema:** [`supabase/schema.sql`](./supabase/schema.sql)

Local run: `npm install`, set the two `VITE_SUPABASE_*` variables in `.env.local` (names in REQUIREMENTS §7), then `npm run dev`. Push to `main` to deploy.
