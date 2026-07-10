// Goldstein Scheduler | Phase 6 | Session 1 | Build 1 | 2026-07-10 10:41 ET | audit logging helper
import { supabase } from "../supabaseClient";

const ACTORS = ["aaron", "rebecca", "lisa"];
const ACTIONS = ["create", "edit", "delete"];
const ENTITIES = ["swap", "event"];

/**
 * Append an immutable row to audit_log.
 * Convention: create → before:null · delete → after:null · edit → both.
 * Returns { data, error }. Never throws — callers surface error non-blockingly.
 */
export async function logAudit({ actor, action, entityType, entityId, before = null, after = null }) {
  if (!ACTORS.includes(actor))
    return { data: null, error: new Error(`logAudit: bad actor "${actor}"`) };
  if (!ACTIONS.includes(action))
    return { data: null, error: new Error(`logAudit: bad action "${action}"`) };
  if (!ENTITIES.includes(entityType))
    return { data: null, error: new Error(`logAudit: bad entityType "${entityType}"`) };

  const row = {
    ts: new Date().toISOString(),
    actor,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    before,
    after,
  };

  const { data, error } = await supabase.from("audit_log").insert(row).select().single();
  if (error) console.warn("audit_log insert failed:", error.message, row);
  return { data, error };
}
