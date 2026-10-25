// Goldstein Scheduler | Phase 11 | Session 4 | Build 1 | 2026-10-24 14:50 ET | swap proposal form; end date follows start so the picker opens on the right month
import { useState } from 'react';
import { createSwap } from '../lib/mutations.js';
import { defaultHousehold, householdLabel } from '../lib/schedule.js';

const box = { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccd', marginBottom: 10, boxSizing: 'border-box' };

export default function SwapForm({ actor, onDone }) {
  const [f, setF] = useState({ date_start: '', date_end: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  // Picking a start fills an empty or earlier end, so the iPhone picker for End opens on that month.
  const set = (k) => (e) => {
    const v = e.target.value;
    if (k === 'date_start' && v && (!f.date_end || f.date_end < v)) return setF({ ...f, date_start: v, date_end: v });
    setF({ ...f, [k]: v });
  };

  // Receiving household is DERIVED: whoever isn't the default that week.
  const def = f.date_start ? defaultHousehold(f.date_start) : null;
  const receiving = def === 'lisa' ? 'aaron_rebecca' : def ? 'lisa' : null;

  async function submit() {
    setErr(null);
    if (!f.date_start || !f.date_end) return setErr('Both dates required.');
    if (f.date_end < f.date_start) return setErr('End date must be on or after start date.');
    setBusy(true);
    const { error } = await createSwap(
      { ...f, receiving_parent: receiving, status: 'proposed', proposed_by: actor },
      actor
    );
    setBusy(false);
    if (error) return setErr(error.message);
    const start = f.date_start;
    setF({ date_start: '', date_end: '', notes: '' });
    onDone(start);
  }

  return (
    <div style={{ padding: 16, border: '1px solid #d7dee8', borderRadius: 12, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Propose a swap</h3>

      <label style={{ fontSize: 12, color: '#667' }}>Start date</label>
      <input type="date" value={f.date_start} onChange={set('date_start')} style={box} />

      <label style={{ fontSize: 12, color: '#667' }}>End date</label>
      <input type="date" value={f.date_end} onChange={set('date_end')} style={box} />

      {def && (
        <p style={{ fontSize: 13, color: '#556', margin: '0 0 10px' }}>
          Default that week: <strong>{householdLabel(def)}</strong> → swapping to{' '}
          <strong>{householdLabel(receiving)}</strong>
        </p>
      )}

      <input placeholder="Notes (optional)" value={f.notes} onChange={set('notes')} style={box} />

      {err && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 10px' }}>{err}</p>}

      <button onClick={submit} disabled={busy}
        style={{ padding: '10px 18px', fontSize: 15, borderRadius: 8, border: 0, background: '#2e7d32', color: '#fff', fontWeight: 600 }}>
        {busy ? 'Saving…' : 'Propose swap'}
      </button>
    </div>
  );
}
