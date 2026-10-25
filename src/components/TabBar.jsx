// Goldstein Scheduler | Phase 11 | Session 6 | Build 1 | 2026-10-25 17:14 ET | bottom tab bar: Schedule · Holidays · Swaps · History
export const TABS = [['schedule', 'Schedule'], ['holidays', 'Holidays'], ['swaps', 'Swaps'], ['history', 'History']];

export default function TabBar({ view, onChange, badge = {} }) {
  return (
    <nav aria-label="Main" style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20, display: 'flex', background: '#fff',
      borderTop: '1px solid #d7dee8', paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(([k, label]) => {
        const on = view === k;
        return (
          <button key={k} onClick={() => onChange(k)} aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, minHeight: 56, fontSize: 14, fontWeight: on ? 800 : 600, cursor: 'pointer', border: 0, background: 'transparent',
              color: on ? '#1565c0' : '#556', borderTop: `3px solid ${on ? '#1565c0' : 'transparent'}`,
            }}>
            {label}{badge[k] ? <span style={{ marginLeft: 6, background: '#c62828', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 12 }}>{badge[k]}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
