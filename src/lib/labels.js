// Goldstein Scheduler | Phase 10 | Session 3 | Build 2 | 2026-10-24 14:19 ET | display labels and institution colors (stored values never change)

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
