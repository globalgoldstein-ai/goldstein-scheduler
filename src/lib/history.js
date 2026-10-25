// Goldstein Scheduler | Phase 11 | Session 5 | Build 3 | 2026-10-25 16:44 ET | history: turn audit rows into plain-words sentences and field-by-field changes (pure, read-only)

import { parseDate, householdLabel } from './schedule.js';
import { categoryLabel } from './labels.js';

const cap = (a) => (a ? a[0].toUpperCase() + a.slice(1) : 'Someone');
const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);
const STATUS = { proposed: 'asked, waiting', agreed: 'agreed', needs_discussion: 'needs discussion' };

export const FIELD_LABEL = {
  date_start: 'First day', date_end: 'Last day', status: 'Status', notes: 'Notes', title: 'Title', kid: 'Kid',
  category: 'Type', institution: 'School', receiving_parent: 'Gets Zoe', default_parent: 'Normally has Zoe',
  proposed_by: 'Asked by', trade_id: 'Trade link',
};
const SKIP = new Set(['id', 'created_at', 'updated_at']);

const show = (k, v) => {
  if (v == null || v === '') return 'empty';
  if (k === 'status') return STATUS[v] ?? v;
  if (k === 'receiving_parent' || k === 'default_parent') return householdLabel(v);
  if (k === 'proposed_by') return cap(v);
  if (k === 'category') return categoryLabel(v);
  if (k === 'trade_id') return 'linked';
  if (k === 'date_start' || k === 'date_end') return nice(v);
  return String(v);
};

// [{ field, before, after }] for every field that differs (or, for create/delete, every field set).
export function changedFields(before, after) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter((k) => !SKIP.has(k));
  return keys
    .filter((k) => JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after?.[k] ?? null))
    .map((k) => ({ field: FIELD_LABEL[k] ?? k, key: k, before: before ? show(k, before[k]) : null, after: after ? show(k, after[k]) : null }));
}

// One audit row -> { who, text, details }. Never throws on odd rows.
export function describe(row) {
  const who = cap(row.actor);
  const b = row.before ?? null;
  const a = row.after ?? null;
  const rec = a ?? b ?? {};
  const details = changedFields(b, a);
  let text;

  if (row.entity_type === 'swap') {
    const hh = rec.receiving_parent ? ` ${householdLabel(rec.receiving_parent)} would have Zoe.` : '';
    if (row.action === 'create') {
      text = rec.trade_id
        ? `${who} added the return side of a trade: ${span(rec)}.${hh}`
        : `${who} asked for ${span(rec)}.${hh}`;
    } else if (row.action === 'delete') {
      text = `${who} withdrew the request for ${span(rec)}.`;
    } else {
      const parts = [];
      const c = Object.fromEntries(details.map((d) => [d.key, d]));
      if (c.date_start || c.date_end) parts.push(`changed the days from ${span(b)} to ${span(a)}`);
      if (c.status) {
        parts.push(a.status === 'agreed' ? 'agreed' : a.status === 'needs_discussion' ? 'marked it "needs discussion"' : 'set it back to asked, waiting');
      }
      if (c.notes) parts.push('changed the note');
      if (c.trade_id && parts.length === 0) parts.push('linked it to a trade');
      text = `${who} ${parts.length ? parts.join(', ') : 'edited'} (${span(a ?? b)}).`;
    }
  } else if (row.entity_type === 'event') {
    const name = `"${rec.title ?? 'event'}"`;
    if (row.action === 'create') text = `${who} added ${categoryLabel(rec.category ?? 'other').toLowerCase()} ${name}, ${rec.date_start ? span(rec) : ''}.`;
    else if (row.action === 'delete') text = `${who} removed ${name}.`;
    else if (b && a && b.status !== a.status) {
      text = `${who} ${a.status === 'agreed' ? 'agreed to' : 'changed the status of'} ${name}.`;
    } else text = `${who} edited ${name}.`;
  } else {
    text = `${who} ${row.action} ${row.entity_type ?? 'record'}.`;
  }
  return { who, text, details };
}

export const whenET = (ts) =>
  new Date(ts).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
