// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 21:10 ET | audit helper: append-only change log

import { supabase } from '../supabaseClient.js';
import { notifyChange } from './notify.js';

// Append one audit row, then fire the email alert (notify.js). NEVER throws — returns { data, error } so an audit
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
    if (!error) notifyChange(data ?? { actor, action, entity_type: entityType, entity_id: entityId, before, after });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
