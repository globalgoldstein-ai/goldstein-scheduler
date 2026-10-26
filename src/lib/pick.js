// Goldstein Scheduler | Phase 11 | Session 6 | Build 2 | 2026-10-25 20:38 ET | tap-to-select rules for swaps and swap changes: the range may include your own days (pure, no I/O)

import { householdLabel, parseDate, borrowedDays } from './schedule.js';

const DAY = 86400000;
export const otherHousehold = (h) => (h === 'lisa' ? 'aaron_rebecca' : 'lisa');
export const dayCount = (start, end) => Math.round((parseDate(end) - parseDate(start)) / DAY) + 1;

// pick = { kind: 'ask' | 'edit', receiving, original?, start, end, suggested, err }
//   receiving : the household that would have Zoe (the asker's own household, or the original swap's).
// The range may include days the receiving household already holds (a two-week trip with one
// week borrowed). It only has to include at least one day the OTHER household holds by default;
// only those borrowed days count toward the swap balance.

// Returns a plain-words problem with start..end, or null when it is fine.
export function rangeProblem(pick, start, end) {
  if (!start || !end) return 'Pick the first and last day.';
  if (end < start) return 'The last day must be on or after the first day.';
  if (borrowedDays(start, end, pick.receiving) === 0) {
    return `${householdLabel(pick.receiving)} already ${pick.receiving === 'lisa' ? 'has' : 'have'} Zoe on all of those days. Include at least one of ${householdLabel(otherHousehold(pick.receiving))}'s days.`;
  }
  return null;
}

// How many of the days in the range are borrowed (count toward the balance).
export const borrowedIn = (pick, start, end) => borrowedDays(start, end, pick.receiving);

// Who would have Zoe if this request is agreed.
export const receivingFor = (pick) => pick.receiving;
