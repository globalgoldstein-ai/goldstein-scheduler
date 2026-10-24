// Goldstein Scheduler | Phase 10 | Session 3 | Build 2 | 2026-10-24 14:19 ET | write layer: swaps + events (with institution) + trades, each audited

import { supabase } from '../supabaseClient.js';
import { logAudit } from './audit.js';
import { defaultHousehold } from './schedule.js';

// CREATE SWAP — default_parent is snapshotted from the schedule engine at
// creation time and never back-rewritten (core invariant).
export async function createSwap({ date_start, date_end, receiving_parent, status, proposed_by, notes, trade_id = null }, actor) {
  const default_parent = defaultHousehold(date_start);
  if (default_parent === receiving_parent) {
    return { data: null, error: { message: 'That household already has Zoe by default — no swap needed.' } };
  }
  const { data, error } = await supabase
    .from('swaps')
    .insert({ date_start, date_end, receiving_parent, default_parent, status, proposed_by, notes, trade_id })
    .select().single();
  if (error) return { data: null, error };
  await logAudit({ actor, action: 'create', entityType: 'swap', entityId: data.id, after: data });
  return { data, error: null };
}

export async function createEvent({ title, kid, category, date_start, date_end, status, notes, institution = null }, actor) {
  const { data, error } = await supabase
    .from('events')
    .insert({ title, kid, category, date_start, date_end, status, notes, institution: institution || null })
    .select().single();
  if (error) return { data: null, error };
  await logAudit({ actor, action: 'create', entityType: 'event', entityId: data.id, after: data });
  return { data, error: null };
}

// STATUS CHANGE — works for either table; logs before + after.
export async function updateStatus(table, row, status, actor) {
  const { data, error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', row.id)
    .select().single();
  if (error) return { data: null, error };
  await logAudit({
    actor, action: 'edit',
    entityType: table === 'swaps' ? 'swap' : 'event',
    entityId: row.id, before: row, after: data,
  });
  return { data, error: null };
}

// TRADE — add the other side of an existing swap. The new swap goes BACK to the
// household that gave days up (original.default_parent); createSwap re-checks
// that this household does not already hold those days by default. Both sides
// share one trade_id. Linking the original is audited like any other edit.
export async function createTrade(original, { date_start, date_end, notes }, actor) {
  const trade_id = original.trade_id ?? crypto.randomUUID();
  const { data, error } = await createSwap(
    { date_start, date_end, receiving_parent: original.default_parent, status: 'proposed', proposed_by: actor, notes, trade_id },
    actor
  );
  if (error) return { data: null, error };
  if (!original.trade_id) {
    const { data: linked, error: linkErr } = await supabase
      .from('swaps').update({ trade_id }).eq('id', original.id).select().single();
    if (linkErr) return { data, error: { message: `Return swap saved but linking failed: ${linkErr.message}` } };
    await logAudit({ actor, action: 'edit', entityType: 'swap', entityId: original.id, before: original, after: linked });
  }
  return { data, error: null };
}

// Mark every side of a trade (or a lone swap) with the same status.
export async function updateTradeStatus(rows, status, actor) {
  for (const row of rows) {
    if (row.status === status) continue;
    const { error } = await updateStatus('swaps', row, status, actor);
    if (error) return { error };
  }
  return { error: null };
}
