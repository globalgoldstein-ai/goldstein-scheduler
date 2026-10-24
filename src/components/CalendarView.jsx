// Goldstein Scheduler | Phase 10 | Session 3 | Build 2 | 2026-10-24 14:19 ET | calendar: month grid colored by household, holiday swaps marked
import { useState } from 'react';
import { parseDate, effectiveHousehold, householdLabel } from '../lib/schedule.js';
import { isHolidayEvent } from '../lib/conflicts.js';
import { categoryLabel } from '../lib/labels.js';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => iso(new Date(parseDate(s).getTime() + n * 86400000));
const inRange = (d, s, e) => s <= d && d <= e;
const fmt = (s) =>
  parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const short = (s) => parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // custody weeks run Mon–Sun
const HOUSE = {
  aaron_rebecca: { bg: '#e8f5e9', edge: '#2e7d32' },
  lisa: { bg: '#f3e5f5', edge: '#7b1fa2' },
};
const CAT = { holiday: '#c62828', school: '#1565c0', trip: '#ef6c00', other: '#78909c' };
const HOLSWAP = '#00897b'; // holiday swaps are normal, so a calm teal instead of a warning color

// Whole weeks (Mon-first) covering the month, as YYYY-MM-DD strings.
function monthGrid(y, m) {
  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const start = addDays(iso(first), -lead);
  return Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => addDays(start, i));
}

const navBtn = { padding: '6px 12px', fontSize: 14, borderRadius: 8, border: '1px solid #ccd', background: '#fff', color: '#334', fontWeight: 600 };

export default function CalendarView({ swaps = [], events = [], label = 'Calendar' }) {
  const today = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const [ym, setYm] = useState(() => { const [y, m] = today.split('-').map(Number); return { y, m: m - 1 }; });
  const [sel, setSel] = useState(null);

  const step = (n) => {
    const d = new Date(Date.UTC(ym.y, ym.m + n, 1));
    setYm({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    setSel(null);
  };
  const goToday = () => { const [y, m] = today.split('-').map(Number); setYm({ y, m: m - 1 }); setSel(today); };

  const info = (d) => {
    const dayEvents = events.filter((e) => inRange(d, e.date_start, e.date_end));
    const daySwaps = swaps.filter((s) => inRange(d, s.date_start, s.date_end));
    const agreedSwap = daySwaps.some((s) => s.status === 'agreed');
    return {
      dayEvents, daySwaps, agreedSwap,
      holder: effectiveHousehold(d, swaps),
      holidaySwap: agreedSwap && dayEvents.some(isHolidayEvent),
    };
  };

  const days = monthGrid(ym.y, ym.m);
  const title = new Date(Date.UTC(ym.y, ym.m, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const sInfo = sel ? info(sel) : null;

  return (
    <div style={{ marginTop: 20 }} role="group" aria-label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button onClick={() => step(-1)} style={navBtn} aria-label="Previous month">‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>{title}</div>
        <button onClick={goToday} style={navBtn}>Today</button>
        <button onClick={() => step(1)} style={navBtn} aria-label="Next month">›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {DOW.map((n) => (
          <div key={n} style={{ textAlign: 'center', fontSize: 11, color: '#778', padding: '2px 0' }}>{n}</div>
        ))}
        {days.map((d) => {
          const { dayEvents, daySwaps, agreedSwap, holder, holidaySwap } = info(d);
          const inMonth = Number(d.slice(5, 7)) - 1 === ym.m;
          const proposedOnly = !agreedSwap && daySwaps.length > 0;
          const ring = d === sel ? '0 0 0 2px #1565c0' : d === today ? '0 0 0 2px #263238' : 'none';
          return (
            <button
              key={d}
              onClick={() => setSel(sel === d ? null : d)}
              aria-label={`${fmt(d)}, with ${householdLabel(holder)}${agreedSwap ? ', swap' : ''}${holidaySwap ? ', holiday swap' : ''}`}
              aria-pressed={d === sel}
              style={{
                position: 'relative', minHeight: 52, padding: '4px 2px', borderRadius: 6, cursor: 'pointer',
                background: HOUSE[holder]?.bg ?? '#eef2f7',
                border: holidaySwap ? `2px solid ${HOLSWAP}` : proposedOnly ? `1px dashed ${HOUSE[holder]?.edge ?? '#889'}` : '1px solid #e3e8ef',
                boxShadow: ring, opacity: inMonth ? 1 : 0.4, color: '#223', font: 'inherit',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: d === today ? 800 : 500 }}>{Number(d.slice(8))}</div>
              {agreedSwap && <span style={{ position: 'absolute', top: 1, right: 3, fontSize: 10 }}>⇄</span>}
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                {dayEvents.slice(0, 3).map((e) => (
                  <span key={e.id} style={{ width: 6, height: 6, borderRadius: 3, background: CAT[e.category] ?? CAT.other }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 11, color: '#667', marginTop: 8 }}>
        {Object.entries(HOUSE).map(([k, v]) => (
          <span key={k}><span style={{ display: 'inline-block', width: 10, height: 10, background: v.bg, border: `1px solid ${v.edge}`, borderRadius: 2, marginRight: 4 }} />{householdLabel(k)}</span>
        ))}
        <span>⇄ agreed swap</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, border: `2px solid ${HOLSWAP}`, borderRadius: 2, marginRight: 4 }} />holiday swap</span>
        {Object.entries(CAT).map(([k, c]) => (
          <span key={k}><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 3, background: c, marginRight: 4 }} />{categoryLabel(k)}</span>
        ))}
      </div>

      {sel && (
        <div style={{ marginTop: 10, padding: 12, border: '1px solid #d7dee8', borderRadius: 8, fontSize: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmt(sel)}</div>
          <div>With <strong>{householdLabel(sInfo.holder)}</strong>{sInfo.agreedSwap ? ' (agreed swap)' : ' (default schedule)'}</div>
          {sInfo.daySwaps.map((s) => (
            <div key={s.id} style={{ fontSize: 13, color: '#556', marginTop: 4 }}>
              ⇄ {householdLabel(s.default_parent)} → {householdLabel(s.receiving_parent)}, {short(s.date_start)}–{short(s.date_end)} · {s.status}
            </div>
          ))}
          {sInfo.dayEvents.map((e) => (
            <div key={e.id} style={{ fontSize: 13, color: '#556', marginTop: 4 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: CAT[e.category] ?? CAT.other, marginRight: 6 }} />
              {e.title} ({categoryLabel(e.category)}{e.institution ? `, ${e.institution}` : ''}{e.kid === 'zoe' ? '' : `, ${e.kid}`}), {short(e.date_start)}–{short(e.date_end)}{e.status === 'agreed' ? '' : ` · ${e.status}`}
            </div>
          ))}
          {sInfo.holidaySwap && <div style={{ marginTop: 6, color: HOLSWAP, fontSize: 13 }}>⇄ Holiday swap: an agreed swap covers a holiday or no-school day.</div>}
          {!sInfo.daySwaps.length && !sInfo.dayEvents.length && <div style={{ fontSize: 13, color: '#889', marginTop: 4 }}>Nothing else scheduled.</div>}
        </div>
      )}
    </div>
  );
}
