// Goldstein Scheduler | Phase 10 | Session 3 | Build 1 | 2026-10-24 14:13 ET | alternate-window + trade-return suggestions (deterministic)

import { parseDate, defaultHousehold } from './schedule.js';
import { isHolidayEvent } from './conflicts.js';

const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const shift = (dateStr, days) => iso(new Date(parseDate(dateStr).getTime() + days * DAY));
const overlaps = (aS, aE, bS, bE) => parseDate(aS) <= parseDate(bE) && parseDate(bS) <= parseDate(aE);

// Propose an alternate window for a swap that collides with an event.
// Pure and deterministic: no clock, no model. Preserves swap length and the
// default parent, so the swap still means the same thing.
//
//   ctx = { swaps, events, today }  (all optional)
//   - swaps/events: other records the new window must not collide with
//   - today: 'YYYY-MM-DD'; windows starting before it are skipped
//
// 1) Nearest window right BEFORE the event, then right AFTER. Both ends must
//    fall in weeks where the swap's default parent is unchanged.
// 2) Otherwise the same window moved by whole 2-week steps (earlier first,
//    nearest first, up to MAX_WEEKS). A 14-day step keeps every day's default
//    household, so no parity check is needed. This is what makes full-week
//    swaps work.
// Returns null when nothing fits: humans need to talk.
const MAX_WEEKS = 6;

export function suggestAlternate(swap, event, ctx = {}) {
  const { swaps = [], events = [], today = null } = ctx;
  const len = Math.round((parseDate(swap.date_end) - parseDate(swap.date_start)) / DAY);

  const blockers = [
    { s: event.date_start, e: event.date_end },
    ...events
      .filter(isHolidayEvent) // Noah-only breaks never block Zoe's windows
      .map((x) => ({ s: x.date_start, e: x.date_end })),
    ...swaps
      .filter((x) => x.status === 'agreed' && x.id !== swap.id)
      .map((x) => ({ s: x.date_start, e: x.date_end })),
  ];

  const free = (c) =>
    (!today || c.date_start >= today) &&
    !blockers.some((b) => overlaps(c.date_start, c.date_end, b.s, b.e));

  const sameHolder = (c) =>
    defaultHousehold(c.date_start) === swap.default_parent &&
    defaultHousehold(c.date_end) === swap.default_parent;

  const near = [
    // end the day before the event starts
    { date_start: shift(event.date_start, -1 - len), date_end: shift(event.date_start, -1) },
    // start the day after the event ends
    { date_start: shift(event.date_end, 1), date_end: shift(event.date_end, 1 + len) },
  ];
  for (const c of near) if (free(c) && sameHolder(c)) return c;

  for (let k = 1; k <= Math.ceil(MAX_WEEKS / 2); k++) {
    for (const dir of [-1, 1]) {
      const d = dir * 14 * k;
      const c = { date_start: shift(swap.date_start, d), date_end: shift(swap.date_end, d) };
      if (free(c)) return c;
    }
  }
  return null;
}

// Return side of a trade ("switch this weekend for next"). The household that
// received days gives the same number back, so the window must sit on days that
// household holds by default. Same length as the swap; nearest week first, later
// before earlier; skips holidays, no-school days, agreed swaps and past dates.
// Returns null when nothing fits within MAX_RETURN_WEEKS.
const MAX_RETURN_WEEKS = 8;

export function suggestReturn(swap, ctx = {}) {
  const { swaps = [], events = [], today = null } = ctx;
  const len = Math.round((parseDate(swap.date_end) - parseDate(swap.date_start)) / DAY);

  const blockers = [
    { s: swap.date_start, e: swap.date_end },
    ...events.filter(isHolidayEvent).map((x) => ({ s: x.date_start, e: x.date_end })),
    ...swaps.filter((x) => x.status === 'agreed' && x.id !== swap.id).map((x) => ({ s: x.date_start, e: x.date_end })),
  ];

  const everyDayHeld = (c) => {
    for (let i = 0; i <= len; i++) {
      if (defaultHousehold(shift(c.date_start, i)) !== swap.receiving_parent) return false;
    }
    return true;
  };

  const ok = (c) =>
    (!today || c.date_start >= today) &&
    !blockers.some((b) => overlaps(c.date_start, c.date_end, b.s, b.e)) &&
    everyDayHeld(c);

  for (let k = 1; k <= MAX_RETURN_WEEKS; k++) {
    for (const dir of [1, -1]) {
      const d = dir * 7 * k;
      const c = { date_start: shift(swap.date_start, d), date_end: shift(swap.date_end, d) };
      if (ok(c)) return c;
    }
  }
  return null;
}
