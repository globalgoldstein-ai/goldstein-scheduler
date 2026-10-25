// Goldstein Scheduler | Phase 11 | Session 4 | Build 1 | 2026-10-24 14:50 ET | trade form: add the other side of a swap; dates always prefilled
import { useState } from 'react';
import { createTrade } from '../lib/mutations.js';
import { suggestReturn } from '../lib/suggest.js';
import { defaultHousehold, householdLabel, parseDate } from '../lib/schedule.js';

const box = { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccd', marginBottom: 10, boxSizing: 'border-box' };
const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

// Declared at module scope so typing doesn't remount the form.
export default function TradeForm({ swap, swaps, events, actor, onDone, onCancel }) {
  const today = new Date().toLocaleDateString('en-CA');
  const suggestion = suggestReturn(swap, { swaps, events, today });
  // No suggestion: start one week after the first side, so the iPhone picker opens near it.
  const wk = (s) => new Date(parseDate(s).getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const [f, setF] = useState({
    date_start: suggestion?.date_start ?? wk(swap.date_start),
    date_end: suggestion?.date_end ?? wk(swap.date_end),
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => {
    const v = e.target.value;
    if (k === 'date_start' && v && (!f.date_end || f.date_end < v)) return setF({ ...f, date_start: v, date_end: v });
    setF({ ...f, [k]: v });
  };
  const giver = householdLabel(swap.receiving_parent);   // gets days back out of its own weeks
  const getter = householdLabel(swap.default_parent);    // receives the return days

  async function submit() {
    setErr(null);
    if (!f.date_start || !f.date_end) return setErr('Both dates required.');
    if (f.date_end < f.date_start) return setErr('End date must be on or after start date.');
    if (defaultHousehold(f.date_start) !== swap.receiving_parent || defaultHousehold(f.date_end) !== swap.receiving_parent) {
      return setErr(`Return days must fall in weeks ${giver} has by default.`);
    }
    setBusy(true);
    const { error } = await createTrade(swap, f, actor);
    setBusy(false);
    if (error) return setErr(error.message);
    onDone(f.date_start);
  }

  return (
    <div style={{ padding: 14, border: '1px solid #80cbc4', background: '#f1faf9', borderRadius: 10, margin: '8px 0 12px' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>Add the other side of this trade</h3>
      <p style={{ fontSize: 13, color: '#556', margin: '0 0 10px' }}>
        {giver} has Zoe {nice(swap.date_start)}{swap.date_start === swap.date_end ? '' : ` – ${nice(swap.date_end)}`}.
        {' '}{getter} gets the same number of days back.
      </p>

      {suggestion
        ? <p style={{ fontSize: 13, color: '#00695c', margin: '0 0 10px' }}>Suggested: {nice(suggestion.date_start)} – {nice(suggestion.date_end)}. Change it if you like.</p>
        : <p style={{ fontSize: 13, color: '#b26a00', margin: '0 0 10px' }}>No free matching window in the next 8 weeks. The dates below are a starting point; change them.</p>}

      <label style={{ fontSize: 12, color: '#667' }}>Return start</label>
      <input type="date" value={f.date_start} onChange={set('date_start')} style={box} />
      <label style={{ fontSize: 12, color: '#667' }}>Return end</label>
      <input type="date" value={f.date_end} onChange={set('date_end')} style={box} />
      <input placeholder="Notes (optional)" value={f.notes} onChange={set('notes')} style={box} />

      {err && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 10px' }}>{err}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={busy}
          style={{ padding: '10px 18px', fontSize: 15, borderRadius: 8, border: 0, background: '#00695c', color: '#fff', fontWeight: 600 }}>
          {busy ? 'Saving…' : 'Add return side'}
        </button>
        <button onClick={onCancel} disabled={busy}
          style={{ padding: '10px 18px', fontSize: 15, borderRadius: 8, border: '1px solid #99a', background: '#fff', color: '#445', fontWeight: 600 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
