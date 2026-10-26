// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 21:10 ET | full-screen "Who's using this phone?" picker (replaced by sign-in when auth lands)
import BetaBanner from './BetaBanner.jsx';
import { ACTORS, cap, householdOf, HOUSE_COLORS } from '../lib/people.js';

export default function WhoPicker({ current, onPick, onCancel }) {
  return (
    <div style={{ minHeight: '100vh', boxSizing: 'border-box', padding: 24, fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
      <BetaBanner />
      <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>Who's using this phone?</h1>
      <p style={{ fontSize: 14, color: '#667', margin: '0 0 20px' }}>So changes are saved under your name. You can switch later.</p>
      {ACTORS.map((a) => {
        const c = HOUSE_COLORS[householdOf(a)];
        return (
          <button key={a} onClick={() => onPick(a)}
            style={{ minHeight: 64, marginBottom: 12, fontSize: 20, fontWeight: 700, borderRadius: 12, cursor: 'pointer', background: c.bg, color: c.edge, border: `${current === a ? 3 : 1}px solid ${c.edge}` }}>
            {cap(a)}
          </button>
        );
      })}
      {onCancel && (
        <button onClick={onCancel}
          style={{ minHeight: 48, marginTop: 4, fontSize: 15, borderRadius: 10, border: '1px solid #99a', background: '#fff', color: '#445', cursor: 'pointer' }}>
          Cancel
        </button>
      )}
    </div>
  );
}
