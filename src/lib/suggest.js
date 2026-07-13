// Goldstein Scheduler | Phase 7 | Session 1 | Build 1 | 2026-07-13 00:48 ET | alternate-window suggestion (deterministic)

import { parseDate, defaultHousehold } from './schedule.js';

const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const shift = (dateStr, days) => iso(new Date(parseDate(dateStr).getTime() + days * DAY));
const overlaps = (aS, aE, bS, bE) => parseDate(aS) <= parseDate(bE) && parseDate(bS) <= parseDate(aE);

// Propose an alternate window for a swap that collides with an event.
// Preserves swap length. Tries BEFORE the event, then AFTER. Must land in a
// week where the same household is still the receiving side (i.e. the default
// parent is unchanged) — otherwise the swap stops meaning the same thing.
export function suggestAlternate(swap, event) {
  const len = Math.round((parseDate(swap.date_end) - parseDate(swap.date_start)) / DAY);

  const candidates = [
    // end the day before the event starts
    { date_start: shift(event.date_start, -1 - len), date_end: shift(event.date_start, -1) },
    // start the day after the event ends
    { date_start: shift(event.date_end, 1), date_end: shift(event.date_end, 1 + len) },
  ];

  for (const c of candidates) {
    if (overlaps(c.date_start, c.date_end, event.date_start, event.date_end)) continue;
    if (defaultHousehold(c.date_start) !== swap.default_parent) continue;
    if (defaultHousehold(c.date_end) !== swap.default_parent) continue;
    return c;
  }
  return null; // no clean window — humans need to talk
}
