// Goldstein Scheduler | Phase 9 | Session 3 | Build 2 | 2026-10-24 13:44 ET | holiday swap detection (was: conflict detection)

import { parseDate, householdLabel } from './schedule.js';
import { categoryLabel } from './labels.js';

const inclusiveDays = (start, end) =>
  Math.round((parseDate(end) - parseDate(start)) / 86400000) + 1;

// Do two inclusive date ranges overlap?
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return parseDate(aStart) <= parseDate(bEnd) && parseDate(bStart) <= parseDate(aEnd);
}

function overlapDays(swap, ev) {
  const start = parseDate(swap.date_start) > parseDate(ev.date_start) ? swap.date_start : ev.date_start;
  const end = parseDate(swap.date_end) < parseDate(ev.date_end) ? swap.date_end : ev.date_end;
  return inclusiveDays(start, end);
}

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
