// Goldstein Scheduler | Phase 11 | Session 5 | Build 3 | 2026-10-25 16:44 ET | History tab: every recorded change, newest first, in plain words
import { useState } from 'react';
import { describe, whenET } from '../lib/history.js';

const pill = (on) => ({
  padding: '8px 14px', minHeight: 44, fontSize: 14, borderRadius: 8, fontWeight: 600, cursor: 'pointer',
  border: '1px solid #263238', background: on ? '#263238' : '#fff', color: on ? '#fff' : '#263238',
});
const TONE = { create: '#2e7d32', edit: '#1565c0', delete: '#b71c1c' };

export default function HistoryView({ audit = [] }) {
  const [kind, setKind] = useState('all'); // all | swap | event
  const rows = audit.filter((r) => kind === 'all' || r.entity_type === kind);
  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontSize: 13, color: '#667', margin: '0 0 10px' }}>
        Every change made in the app, newest first. Nothing here can be edited or removed.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['swap', 'Swaps'], ['event', 'Events']].map(([k, label]) => (
          <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} style={pill(kind === k)}>{label}</button>
        ))}
      </div>
      {rows.length === 0 && <p style={{ color: '#778' }}>No changes recorded yet.</p>}
      {rows.map((r) => {
        const { text, details } = describe(r);
        return (
          <div key={r.id} style={{ padding: 12, marginBottom: 8, border: '1px solid #e3e8ef', borderLeft: `4px solid ${TONE[r.action] ?? '#889'}`, borderRadius: 8, fontSize: 14 }}>
            <div>{text}</div>
            <div style={{ fontSize: 12, color: '#778', marginTop: 4 }}>{whenET(r.ts)}</div>
            {details.length > 0 && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: 12, color: '#556', cursor: 'pointer', minHeight: 24 }}>Details</summary>
                {details.map((d) => (
                  <div key={d.key} style={{ fontSize: 12, color: '#445', marginTop: 3 }}>
                    <strong>{d.field}:</strong> {r.action === 'create' ? d.after : r.action === 'delete' ? d.before : `${d.before} → ${d.after}`}
                  </div>
                ))}
              </details>
            )}
          </div>
        );
      })}
      <p style={{ fontSize: 11, color: '#99a' }}>Shows the latest {audit.length >= 200 ? '200' : audit.length} changes.</p>
    </div>
  );
}
