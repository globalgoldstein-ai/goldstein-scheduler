// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | one-time "Add to Home Screen" tip for iPhone and iPad (Safari and Chrome)

export default function HomeScreenTip({ onClose }) {
  return (
    <div role="note" style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#e3f2fd', border: '1px solid #64b5f6', color: '#0d2f57', fontSize: 14, lineHeight: 1.4 }}>
      <div><strong>Put this on your home screen:</strong> tap the <strong>Share</strong> button (Safari: bottom bar · Chrome: top right of the address bar), then <strong>Add to Home Screen</strong>.</div>
      <button onClick={onClose} style={{ marginTop: 8, minHeight: 44, padding: '8px 16px', fontSize: 15, fontWeight: 700, borderRadius: 8, border: '1px solid #1565c0', background: '#fff', color: '#1565c0', cursor: 'pointer' }}>
        Got it
      </button>
    </div>
  );
}
