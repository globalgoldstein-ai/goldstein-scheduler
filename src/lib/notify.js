// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 21:10 ET | email alert after every logged change (fire and forget, never blocks a save)
import { describe } from './history.js';

// Sends the same plain sentence History shows, plus the changed fields. The Netlify Function
// decides who receives it (BETA: only Aaron). Failure is silent: an email problem must never undo a swap.
export function notifyChange(row) {
  try {
    const { text, details } = describe(row);
    const lines = (details ?? []).filter((d) => d.key !== 'trade_id').map((d) => `${d.field}: ${d.before ?? 'empty'} → ${d.after ?? 'empty'}`);
    fetch('/.netlify/functions/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ actor: row.actor, text, lines }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* never throw */ }
}
