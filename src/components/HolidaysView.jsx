// Goldstein Scheduler | Phase 9 | Session 3 | Build 2 | 2026-10-24 13:44 ET | holidays and no-school days: list or calendar, with who has Zoe
import { useState } from 'react';
import { parseDate, effectiveHousehold, householdLabel } from '../lib/schedule.js';
import { isHolidayEvent } from '../lib/conflicts.js';
import { categoryLabel, kidLabel } from '../lib/labels.js';
import CalendarView from './CalendarView.jsx';

const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const short = (s) => parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dayName = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const monthName = (s) => parseDate(s).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const range = (e) => (e.date_start === e.date_end ? `${dayName(e.date_start)} ${short(e.date_start)}` : `${short(e.date_start)} – ${short(e.date_end)}`);

// Who has Zoe across the event, in order, after agreed swaps. e.g. ['lisa'] or ['lisa', 'aaron_rebecca'].
function holders(e, swaps) {
  const out = [];
  const n = Math.round((parseDate(e.date_end) - parseDate(e.date_start)) / DAY);
  for (let i = 0; i <= Math.min(n, 30); i++) {
    const h = effectiveHousehold(iso(new Date(parseDate(e.date_start).getTime() + i * DAY)), swaps);
    if (out[out.length - 1] !== h) out.push(h);
  }
  return out;
}

const chip = (bg, fg) => ({ display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: bg, color: fg, marginRight: 6 });
const pill = (on) => ({
  padding: '6px 14px', fontSize: 13, borderRadius: 16, fontWeight: 600, cursor: 'pointer',
  border: '1px solid #1565c0', background: on ? '#1565c0' : '#fff', color: on ? '#fff' : '#1565c0',
});

export default function HolidaysView({ swaps = [], events = [] }) {
  const today = new Date().toLocaleDateString('en-CA');
  const [mode, setMode] = useState('list'); // list | calendar
  const [showPast, setShowPast] = useState(false);

  const all = events
    .filter((e) => e.category === 'holiday' || e.category === 'school')
    .sort((a, b) => a.date_start.localeCompare(b.date_start) || a.title.localeCompare(b.title));
  const shown = showPast ? all : all.filter((e) => e.date_end >= today);

  const groups = [];
  for (const e of shown) {
    const m = monthName(e.date_start);
    if (groups[groups.length - 1]?.m !== m) groups.push({ m, items: [] });
    groups[groups.length - 1].items.push(e);
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setMode('list')} aria-pressed={mode === 'list'} style={pill(mode === 'list')}>List</button>
        <button onClick={() => setMode('calendar')} aria-pressed={mode === 'calendar'} style={pill(mode === 'calendar')}>Calendar</button>
        {mode === 'list' && (
          <label style={{ fontSize: 12, color: '#667', marginLeft: 'auto' }}>
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Show past
          </label>
        )}
      </div>

      {mode === 'calendar' && <CalendarView swaps={swaps} events={all} label="Holiday calendar" />}

      {mode === 'list' && (
        <div>
          {groups.length === 0 && <p style={{ color: '#778' }}>No upcoming holidays or no-school days. Add events or run the seed SQL.</p>}
          {groups.map((g) => (
            <div key={g.m}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, color: '#667', margin: '18px 0 6px' }}>{g.m}</h3>
              {g.items.map((e) => {
                const zoe = isHolidayEvent(e);
                const h = zoe ? holders(e, swaps) : [];
                const swapped = zoe && swaps.some((s) => s.status === 'agreed' && s.date_start <= e.date_end && e.date_start <= s.date_end);
                const past = e.date_end < today;
                return (
                  <div key={e.id} style={{
                    padding: '10px 12px', marginBottom: 6, border: `1px solid ${swapped ? '#80cbc4' : '#e3e8ef'}`,
                    background: swapped ? '#f1faf9' : '#fff', borderRadius: 8, fontSize: 14, opacity: past ? 0.55 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{e.title}</strong>
                      <span style={{ color: '#556', whiteSpace: 'nowrap' }}>{range(e)}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={e.category === 'holiday' ? chip('#ffebee', '#c62828') : chip('#e3f2fd', '#1565c0')}>{categoryLabel(e.category)}</span>
                      {e.kid !== 'zoe' && <span style={chip('#eceff1', '#455a64')}>{kidLabel(e.kid)}</span>}
                      {swapped && <span style={chip('#e0f2f1', '#00695c')}>⇄ Holiday swap</span>}
                    </div>
                    {zoe && (
                      <div style={{ fontSize: 12, color: '#667', marginTop: 4 }}>
                        Zoe with {h.map(householdLabel).join(' → ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
