// Goldstein Scheduler | Phase 5 | Session 1 | Build 1 | 2026-07-03 13:04 ET | dashboard: balance + conflict flags
import { useData } from '../hooks/useData.js';
import { swapBalance } from '../lib/schedule.js';
import { detectConflicts } from '../lib/conflicts.js';
import BalanceTile from '../components/BalanceTile.jsx';

export default function Dashboard() {
  const { swaps, events, loading, error } = useData();

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p style={{ padding: 24, color: '#c00' }}>Error: {error}</p>;

  const balance = swapBalance(swaps);
  const conflicts = detectConflicts(swaps, events);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Goldstein Kids Scheduler</h1>

      <BalanceTile balance={balance} />

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>
        Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
      </h2>
      {conflicts.length === 0 ? (
        <p style={{ color: '#778' }}>No holiday or school collisions. ✓</p>
      ) : (
        conflicts.map((c, i) => (
          <div key={i} style={{
            padding: 12, marginBottom: 8, borderRadius: 8,
            background: '#fff4e5', border: '1px solid #ffcc80', fontSize: 14,
          }}>
            ⚠️ {c.message}
          </div>
        ))
      )}

      <p style={{ fontSize: 12, color: '#99a', marginTop: 24 }}>
        {swaps.length} swaps · {events.length} events loaded
      </p>
    </div>
  );
}
