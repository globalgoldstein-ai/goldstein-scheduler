// Goldstein Scheduler | Phase 3 | Session 1 | Build 1 | 2026-07-03 12:41 ET | conflict detection

import { parseDate, householdLabel } from './schedule.js';

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

// Flag every AGREED swap overlapping a holiday or school event.
// Returns [{ swap, event, overlapDays, message }] — feed straight to the UI.
export function detectConflicts(swaps = [], events = []) {
  const flagged = events.filter((e) => e.category === 'holiday' || e.category === 'school');
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
            `Agreed swap to ${householdLabel(swap.receiving_parent)} ` +
            `(${swap.date_start}–${swap.date_end}) overlaps ${ev.category} "${ev.title}" ` +
            `(${ev.date_start}–${ev.date_end}).`,
        });
      }
    }
  }
  return out;
}
