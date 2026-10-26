// Goldstein Scheduler | Phase 11 | Session 6 | Build 2 | 2026-10-25 20:38 ET | Swaps tab: one card per swap; Change and Cancel swap for everyone (logged in History)
import { useState } from 'react';
import { parseDate, householdLabel, borrowedDays } from '../lib/schedule.js';
import { dayCount } from '../lib/pick.js';
import { householdOf, statusText } from '../lib/people.js';
import { tradePartner } from '../lib/trades.js';
import EventForm from './EventForm.jsx';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);
const btn = { minHeight: 44, padding: '10px 16px', fontSize: 15, borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
const TONE = { agreed: '#2e7d32', proposed: '#b26a00', needs_discussion: '#c62828' };

// Module scope on purpose: a component declared inside another one remounts on every render.
function SwapCard({ swap, swaps, actor, past, on }) {
  const [open, setOpen] = useState(false);
  const mine = householdOf(swap.proposed_by) === householdOf(actor); // my household asked
  const st = swap.status;
  const decide = !past && st !== 'agreed' && !mine; // Agree / Let's talk
  // Anyone can change or cancel any swap; every change is recorded in History.
  const items = [['Change', () => on.change(swap)], ['Cancel swap', () => on.cancel(swap)]];
  const total = dayCount(swap.date_start, swap.date_end);
  const borrowed = borrowedDays(swap.date_start, swap.date_end, swap.receiving_parent);
  const t = tradePartner(swap, swaps);
  const verb = swap.receiving_parent === 'lisa' ? 'has' : 'have';
  const header = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <strong style={{ fontSize: 15 }}>{householdLabel(swap.receiving_parent)} {verb} Zoe</strong>
        <span aria-hidden="true" style={{ fontSize: 20, color: '#556', lineHeight: 1 }}>⋯</span>
      </div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{span(swap)}</div>
    </>
  );
  return (
    <div style={{ padding: 12, marginBottom: 8, border: '1px solid #e3e8ef', borderLeft: `5px solid ${TONE[st] ?? '#889'}`, borderRadius: 8, opacity: past ? 0.6 : 1 }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Options for ${span(swap)}`}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: 0, border: 0, background: 'transparent', font: 'inherit', cursor: 'pointer', minHeight: 44 }}>{header}</button>
      <div style={{ fontSize: 13, marginTop: 4, color: TONE[st] ?? '#556', fontWeight: 700 }}>{statusText(swap)}</div>
      {borrowed < total && <div style={{ fontSize: 12, color: '#667', marginTop: 2 }}>{borrowed} of {total} days borrowed (count toward the balance)</div>}
      {swap.notes && <div style={{ fontSize: 13, color: '#556', marginTop: 2 }}>“{swap.notes}”</div>}
      {t && <div style={{ fontSize: 12, color: '#00695c', marginTop: 4 }}>{t.isOriginal ? `Gives back ${span(t.partner)}` : `Given back for ${span(t.partner)}`}</div>}
      {decide && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={() => on.agree(swap)} style={{ ...btn, border: 0, background: '#2e7d32', color: '#fff' }}>Agree</button>
          {st === 'proposed' && <button onClick={() => on.talk(swap)} style={{ ...btn, border: '1px solid #99a', background: '#fff', color: '#445' }}>Let's talk</button>}
        </div>
      )}
      {open && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {items.map(([label, fn]) => (
            <button key={label} onClick={() => { setOpen(false); fn(); }}
              style={{ ...btn, border: `1px solid ${label === 'Cancel swap' ? '#b71c1c' : '#1565c0'}`, background: '#fff', color: label === 'Cancel swap' ? '#b71c1c' : '#1565c0' }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SwapsView({ swaps = [], actor, today, on, onEventSaved }) {
  const [showEvent, setShowEvent] = useState(false);
  const upcoming = swaps.filter((s) => s.date_end >= today).sort((a, b) => a.date_start.localeCompare(b.date_start));
  const past = swaps.filter((s) => s.date_end < today).sort((a, b) => b.date_start.localeCompare(a.date_start));
  return (
    <div style={{ marginTop: 16 }}>
      {upcoming.length === 0 && <p style={{ color: '#778' }}>No swaps coming up. To ask for days, go to Schedule and tap Ask for days.</p>}
      {upcoming.map((s) => <SwapCard key={s.id} swap={s} swaps={swaps} actor={actor} past={false} on={on} />)}
      {past.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ fontSize: 14, color: '#556', cursor: 'pointer', minHeight: 44, lineHeight: '44px' }}>Past swaps ({past.length})</summary>
          {past.map((s) => <SwapCard key={s.id} swap={s} swaps={swaps} actor={actor} past on={on} />)}
        </details>
      )}
      <div style={{ marginTop: 24 }}>
        {showEvent
          ? <EventForm actor={actor} onDone={(d) => { setShowEvent(false); onEventSaved(d); }} />
          : <button onClick={() => setShowEvent(true)} style={{ ...btn, border: '1px solid #1565c0', background: '#fff', color: '#1565c0' }}>+ Add an event</button>}
        {showEvent && <button onClick={() => setShowEvent(false)} style={{ ...btn, border: '1px solid #99a', background: '#fff', color: '#445' }}>Cancel</button>}
      </div>
    </div>
  );
}
