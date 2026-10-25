// Goldstein Scheduler | Phase 11 | Session 6 | Build 1 | 2026-10-25 17:14 ET | people: who is using this phone, household helpers, plain status words
import { householdLabel } from './schedule.js';
export { otherHousehold } from './pick.js';
import { otherHousehold } from './pick.js';

export const ACTORS = ['aaron', 'rebecca', 'lisa'];
export const householdOf = (a) => (a === 'lisa' ? 'lisa' : 'aaron_rebecca');
export const cap = (a) => (a ? a[0].toUpperCase() + a.slice(1) : '');
export const HOUSE_COLORS = {
  aaron_rebecca: { bg: '#e8f5e9', edge: '#2e7d32' },
  lisa: { bg: '#f3e5f5', edge: '#7b1fa2' },
};

// Remembered on this phone. Key name must never change. Storage can be blocked: never throw.
const KEY = 'gs.actor';
export function loadActor() {
  try { const v = localStorage.getItem(KEY); return ACTORS.includes(v) ? v : null; } catch { return null; }
}
export function saveActor(a) {
  try { localStorage.setItem(KEY, a); } catch { /* storage blocked: picker will show again next visit */ }
}

// The household that has to answer a request is the one that did not ask.
export const waitingFor = (swap) => householdLabel(otherHousehold(householdOf(swap.proposed_by)));
export const statusText = (swap) =>
  swap.status === 'agreed' ? 'Agreed' : swap.status === 'needs_discussion' ? "Let's talk" : `Waiting for ${waitingFor(swap)}`;
