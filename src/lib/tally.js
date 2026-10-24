// Goldstein Scheduler | Phase 9 | Session 3 | Build 2 | 2026-10-24 13:44 ET | tally: "since" date and holiday swap count

import { parseDate, householdLabel } from './schedule.js';
import { detectConflicts } from './conflicts.js';

const fmt = (d) => parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (a, b) => (a === b ? fmt(a) : `${fmt(a)}–${fmt(b)}`);

// Earliest agreed swap start. History before the app existed is not recorded,
// so every running total is labeled "since <this date>".
export function trackingSince(swaps = []) {
  const dates = swaps.filter((s) => s.status === 'agreed').map((s) => s.date_start).sort();
  return dates[0] ?? null;
}

// Holiday swaps = agreed swaps that land on a holiday or no-school day.
// Each swap counts once, however many events it overlaps.
export function holidayTally(swaps = [], events = []) {
  const seen = new Map(); // swap.id -> { swap, events: [] }
  for (const c of detectConflicts(swaps, events)) {
    const row = seen.get(c.swap.id) ?? { swap: c.swap, events: [], best: null };
    row.events.push(c.event);
    // Primary event for the optional "propose different dates" draft: holidays first, then longest overlap.
    const rank = (x) => (x.event.category === 'holiday' ? 1000 : 0) + x.overlapDays;
    if (!row.best || rank(c) > rank(row.best)) row.best = c;
    seen.set(c.swap.id, row);
  }
  let ar = 0, lisa = 0;
  for (const { swap } of seen.values()) {
    swap.receiving_parent === 'aaron_rebecca' ? (ar += 1) : (lisa += 1);
  }
  const net = ar - lisa;
  const who = net > 0 ? 'aaron_rebecca' : net < 0 ? 'lisa' : null;
  return {
    arCount: ar,
    lisaCount: lisa,
    total: ar + lisa,
    net,
    label: who ? `${householdLabel(who)} +${Math.abs(net)}` : 'Even',
    items: [...seen.values()].map(({ swap, events: evs, best }) => ({
      swap,
      event: best.event,
      events: evs,
      message:
        `${householdLabel(swap.receiving_parent)} has Zoe ${span(swap.date_start, swap.date_end)}, ` +
        `covering ${evs.map((e) => `${e.title} (${span(e.date_start, e.date_end)})`).join(' and ')}.`,
    })),
  };
}
