// Goldstein Scheduler | Phase 3 | Session 1 | Build 1 | 2026-07-03 12:41 ET | schedule engine: default + swap overlay + balance

// Parse 'YYYY-MM-DD' as UTC (avoids local-timezone day drift on custody dates).
export function parseDate(input) {
  if (input instanceof Date) return input;
  const [y, m, d] = input.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// ISO-8601 week number (weeks start Monday; week 1 holds the first Thursday).
export function isoWeek(input) {
  const d = parseDate(input);
  const day = (d.getUTCDay() + 6) % 7;         // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3);       // Thursday of this week
  const thursday = d.getTime();
  d.setUTCMonth(0, 1);
  if (d.getUTCDay() !== 4) d.setUTCMonth(0, 1 + ((4 - d.getUTCDay() + 7) % 7));
  return 1 + Math.round((thursday - d.getTime()) / 604800000);
}

export const HOUSEHOLDS = { aaron_rebecca: 'Aaron/Rebecca', lisa: 'Lisa' };
export const householdLabel = (k) => HOUSEHOLDS[k] ?? k;

// Effective-dated default rules. To flip parity later, APPEND a rule with a
// later `from` — never edit history (honors "never rewrites past").
const DEFAULT_RULES = [
  { from: '0000-01-01', oddWeek: 'aaron_rebecca', evenWeek: 'lisa' },
];

// DEFAULT holder for a date (ignores swaps): A/R odd weeks, Lisa even weeks.
export function defaultHousehold(input, rules = DEFAULT_RULES) {
  const d = parseDate(input);
  const rule = [...rules]
    .filter((r) => parseDate(r.from) <= d)
    .sort((a, b) => parseDate(b.from) - parseDate(a.from))[0];
  return isoWeek(d) % 2 === 1 ? rule.oddWeek : rule.evenWeek;
}

// EFFECTIVE holder: default, unless an AGREED swap covers the date.
export function effectiveHousehold(input, swaps = []) {
  const d = parseDate(input);
  const active = swaps.find(
    (s) => s.status === 'agreed' && parseDate(s.date_start) <= d && d <= parseDate(s.date_end)
  );
  return active ? active.receiving_parent : defaultHousehold(input);
}

// Running balance from AGREED swaps. Positive net = that household is ahead.
export function swapBalance(swaps = []) {
  let ar = 0, lisa = 0;
  for (const s of swaps) {
    if (s.status !== 'agreed') continue;
    const days = Math.round((parseDate(s.date_end) - parseDate(s.date_start)) / 86400000) + 1;
    s.receiving_parent === 'aaron_rebecca' ? (ar += days) : (lisa += days);
  }
  const net = ar - lisa;
  if (net === 0) return { net: 0, ahead: null, label: 'Even', arDays: ar, lisaDays: lisa };
  const who = net > 0 ? 'aaron_rebecca' : 'lisa';
  return { net, ahead: who, label: `${householdLabel(who)} +${Math.abs(net)}`, arDays: ar, lisaDays: lisa };
}
