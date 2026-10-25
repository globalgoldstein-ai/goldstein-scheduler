// Goldstein Scheduler | Phase 11 | Session 6 | Build 1 | 2026-10-25 17:14 ET | one sticky panel above the calendar: short steps, summary, notes, Ask/Save/Give back + Cancel
import { useState } from 'react';
import { createSwap, createTrade, updateSwap } from '../lib/mutations.js';
import { householdLabel, parseDate } from '../lib/schedule.js';
import { dayCount, otherHousehold, rangeProblem, receivingFor } from '../lib/pick.js';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const spanOf = (a, b) => (a === b ? nice(a) : `${nice(a)} – ${nice(b)}`);
const days = (n) => `${n} day${n === 1 ? '' : 's'}`;
const box = { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccd', boxSizing: 'border-box' };
const btn = { padding: '10px 16px', minHeight: 44, fontSize: 15, borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
const TITLE = { ask: 'Ask for days', return: 'Give days back', edit: 'Change swap' };

// Declared at module scope so typing in Notes does not remount the panel.
// Sits ABOVE the calendar and sticks to the top of the screen, so what a tap did is always visible.
export default function PickPanel({ pick, setPick, actor, onCancel, onDone }) {
  const [notes, setNotes] = useState(pick.kind === 'edit' ? (pick.original.notes ?? '') : '');
  const [busy, setBusy] = useState(false);
  const done = !!(pick.start && pick.end);
  const recv = receivingFor(pick);
  const ask = pick.kind === 'ask';
  const edit = pick.kind === 'edit';
  const datesChanged = edit && done && (pick.start !== pick.original.date_start || pick.end !== pick.original.date_end);
  const notesChanged = edit && (notes.trim() || null) !== (pick.original.notes ?? null);
  const nothing = edit && !datesChanged && !notesChanged;
  const needsAgain = datesChanged && pick.original.status !== 'proposed';
  const asker = actor === 'lisa' ? 'lisa' : 'aaron_rebecca';
  const was = edit ? spanOf(pick.original.date_start, pick.original.date_end) : null;

  // The one short sentence that tells you what to do next.
  const step = !pick.start
    ? (edit ? 'Tap the new first day.' : pick.kind === 'return' ? 'Tap the first day to give back.' : 'Tap the first day.')
    : !pick.end
      ? 'Tap the last day. (One day? Tap it again.)'
      : edit && nothing
        ? `Now ${was}. Tap a new first day to move it, or just change the note.`
        : pick.suggested ? 'Suggested days are selected. Tap a day to change them.' : null;

  async function submit() {
    const bad = rangeProblem(pick, pick.start, pick.end);
    if (bad) return setPick({ ...pick, err: bad });
    setBusy(true);
    const dates = { date_start: pick.start, date_end: pick.end, notes };
    const { error } = edit
      ? await updateSwap(pick.original, dates, actor)
      : ask
        ? await createSwap({ ...dates, receiving_parent: recv, status: 'proposed', proposed_by: actor }, actor)
        : await createTrade(pick.original, dates, actor);
    setBusy(false);
    if (error) return setPick({ ...pick, err: error.message });
    onDone(pick.start);
  }

  const blocked = !done || busy || nothing;
  return (
    <div role="status" style={{
      position: 'sticky', top: 0, zIndex: 5, marginTop: 12, padding: 12, borderRadius: 10,
      background: '#e3f2fd', border: '1px solid #64b5f6', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', color: '#0d2f57',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{TITLE[pick.kind]}</div>
      {step && <div style={{ fontSize: 14, marginTop: 2 }}>{step}</div>}

      {done && (
        <div style={{ marginTop: 8, padding: 10, background: '#fff', borderRadius: 8, color: '#223' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {spanOf(pick.start, pick.end)} · {days(dayCount(pick.start, pick.end))}
          </div>
          <div style={{ fontSize: 13, color: '#556', margin: '2px 0 6px' }}>
            {householdLabel(recv)} would have Zoe.
            {pick.kind === 'return' && ` The first side was ${days(dayCount(pick.original.date_start, pick.original.date_end))}.`}
            {edit && datesChanged && ` Was: ${was}.`}
          </div>
          {needsAgain && (
            <div style={{ fontSize: 13, color: '#b26a00', margin: '0 0 6px' }}>
              Changing the days is a new ask: {householdLabel(otherHousehold(asker))} will need to agree again.
            </div>
          )}
          <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={box} />
        </div>
      )}

      {pick.err && <p role="alert" style={{ color: '#c00', fontSize: 13, margin: '8px 0 0' }}>{pick.err}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={submit} disabled={blocked}
          style={{ ...btn, border: 0, background: edit ? '#1565c0' : ask ? '#2e7d32' : '#00695c', color: '#fff', opacity: blocked ? 0.5 : 1 }}>
          {busy ? 'Saving…' : edit ? 'Save' : ask ? 'Ask' : 'Give back'}
        </button>
        <button onClick={() => setPick({ ...pick, start: null, end: null, suggested: false, err: null })} disabled={busy || !pick.start}
          style={{ ...btn, border: '1px solid #99a', background: '#fff', color: '#445', opacity: !pick.start ? 0.5 : 1 }}>Start over</button>
        <button onClick={onCancel} disabled={busy} style={{ ...btn, border: '1px solid #99a', background: '#fff', color: '#445' }}>Cancel</button>
      </div>
    </div>
  );
}
