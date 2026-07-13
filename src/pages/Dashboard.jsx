// Goldstein Scheduler | Phase 6 | Session 1 | Build 1 | 2026-07-03 13:52 ET | dashboard: balance + conflicts + write UI
import { useState } from 'react';
import { useData } from '../hooks/useData.js';
import { swapBalance, householdLabel } from '../lib/schedule.js';
import { detectConflicts } from '../lib/conflicts.js';
import { updateStatus } from '../lib/mutations.js';
import BalanceTile from '../components/BalanceTile.jsx';
import SwapForm from '../components/SwapForm.jsx';
import EventForm from '../components/EventForm.jsx';

const ACTORS = ['aaron', 'rebecca', 'lisa'];

export default function Dashboard() {
  const { swaps, events, loading, error, refetch } = useData();
  const [actor, setActor] = useState('aaron');
  const [tab, setTab] = useState(null); // 'swap' | 'event' | null

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p style={{ padding: 24, color: '#c00' }}>Error: {error}</p>;

  const balance = swapBalance(swaps);
  const conflicts = detectConflicts(swaps, events);

  const agree = async (table, row) => {
    await updateStatus(table, row, 'agreed', actor);
    refetch();
  };

  const Row = ({ row, table, label }) => (
    <div style={{ padding: 12, marginBottom: 8, border: '1px solid #e3e8ef', borderRadius: 8, fontSize: 14 }}>
      <div>{label}</div>
      <div style={{ fontSize: 12, color: '#778', margin: '4px 0' }}>
        {row.date_start} → {row.date_end} · <strong>{row.status}</strong>
      </div>
      {row.status !== 'agreed' && (
        <button onClick={() => agree(table, row)}
          style={{ padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 600 }}>
          Mark agreed
        </button>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Goldstein Kids Scheduler</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#667', marginRight: 8 }}>I am:</label>
        <select value={actor} onChange={(e) => setActor(e.target.value)}
          style={{ padding: 8, fontSize: 15, borderRadius: 8, border: '1px solid #ccd' }}>
          {ACTORS.map((a) => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
        </select>
      </div>

      <BalanceTile balance={balance} />

      <div style={{ display: 'flex', gap: 8, margin: '20px 0 16px' }}>
        <button onClick={() => setTab(tab === 'swap' ? null : 'swap')}
          style={{ padding: '10px 16px', fontSize: 14, borderRadius: 8, border: '1px solid #2e7d32', background: tab === 'swap' ? '#2e7d32' : '#fff', color: tab === 'swap' ? '#fff' : '#2e7d32', fontWeight: 600 }}>
          + Swap
        </button>
        <button onClick={() => setTab(tab === 'event' ? null : 'event')}
          style={{ padding: '10px 16px', fontSize: 14, borderRadius: 8, border: '1px solid #1565c0', background: tab === 'event' ? '#1565c0' : '#fff', color: tab === 'event' ? '#fff' : '#1565c0', fontWeight: 600 }}>
          + Event
        </button>
      </div>

      {tab === 'swap' && <SwapForm actor={actor} onDone={() => { setTab(null); refetch(); }} />}
      {tab === 'event' && <EventForm actor={actor} onDone={() => { setTab(null); refetch(); }} />}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>
        Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
      </h2>
      {conflicts.length === 0 ? (
        <p style={{ color: '#778' }}>No holiday or school collisions. ✓</p>
      ) : (
        conflicts.map((c, i) => (
          <div key={i} style={{ padding: 12, marginBottom: 8, borderRadius: 8, background: '#fff4e5', border: '1px solid #ffcc80', fontSize: 14 }}>
            ⚠️ {c.message}
          </div>
        ))
      )}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>Swaps ({swaps.length})</h2>
      {swaps.map((s) => (
        <Row key={s.id} row={s} table="swaps"
          label={`${householdLabel(s.default_parent)} → ${householdLabel(s.receiving_parent)}`} />
      ))}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>Events ({events.length})</h2>
      {events.map((e) => (
        <Row key={e.id} row={e} table="events" label={`${e.title} (${e.category})`} />
      ))}
    </div>
  );
}
