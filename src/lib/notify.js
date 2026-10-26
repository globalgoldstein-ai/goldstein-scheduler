// Goldstein Scheduler | Phase 11 | Session 6 | Build 6 | 2026-10-25 21:59 ET | email alert after every logged change: headline, facts, who must respond (fire and forget, never blocks a save)
import { describe } from './history.js';
import { parseDate, householdLabel } from './schedule.js';
import { householdOf, otherHousehold } from './people.js';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);
const MON = (s) => parseDate(s).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
const DOM = (s) => parseDate(s).getUTCDate();
// Short dates for the subject line: "Nov 12", "Nov 12–14", "Oct 28 – Nov 3".
const short = (r) => (r.date_start === r.date_end ? `${MON(r.date_start)} ${DOM(r.date_start)}`
  : MON(r.date_start) === MON(r.date_end) ? `${MON(r.date_start)} ${DOM(r.date_start)}–${DOM(r.date_end)}`
  : `${MON(r.date_start)} ${DOM(r.date_start)} – ${MON(r.date_end)} ${DOM(r.date_end)}`);
const cap = (a) => (a ? a[0].toUpperCase() + a.slice(1) : 'Someone');

// Structured copy for the email. Returns null fields for anything that is not a swap.
export function buildAlert(row) {
  const { text, details } = describe(row);
  const rec = row.after ?? row.before ?? {};
  const who = cap(row.actor);
  const base = { actor: row.actor, headline: text, subject: text, facts: [], lines: [], swapId: null, needs: null };
  if (row.entity_type !== 'swap') {
    return { ...base, lines: (details ?? []).filter((d) => d.key !== 'trade_id').map((d) => `${d.field}: ${d.before ?? 'empty'} → ${d.after ?? 'empty'}`) };
  }

  const b = row.before; const a = row.after;
  const when = span(rec);
  const datesChanged = !!(b && a && (b.date_start !== a.date_start || b.date_end !== a.date_end));
  const s = short(rec);
  let headline; let subject; let needs = null;
  if (row.action === 'create') { headline = `${who} is asking for ${when}`; subject = `${who} asks for ${s}`; needs = a.status === 'proposed' ? otherHousehold(householdOf(row.actor)) : null; }
  else if (row.action === 'delete') { headline = `${who} cancelled ${b?.status === 'agreed' ? 'the agreed swap' : 'the request'} for ${when}`; subject = `${who} cancelled ${s}`; }
  else if (a?.status === 'agreed' && b?.status !== 'agreed') { headline = `${who} agreed to ${when}`; subject = `${who} agreed to ${s}`; }
  else if (a?.status === 'needs_discussion' && b?.status !== 'needs_discussion') { headline = `${who} wants to talk about ${when}`; subject = `${who} wants to talk about ${s}`; needs = householdOf(a.proposed_by); }
  else if (datesChanged) { headline = `${who} changed the days to ${when}`; subject = `${who} changed it to ${s}`; needs = a.status === 'proposed' ? otherHousehold(householdOf(row.actor)) : null; }
  else { headline = `${who} edited the note for ${when}`; subject = `${who} edited the note for ${s}`; }

  const facts = [['Days', when]];
  if (rec.receiving_parent) facts.push(['Zoe would be with', householdLabel(rec.receiving_parent)]);
  if (rec.default_parent) facts.push(['Normally with', householdLabel(rec.default_parent)]);
  if (rec.notes) facts.push(['Note', rec.notes]);
  const lines = row.action === 'edit' && datesChanged ? [`Was: ${span(b)}`] : [];
  return { actor: row.actor, headline, subject, facts, lines, swapId: row.action === 'delete' ? null : row.entity_id, needs };
}

// The Netlify Function decides who receives it (BETA: only Aaron). Failure is silent:
// an email problem must never undo a swap.
export function notifyChange(row) {
  try {
    fetch('/.netlify/functions/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildAlert(row)),
      keepalive: true,
    }).catch(() => {});
  } catch { /* never throw */ }
}
