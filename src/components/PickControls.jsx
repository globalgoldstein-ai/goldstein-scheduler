// Goldstein Scheduler | Phase 11 | Session 5 | Build 4 | 2026-10-25 16:51 ET | tap-to-select banner and confirm bar for swaps, trade returns and swap edits
import { useState } from 'react';
import { createSwap, createTrade, updateSwap } from '../lib/mutations.js';
import { householdLabel, parseDate } from '../lib/schedule.js';
import { dayCount, holderNeeded, otherHousehold, rangeProblem, receivingFor } from '../lib/pick.js';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const days = (n) => `${n} day${n === 1 ? '' : 's'}`;
const box = { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccd', boxSizing: 'border-box' };
const btn = { padding: '10px 16px', minHeight: 44, fontSize: 15, borderRadius: 8, fontWeight: 600, cursor: 'pointer' };

// Declared at module scope so typing in Notes does not remount the bar.
export function PickBanner({ pick }) {
  const ask = pick.kind === 'ask';
  const need = holderNeeded(pick);
  const nowSpan = pick.kind === 'edit'
    ? (pick.original.date_start === pick.original.date_end ? nice(pick.original.date_start) : `${nice(pick.original.date_start)} – ${nice(pick.original.date_end)}`)
    : null;
  const msg = pick.suggested && pick.start && pick.end
    ? (pick.kind === 'edit'
      ? `You're changing ${nowSpan}. Tap the new first day, then the new last day. Or leave the days and just change the note below.`
      : 'Suggested days are selected. Tap any day to choose different ones.')
    : !pick.start
      ? (ask ? 'Tap the first day.' : 'Tap the first day to give back.')
      : !pick.end
        ? 'Tap the last day (or tap the same day again).'
        : 'Check the days below, then confirm. Tap a day to start over.';
  const why = pick.kind === 'edit'
    ? `Greyed days aren't ${householdLabel(pick.original.default_parent)}'s own days, so this swap can't move onto them.`
    : pick.kind === 'return'
    ? `Greyed days aren't ${householdLabel(pick.original.receiving_parent)}'s own days, so they can't be given back.`
    : need && !pick.end ? `Greyed days aren't ${householdLabel(need)}'s by default, so they can't be in the same request.` : null;
  return (
    <div role="status" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#e3f2fd', border: '1px solid #90caf9', color: '#0d47a1', fontSize: 14 }}>
      <strong>{pick.kind === 'edit' ? 'Change swap: ' : pick.kind === 'return' ? 'Give days back: ' : 'Ask for days: '}</strong>{msg}
      {why && <div style={{ fontSize: 12, color: '#37627f', marginTop: 4 }}>{why}</div>}
    </div>
  );
}

export function PickBar({ pick, setPick, actor, onCancel, onDone }) {
  const [notes, setNotes] = useState(pick.kind === 'edit' ? (pick.original.notes ?? '') : '');
  const [busy, setBusy] = useState(false);
  const done = pick.start && pick.end;
  const recv = receivingFor(pick);
  const ask = pick.kind === 'ask';
  const edit = pick.kind === 'edit';
  const datesChanged = edit && done && (pick.start !== pick.original.date_start || pick.end !== pick.original.date_end);
  const notesChanged = edit && (notes.trim() || null) !== (pick.original.notes ?? null);
  const needsAgain = datesChanged && pick.original.status !== 'proposed';
  const asker = actor === 'lisa' ? 'lisa' : 'aaron_rebecca';

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

  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 5, marginTop: 10, padding: 12, borderRadius: 10,
      background: '#fff', border: '1px solid #90caf9', boxShadow: '0 -2px 10px rgba(0,0,0,0.12)',
    }}>
      {done ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {pick.start === pick.end ? nice(pick.start) : `${nice(pick.start)} – ${nice(pick.end)}`} · {days(dayCount(pick.start, pick.end))}
          </div>
          <div style={{ fontSize: 13, color: '#556', margin: '2px 0 8px' }}>
            {householdLabel(recv)} would have Zoe.
            {pick.kind === 'return' && ` The first side was ${days(dayCount(pick.original.date_start, pick.original.date_end))}.`}
          </div>
          {edit && needsAgain && (
            <div style={{ fontSize: 13, color: '#b26a00', margin: '0 0 8px' }}>
              Changing the days is a new ask: {householdLabel(otherHousehold(asker))} will need to agree again.
            </div>
          )}
          {edit && (
            <div style={{ fontSize: 13, color: '#889', margin: '0 0 8px' }}>
              {datesChanged || notesChanged ? `Was: ${nice(pick.original.date_start)}${pick.original.date_start === pick.original.date_end ? '' : ` – ${nice(pick.original.date_end)}`}.` : 'Nothing changed yet. Tap new days on the calendar, or edit the note.'}
            </div>
          )}
          <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={box} />
        </>
      ) : (
        <div style={{ fontSize: 14, color: '#556' }}>
          <strong>{pick.start ? 'Step 2 of 2' : 'Step 1 of 2'}</strong>{pick.start ? ` · First day ${nice(pick.start)}. Now tap the last day (or the same day again).` : ' · Tap the first day on the calendar.'}
        </div>
      )}
      {pick.err && <p role="alert" style={{ color: '#c00', fontSize: 13, margin: '8px 0 0' }}>{pick.err}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={submit} disabled={!done || busy || (edit && !datesChanged && !notesChanged)}
          style={{ ...btn, border: 0, background: edit ? '#1565c0' : ask ? '#2e7d32' : '#00695c', color: '#fff', opacity: !done || busy || (edit && !datesChanged && !notesChanged) ? 0.5 : 1 }}>
          {busy ? 'Saving…' : edit ? 'Save changes' : ask ? 'Ask for days' : 'Add return side'}
        </button>
        <button onClick={() => setPick({ ...pick, start: null, end: null, suggested: false, err: null })} disabled={busy || !pick.start}
          style={{ ...btn, border: '1px solid #99a', background: '#fff', color: '#445', opacity: !pick.start ? 0.5 : 1 }}>Clear</button>
        <button onClick={onCancel} disabled={busy} style={{ ...btn, border: '1px solid #99a', background: '#fff', color: '#445' }}>Cancel</button>
      </div>
    </div>
  );
}
