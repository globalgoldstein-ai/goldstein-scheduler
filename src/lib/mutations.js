// Goldstein Scheduler | Phase 11 | Session 6 | Build 2 | 2026-10-25 20:38 ET | write layer: swaps (range may include own days) + events + cancel + edit swap, each audited

import { supabase } from '../supabaseClient.js';
import { logAudit } from './audit.js';
import { borrowedDays } from './schedule.js';
import { otherHousehold } from './pick.js';

// CREATE SWAP — default_parent is snapshotted from the schedule engine at
// creation time and never back-rewritten (core invariant).
export async function createSwap({ date_start, date_end, receiving_parent, status, proposed_by, notes, trade_id = null }, actor) {
  // default_parent = the household that lends the days. The range may also include days the receiver
  // already holds, but it must borrow at least one.
  const default_parent = otherHousehold(receiving_parent);
  if (borrowedDays(date_start, date_end, receiving_parent) === 0) {
    return { data: null, error: { message: 'That household already has Zoe on all of those days — no swap needed.' } };
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

// CANCEL — remove a swap (waiting, "let's talk" or agreed); the regular schedule applies again.
// Anyone can do it; the audit row (action 'delete') keeps the full deleted record and shows in History.
export async function cancelSwap(row, actor) {
  const { error } = await supabase.from('swaps').delete().eq('id', row.id);
  if (error) return { error };
  await logAudit({ actor, action: 'delete', entityType: 'swap', entityId: row.id, before: row });
  return { error: null };
}

// EDIT SWAP — new dates and/or notes. default_parent and receiving_parent never change.
// The range may include the receiver's own days but must still borrow at least one.
// Changing dates counts as a new ask: status goes back to 'proposed' and the editor becomes
// proposed_by, so the other household has to agree again. A notes-only edit leaves status alone.
// The update only matches while status is unchanged since the row was loaded.
export async function updateSwap(row, { date_start, date_end, notes }, actor) {
  if (!date_start || !date_end || date_end < date_start) {
    return { data: null, error: { message: 'Pick the first and last day.' } };
  }
  if (borrowedDays(date_start, date_end, row.receiving_parent) === 0) {
    return { data: null, error: { message: 'That household already has Zoe on all of those days.' } };
  }
  const note = (notes ?? '').trim() || null;
  const datesChanged = date_start !== row.date_start || date_end !== row.date_end;
  if (!datesChanged && note === (row.notes ?? null)) return { data: row, error: { message: 'Nothing changed.' } };
  const patch = { date_start, date_end, notes: note };
  if (datesChanged) { patch.status = 'proposed'; patch.proposed_by = actor; }
  const { data, error } = await supabase
    .from('swaps').update(patch).eq('id', row.id).eq('status', row.status).select().single();
  if (error) return { data: null, error: { message: 'This swap changed since you opened it. Close it, reload, and try again.' } };
  await logAudit({ actor, action: 'edit', entityType: 'swap', entityId: row.id, before: row, after: data });
  return { data, error: null };
}
