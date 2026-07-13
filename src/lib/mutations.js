// Goldstein Scheduler | Phase 6 | Session 1 | Build 1 | 2026-07-03 13:44 ET | write layer: swaps + events, each audited

import { supabase } from '../supabaseClient.js';
import { logAudit } from './audit.js';
import { defaultHousehold } from './schedule.js';

// CREATE SWAP — default_parent is snapshotted from the schedule engine at
// creation time and never back-rewritten (core invariant).
export async function createSwap({ date_start, date_end, receiving_parent, status, proposed_by, notes }, actor) {
  const default_parent = defaultHousehold(date_start);
  if (default_parent === receiving_parent) {
    return { data: null, error: { message: 'That household already has Zoe by default — no swap needed.' } };
  }
  const { data, error } = await supabase
    .from('swaps')
    .insert({ date_start, date_end, receiving_parent, default_parent, status, proposed_by, notes })
    .select().single();
  if (error) return { data: null, error };
  await logAudit({ actor, action: 'create', entityType: 'swap', entityId: data.id, after: data });
  return { data, error: null };
}

export async function createEvent({ title, kid, category, date_start, date_end, status, notes }, actor) {
  const { data, error } = await supabase
    .from('events')
    .insert({ title, kid, category, date_start, date_end, status, notes })
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
