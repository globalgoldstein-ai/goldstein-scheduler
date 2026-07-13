// Goldstein Scheduler | Phase 6 | Session 1 | Build 1 | 2026-07-03 13:52 ET | event form (holiday/school/trip)
import { useState } from 'react';
import { createEvent } from '../lib/mutations.js';

const box = { width: '100%', padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccd', marginBottom: 10, boxSizing: 'border-box' };

export default function EventForm({ actor, onDone }) {
  const [f, setF] = useState({ title: '', kid: 'zoe', category: 'holiday', date_start: '', date_end: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit() {
    setErr(null);
    if (!f.title || !f.date_start || !f.date_end) return setErr('Title and both dates required.');
    if (f.date_end < f.date_start) return setErr('End date must be on or after start date.');
    setBusy(true);
    const { error } = await createEvent({ ...f, status: 'proposed' }, actor);
    setBusy(false);
    if (error) return setErr(error.message);
    setF({ title: '', kid: 'zoe', category: 'holiday', date_start: '', date_end: '', notes: '' });
    onDone();
  }

  return (
    <div style={{ padding: 16, border: '1px solid #d7dee8', borderRadius: 12, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Add an event</h3>

      <input placeholder="Title" value={f.title} onChange={set('title')} style={box} />

      <label style={{ fontSize: 12, color: '#667' }}>Category</label>
      <select value={f.category} onChange={set('category')} style={box}>
        <option value="holiday">Holiday</option>
        <option value="school">School</option>
        <option value="trip">Trip</option>
        <option value="other">Other</option>
      </select>

      <label style={{ fontSize: 12, color: '#667' }}>Kid</label>
      <select value={f.kid} onChange={set('kid')} style={box}>
        <option value="zoe">Zoe</option>
        <option value="noah">Noah</option>
        <option value="both">Both</option>
      </select>

      <label style={{ fontSize: 12, color: '#667' }}>Start date</label>
      <input type="date" value={f.date_start} onChange={set('date_start')} style={box} />

      <label style={{ fontSize: 12, color: '#667' }}>End date</label>
      <input type="date" value={f.date_end} onChange={set('date_end')} style={box} />

      <input placeholder="Notes (optional)" value={f.notes} onChange={set('notes')} style={box} />

      {err && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 10px' }}>{err}</p>}

      <button onClick={submit} disabled={busy}
        style={{ padding: '10px 18px', fontSize: 15, borderRadius: 8, border: 0, background: '#1565c0', color: '#fff', fontWeight: 600 }}>
        {busy ? 'Saving…' : 'Add event'}
      </button>
    </div>
  );
}
