// Goldstein Scheduler | Phase 11 | Session 5 | Build 1 | 2026-10-25 16:13 ET | tap-to-select rules for swaps and trade returns (pure, no I/O)

import { defaultHousehold, householdLabel, parseDate } from './schedule.js';

const DAY = 86400000;
export const otherHousehold = (h) => (h === 'lisa' ? 'aaron_rebecca' : 'lisa');
export const dayCount = (start, end) => Math.round((parseDate(end) - parseDate(start)) / DAY) + 1;

// pick = { kind: 'ask' | 'return', original?, start, end, suggested, err }
//   ask    : every day must be held, by default, by whoever holds the FIRST day
//            (createSwap derives the receiving household from the start date).
//   return : every day must be held by default by the household that received
//            the original swap (it gives days back out of its own weeks).

// Household whose default days may be picked right now, or null = any day.
export function holderNeeded(pick) {
  if (!pick) return null;
  if (pick.kind === 'return') return pick.original.receiving_parent;
  return pick.start && !pick.end ? defaultHousehold(pick.start) : null;
}

export const dayOk = (pick, d) => {
  const need = holderNeeded(pick);
  return need == null || defaultHousehold(d) === need;
};

// Returns a plain-words problem with start..end, or null when it is fine.
export function rangeProblem(pick, start, end) {
  if (!start || !end) return 'Pick the first and last day.';
  if (end < start) return 'The last day must be on or after the first day.';
  const need = pick.kind === 'return' ? pick.original.receiving_parent : defaultHousehold(start);
  for (let t = parseDate(start).getTime(); t <= parseDate(end).getTime(); t += DAY) {
    const d = new Date(t).toISOString().slice(0, 10);
    if (defaultHousehold(d) !== need) {
      return pick.kind === 'return'
        ? `Every day must be one of ${householdLabel(need)}'s own days. Pick a shorter range.`
        : `A swap can only cover days that are ${householdLabel(need)}'s by default. Pick a shorter range, or ask again for the next stretch.`;
    }
  }
  return null;
}

// Who would have Zoe if this request is agreed.
export const receivingFor = (pick) =>
  pick.kind === 'return' ? pick.original.default_parent : pick.start ? otherHousehold(defaultHousehold(pick.start)) : null;
