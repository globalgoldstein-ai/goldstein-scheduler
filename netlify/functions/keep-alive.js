// Goldstein Scheduler | Phase 7 | Session 3 | Build 1 | 2026-10-24 12:51 ET | Netlify scheduled function: Supabase keep-alive (read-only)

// Free-tier Supabase pauses a project after ~7 days without database activity.
// One cheap read per day prevents that. Read-only: no writes, no audit row.
export default async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('keep-alive: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not visible to Functions');
    return;
  }
  try {
    const res = await fetch(`${url}/rest/v1/swaps?select=id&limit=1`, {
      headers: { apikey: key, authorization: `Bearer ${key}` },
    });
    if (res.ok) console.log(`keep-alive: Supabase responded ${res.status}`);
    else console.error(`keep-alive: Supabase responded ${res.status}`);
  } catch (err) {
    console.error('keep-alive failed:', err.message);
  }
};

export const config = { schedule: '@daily' }; // 00:00 UTC
