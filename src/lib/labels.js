// Goldstein Scheduler | Phase 9 | Session 3 | Build 2 | 2026-10-24 13:44 ET | display labels (stored category values never change)

// DB values stay holiday | school | trip | other; only the wording shown to people changes.
export const CATEGORY_LABEL = { holiday: 'Holiday', school: 'No school', trip: 'Trip', other: 'Other' };
export const categoryLabel = (c) => CATEGORY_LABEL[c] ?? c;

export const KID_LABEL = { zoe: 'Zoe', noah: 'Noah', both: 'Both' };
export const kidLabel = (k) => KID_LABEL[k] ?? k;
