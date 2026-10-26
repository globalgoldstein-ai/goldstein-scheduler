// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 20:52 ET | calendar: 4-item legend (red bar back), day sheet without 'week' wording
import { useState, useEffect } from 'react';
import { parseDate, effectiveHousehold, householdLabel, isoWeek, defaultHousehold, ruleFor } from '../lib/schedule.js';
import { isHolidayEvent } from '../lib/conflicts.js';
import { categoryLabel } from '../lib/labels.js';
import { statusText } from '../lib/people.js';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => iso(new Date(parseDate(s).getTime() + n * 86400000));
const inRange = (d, s, e) => s <= d && d <= e;
const fmt = (s) =>
  parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const short = (s) => parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayShort = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (a, b) => (a === b ? dayShort(a) : `${dayShort(a)} – ${dayShort(b)}`);

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // custody weeks run Mon–Sun
const HOUSE = {
  aaron_rebecca: { bg: '#e8f5e9', edge: '#2e7d32' },
  lisa: { bg: '#f3e5f5', edge: '#7b1fa2' },
};
const CAT = { holiday: '#c62828', school: '#c62828', trip: '#ef6c00', other: '#78909c' };
const HOLSWAP = '#00897b'; // holiday swaps are normal, so a calm teal instead of a warning color

// Whole weeks (Mon-first) covering the month, PLUS the following week so the
// next handover is always visible. Returns { days, monthRows }.
function monthGrid(y, m) {
  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const start = addDays(iso(first), -lead);
  const monthRows = Math.ceil((lead + days) / 7);
  return { days: Array.from({ length: (monthRows + 1) * 7 }, (_, i) => addDays(start, i)), monthRows };
}

// Viewed month survives reloads and tab switches. Key name must never change.
function loadYm(key, today) {
  try {
    const v = localStorage.getItem(key);
    if (/^\d{4}-\d{2}$/.test(v || '')) { const [y, m] = v.split('-').map(Number); return { y, m: m - 1 }; }
  } catch { /* storage blocked: fall back to today */ }
  const [y, m] = today.split('-').map(Number);
  return { y, m: m - 1 };
}

// One ribbon segment per swap per day. Ends are rounded at the swap's first/last
// day and at week edges (the grid wraps each Monday). Solid = agreed, striped = asked/waiting.
function Ribbon({ swap, d, index }) {
  const color = HOUSE[swap.receiving_parent]?.edge ?? '#889';
  const dow = (parseDate(d).getUTCDay() + 6) % 7;
  const startHere = d === swap.date_start || dow === 0;
  const endHere = d === swap.date_end || dow === 6;
  const agreed = swap.status === 'agreed';
  return (
    <span style={{
      position: 'absolute', zIndex: 1, bottom: 5 + index * 13, height: 10, boxSizing: 'border-box',
      left: startHere ? 3 : -3, right: endHere ? 3 : -3,
      borderRadius: `${startHere ? 4 : 0}px ${endHere ? 4 : 0}px ${endHere ? 4 : 0}px ${startHere ? 4 : 0}px`,
      background: agreed ? color : `repeating-linear-gradient(135deg, ${color} 0 3px, transparent 3px 6px)`,
      borderStyle: 'solid', borderColor: color,
      borderWidth: agreed ? 0 : `1px ${endHere ? 1 : 0}px 1px ${startHere ? 1 : 0}px`,
    }} />
  );
}

const navBtn = { padding: '6px 12px', fontSize: 14, borderRadius: 8, border: '1px solid #ccd', background: '#fff', color: '#334', fontWeight: 600 };

// Select mode: the parent owns `pick` ({ start, end }), `pickOk(date)` says which days can be tapped and
// `onPickDay(date)` receives taps. Outside select mode, `onAskFrom(date)` adds a button to the day sheet.
export default function CalendarView({ swaps = [], events = [], label = 'Calendar', storageKey = 'gs.calendarMonth', jumpTo = null, pick = null, pickOk = null, onPickDay = null, onAskFrom = null, onEditSwap = null }) {
  const today = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const [ym, setYm] = useState(() => loadYm(storageKey, today));
  const [sel, setSel] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(storageKey, `${ym.y}-${String(ym.m + 1).padStart(2, '0')}`); } catch { /* ignore */ }
  }, [ym, storageKey]);

  // After a save, the parent passes the new record's start date: show that month.
  useEffect(() => {
    if (!jumpTo) return;
    const [y, m] = jumpTo.split('-').map(Number);
    setYm({ y, m: m - 1 });
  }, [jumpTo]);

  const step = (n) => {
    const d = new Date(Date.UTC(ym.y, ym.m + n, 1));
    setYm({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    setSel(null);
  };
  const goToday = () => { const [y, m] = today.split('-').map(Number); setYm({ y, m: m - 1 }); if (!pick) setSel(today); };
  const picking = !!pick;
  useEffect(() => { if (picking) setSel(null); }, [picking]);

  const info = (d) => {
    const dayEvents = events.filter((e) => inRange(d, e.date_start, e.date_end));
    const daySwaps = swaps.filter((s) => inRange(d, s.date_start, s.date_end));
    const agreedSwap = daySwaps.some((s) => s.status === 'agreed');
    // Only a day the receiver BORROWS counts as a holiday swap (a swap may also cover the receiver's own days).
    const borrowedAgreed = daySwaps.some((s) => s.status === 'agreed' && defaultHousehold(d) !== s.receiving_parent);
    return {
      dayEvents, daySwaps, agreedSwap,
      holder: effectiveHousehold(d, swaps),
      holidaySwap: borrowedAgreed && dayEvents.some(isHolidayEvent),
    };
  };

  const { days, monthRows } = monthGrid(ym.y, ym.m);
  const rule = ruleFor(iso(new Date(Date.UTC(ym.y, ym.m, 1))));
  const weeksOf = (h) => (rule.oddWeek === h ? 'odd weeks' : 'even weeks');
  const title = new Date(Date.UTC(ym.y, ym.m, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const sInfo = sel && !picking ? info(sel) : null;

  return (
    <div style={{ marginTop: 20 }} role="group" aria-label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button onClick={() => step(-1)} style={navBtn} aria-label="Previous month">‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>{title}</div>
        <button onClick={goToday} style={navBtn}>Today</button>
        <button onClick={() => step(1)} style={navBtn} aria-label="Next month">›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '18px repeat(7, minmax(0, 1fr))', gap: 3 }}>
        <div style={{ textAlign: 'center', fontSize: 10, color: '#99a', padding: '2px 0' }}>Wk</div>
        {DOW.map((n) => (
          <div key={n} style={{ textAlign: 'center', fontSize: 11, color: '#778', padding: '2px 0' }}>{n}</div>
        ))}
        {days.map((d, i) => {
          const { dayEvents, daySwaps, agreedSwap, holder, holidaySwap } = info(d);
          const inMonth = Number(d.slice(5, 7)) - 1 === ym.m;
          const extraWeek = i >= monthRows * 7;
          const canTap = !picking || (pickOk ? pickOk(d) : true);
          const picked = picking && pick.start && d >= pick.start && d <= (pick.end ?? pick.start);
          const outer = picked ? '0 0 0 2px #1565c0' : d === sel && !picking ? '0 0 0 2px #1565c0' : d === today ? '0 0 0 2px #263238' : null;
          const ring = [outer, holidaySwap ? `inset 0 0 0 3px ${HOLSWAP}` : null].filter(Boolean).join(', ') || 'none';
          const ribbons = [...daySwaps].sort((a, b) => (a.status === 'agreed' ? -1 : 1) - (b.status === 'agreed' ? -1 : 1)).slice(0, 2);
          const monthStart = d.slice(8) === '01' && !inMonth;
          const weekCell = i % 7 === 0 && (
            <div key={`w${d}`} title={`Week ${isoWeek(d)}: ${householdLabel(defaultHousehold(d))} by default`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                color: HOUSE[defaultHousehold(d)]?.edge ?? '#778', opacity: extraWeek ? 0.7 : 1 }}>
              {isoWeek(d)}
            </div>
          );
          const divider = i === monthRows * 7 && (
            <div key="next" style={{ gridColumn: '1 / -1', fontSize: 11, color: '#889', borderTop: '1px dashed #c5ccd6', paddingTop: 2, marginTop: 2 }}>Next week</div>
          );
          return [divider, weekCell, (
            <button
              key={d}
              onClick={() => (picking ? onPickDay?.(d) : setSel(sel === d ? null : d))}
              disabled={!canTap}
              aria-label={`${fmt(d)}, with ${householdLabel(holder)}${agreedSwap ? ', swap' : ''}${holidaySwap ? ', holiday swap' : ''}${picked ? ', selected' : ''}`}
              aria-pressed={picking ? !!picked : d === sel}
              style={{
                position: 'relative', minHeight: 66, padding: '8px 2px 4px', overflow: 'hidden', borderRadius: 6, boxSizing: 'border-box',
                background: HOUSE[holder]?.bg ?? '#eef2f7',
                border: '1px solid #e3e8ef',
                boxShadow: ring, opacity: !canTap ? 0.2 : inMonth ? 1 : extraWeek ? 0.7 : 0.4, color: '#223', font: 'inherit',
                cursor: canTap ? 'pointer' : 'not-allowed',
              }}
            >
              <div style={{ fontSize: monthStart ? 11 : 14, fontWeight: d === today ? 800 : 500, whiteSpace: 'nowrap' }}>
                {monthStart ? short(d) : Number(d.slice(8))}
              </div>
              {dayEvents.some((e) => e.category === 'holiday' || e.category === 'school') && (
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: CAT.holiday }} />
              )}
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', marginTop: 2, minHeight: 14 }}>
                {dayEvents.some((e) => e.category === 'trip') && <span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1 }}>✈</span>}
                {picked && (d === pick.start || d === (pick.end ?? pick.start)) && (
                  <span aria-hidden="true" style={{ position: 'relative', zIndex: 3, fontSize: 9, fontWeight: 800, color: '#0d47a1', whiteSpace: 'nowrap' }}>
                    {pick.end && pick.start === pick.end ? '1 day' : d === pick.start ? 'start' : 'end'}
                  </span>
                )}
                {dayEvents.some((e) => e.category === 'other') && <span style={{ width: 6, height: 6, borderRadius: 3, background: CAT.other }} />}
              </div>
              {ribbons.map((s, k) => <Ribbon key={s.id} swap={s} d={d} index={k} />)}
              {picked && (
                <>
                  <span aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(21,101,192,0.22)', pointerEvents: 'none' }} />

                </>
              )}
            </button>
          )];
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 11, color: '#667', marginTop: 8 }}>
        {Object.entries(HOUSE).map(([k, v]) => (
          <span key={k}><span style={{ display: 'inline-block', width: 10, height: 10, background: v.bg, border: `1px solid ${v.edge}`, borderRadius: 2, marginRight: 4 }} />{householdLabel(k)}: <strong style={{ color: v.edge }}>{weeksOf(k)}</strong></span>
        ))}
        <span><span style={{ display: 'inline-block', width: 18, height: 8, background: 'repeating-linear-gradient(135deg, #556 0 3px, transparent 3px 6px)', border: '1px solid #556', boxSizing: 'border-box', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />striped = waiting · <span style={{ display: 'inline-block', width: 18, height: 8, background: '#556', borderRadius: 3, margin: '0 4px', verticalAlign: 'middle' }} />solid = agreed</span>
        <span><span style={{ display: 'inline-block', width: 18, height: 4, background: CAT.holiday, marginRight: 4, verticalAlign: 'middle' }} />holiday or no school (tap the day)</span>
      </div>

      {sel && sInfo && (
        <div style={{ marginTop: 10, padding: 12, border: '1px solid #d7dee8', borderRadius: 8, fontSize: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmt(sel)}</div>
          <div>With <strong>{householdLabel(sInfo.holder)}</strong>{sInfo.agreedSwap ? ' (agreed swap)' : ` (regular schedule, week ${isoWeek(sel)})`}</div>
          {sInfo.daySwaps.map((s) => (
            <div key={s.id} style={{ fontSize: 13, color: '#556', marginTop: 4 }}>
              ⇄ {householdLabel(s.receiving_parent)} take{s.receiving_parent === 'lisa' ? 's' : ''} Zoe {span(s.date_start, s.date_end)} · <strong>{statusText(s)}</strong>
              {onEditSwap && (
                <button onClick={() => onEditSwap(s)}
                  style={{ display: 'block', marginTop: 6, padding: '8px 14px', minHeight: 44, fontSize: 14, borderRadius: 8, border: '1px solid #1565c0', background: '#fff', color: '#1565c0', fontWeight: 600, cursor: 'pointer' }}>
                  Change this swap
                </button>
              )}
            </div>
          ))}
          {sInfo.dayEvents.map((e) => (
            <div key={e.id} style={{ fontSize: 13, color: '#556', marginTop: 4 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: CAT[e.category] ?? CAT.other, marginRight: 6 }} />
              {e.title} ({categoryLabel(e.category)}{e.institution ? `, ${e.institution}` : ''}{e.kid === 'zoe' ? '' : `, ${e.kid}`}), {short(e.date_start)}–{short(e.date_end)}
            </div>
          ))}
          {sInfo.dayEvents.some((e) => e.category === 'holiday' || e.category === 'school') && <div style={{ marginTop: 6, color: '#889', fontSize: 12 }}>The red bar on a day means holiday or no school.</div>}
          {sInfo.dayEvents.some((e) => e.category === 'trip') && <div style={{ marginTop: 6, color: '#889', fontSize: 12 }}>✈ marks a trip.</div>}
          {sInfo.holidaySwap && <div style={{ marginTop: 6, color: HOLSWAP, fontSize: 13 }}>This swap falls on a holiday or no-school day. That's allowed; it's counted in the Holiday swaps total.</div>}
          {!sInfo.daySwaps.length && !sInfo.dayEvents.length && <div style={{ fontSize: 13, color: '#889', marginTop: 4 }}>Nothing else scheduled.</div>}
          {onAskFrom && (
            <button onClick={() => onAskFrom(sel)}
              style={{ marginTop: 10, padding: '10px 16px', minHeight: 44, fontSize: 14, borderRadius: 8, border: '1px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 600, cursor: 'pointer' }}>
              Ask for schedule change starting this day
            </button>
          )}
        </div>
      )}
    </div>
  );
}
