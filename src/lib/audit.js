// Goldstein Scheduler | Phase 6 | Session 1 | Build 1 | 2026-07-03 13:44 ET | audit helper: append-only change log

import { supabase } from '../supabaseClient.js';

// Append one audit row. NEVER throws — returns { data, error } so an audit
// failure can't mask or roll back the primary write it's logging.
export async function logAudit({ actor, action, entityType, entityId, before = null, after = null }) {
  try {
    const { data, error } = await supabase.from('audit_log').insert({
      actor,
      action,                 // create | edit | delete
      entity_type: entityType, // swap | event
      entity_id: entityId,
      before,
      after,
    }).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
