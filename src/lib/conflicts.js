// Goldstein Scheduler | Phase 11 | Session 6 | Build 2 | 2026-10-25 20:38 ET | holiday swap detection: a borrowed day must fall on the holiday

import { parseDate, householdLabel, borrowedDays } from './schedule.js';
import { categoryLabel } from './labels.js';

const inclusiveDays = (start, end) =>
  Math.round((parseDate(end) - parseDate(start)) / 86400000) + 1;

// Do two inclusive date ranges overlap?
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return parseDate(aStart) <= parseDate(bEnd) && parseDate(bStart) <= parseDate(aEnd);
}

function overlapRange(swap, ev) {
  const start = parseDate(swap.date_start) > parseDate(ev.date_start) ? swap.date_start : ev.date_start;
  const end = parseDate(swap.date_end) < parseDate(ev.date_end) ? swap.date_end : ev.date_end;
  return { start, end };
}
const overlapDays = (swap, ev) => { const r = overlapRange(swap, ev); return inclusiveDays(r.start, r.end); };

// A holiday or no-school day that can affect Zoe's custody. Noah's own
// (college) breaks are shown in the app but never count toward Zoe's swaps.
export const isHolidayEvent = (e) =>
  (e.category === 'holiday' || e.category === 'school') && e.kid !== 'noah';

// Every AGREED swap overlapping a holiday or no-school day.
// Swapping on holidays is normal, so these are information, not errors.
// Returns [{ swap, event, overlapDays, message }] — feed straight to the UI.
// (Function name kept from Phase 3 to keep the diff small.)
export function detectConflicts(swaps = [], events = []) {
  const flagged = events.filter(isHolidayEvent);
  const out = [];
  for (const swap of swaps) {
    if (swap.status !== 'agreed') continue;
    for (const ev of flagged) {
      if (rangesOverlap(swap.date_start, swap.date_end, ev.date_start, ev.date_end)) {
        // Only a holiday swap if a day the swap BORROWS falls on it (own days on a holiday are not a swap).
        const r = overlapRange(swap, ev);
        if (borrowedDays(r.start, r.end, swap.receiving_parent) === 0) continue;
        out.push({
          swap,
          event: ev,
          overlapDays: overlapDays(swap, ev),
          message:
            `${householdLabel(swap.receiving_parent)} has Zoe ${swap.date_start}–${swap.date_end}, ` +
            `covering ${categoryLabel(ev.category).toLowerCase()} "${ev.title}" ` +
            `(${ev.date_start}–${ev.date_end}).`,
        });
      }
    }
  }
  return out;
}
