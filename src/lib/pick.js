// Goldstein Scheduler | Phase 11 | Session 5 | Build 3 | 2026-10-25 16:44 ET | tap-to-select rules for swaps, trade returns and swap edits (pure, no I/O)

import { defaultHousehold, householdLabel, parseDate } from './schedule.js';

const DAY = 86400000;
export const otherHousehold = (h) => (h === 'lisa' ? 'aaron_rebecca' : 'lisa');
export const dayCount = (start, end) => Math.round((parseDate(end) - parseDate(start)) / DAY) + 1;

// pick = { kind: 'ask' | 'return' | 'edit', original?, start, end, suggested, err }
//   ask    : every day must be held, by default, by whoever holds the FIRST day
//            (createSwap derives the receiving household from the start date).
//   return : every day must be held by default by the household that received
//            the original swap (it gives days back out of its own weeks).
//   edit   : every day must be held by default by the swap's own default_parent,
//            so default_parent and the receiving household never change.

// Household whose default days may be picked right now, or null = any day.
export function holderNeeded(pick) {
  if (!pick) return null;
  if (pick.kind === 'return') return pick.original.receiving_parent;
  if (pick.kind === 'edit') return pick.original.default_parent;
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
  const need = pick.kind === 'return' ? pick.original.receiving_parent
    : pick.kind === 'edit' ? pick.original.default_parent
    : defaultHousehold(start);
  if (!allHeldBy(start, end, need)) {
    return pick.kind === 'ask'
      ? `A swap can only cover days that are ${householdLabel(need)}'s by default. Pick a shorter range, or ask again for the next stretch.`
      : `Every day must be one of ${householdLabel(need)}'s own days. Pick a shorter range.`;
  }
  return null;
}

// True when every day start..end is held by default by household h.
export function allHeldBy(start, end, h) {
  for (let t = parseDate(start).getTime(); t <= parseDate(end).getTime(); t += DAY) {
    if (defaultHousehold(new Date(t).toISOString().slice(0, 10)) !== h) return false;
  }
  return true;
}

// Who would have Zoe if this request is agreed.
export const receivingFor = (pick) =>
  pick.kind === 'return' ? pick.original.default_parent
    : pick.kind === 'edit' ? pick.original.receiving_parent
    : pick.start ? otherHousehold(defaultHousehold(pick.start)) : null;
