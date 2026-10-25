// Goldstein Scheduler | Phase 11 | Session 6 | Build 1 | 2026-10-25 17:14 ET | right now: who has Zoe today and when it changes (pure, read-only)
import { effectiveHousehold, parseDate } from './schedule.js';

const iso = (d) => d.toISOString().slice(0, 10);
const plus = (s, n) => iso(new Date(parseDate(s).getTime() + n * 86400000));

// { holder, until, next: { holder, from } | null }. "until" is the last day of this stretch.
export function rightNow(swaps = [], today, horizon = 120) {
  const holder = effectiveHousehold(today, swaps);
  let last = today;
  for (let i = 1; i <= horizon; i++) {
    const d = plus(today, i);
    const h = effectiveHousehold(d, swaps);
    if (h !== holder) return { holder, until: last, next: { holder: h, from: d } };
    last = d;
  }
  return { holder, until: null, next: null };
}
