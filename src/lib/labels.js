// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | display labels and institution colors (stored values never change); day-off bar colours and words

// DB values stay holiday | school | trip | other; only the wording shown to people changes.
export const CATEGORY_LABEL = { holiday: 'Holiday', school: 'No school', trip: 'Trip', other: 'Other' };
export const categoryLabel = (c) => CATEGORY_LABEL[c] ?? c;

export const KID_LABEL = { zoe: 'Zoe', noah: 'Noah', both: 'Both' };
export const kidLabel = (k) => KID_LABEL[k] ?? k;

// Institutions an event can belong to (events.institution, nullable text).
// Colors are separate from category colors (red/blue) and household colors (green/purple).
export const INSTITUTIONS = {
  DCPS: { name: 'DCPS', fg: '#8a5a00', bg: '#fff3d6', edge: '#e0a100' },
  UMN: { name: 'UMN', fg: '#7a0019', bg: '#fbe4e9', edge: '#7a0019' },
};
export const institutionStyle = (i) => INSTITUTIONS[i] ?? null;

// Day-off bars on the calendar: colour says whose day off, one word says what.
//   DCPS = gold (Zoe's school), UMN = maroon (Noah's college), no institution = red (family holiday).
export const FAMILY_RED = '#c62828';
export const dayOffKind = (e) => (e.institution === 'DCPS' ? 'dcps' : e.institution === 'UMN' ? 'umn' : 'family');
export const dayOffColor = (e) => INSTITUTIONS[e.institution]?.edge ?? FAMILY_RED;
// Short word for the first day of a break: "Thanksgiving", "Election", "No school", "Noah off".
export function dayOffLabel(e) {
  if (e.institution === 'UMN') return 'Noah off';
  const t = String(e.title ?? '').replace(/\s+(break|recess|holiday|day off)$/i, '').trim();
  if (!t) return 'No school';
  if (t.length <= 9) return t;
  const first = t.split(/\s+/)[0];
  return first.length <= 9 ? first : first.slice(0, 8) + '…';
}
