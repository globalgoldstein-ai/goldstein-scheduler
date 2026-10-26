// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | toast: a short confirmation at the bottom of the screen, optional Undo
import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(onClose, toast.ms ?? 4000);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', left: 12, right: 12, bottom: 84, zIndex: 30, maxWidth: 520, margin: '0 auto',
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
      background: '#263238', color: '#fff', fontSize: 14, lineHeight: 1.35, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <span style={{ flex: 1 }}>{toast.text}</span>
      {toast.actionLabel && (
        <button onClick={() => { const fn = toast.onAction; onClose(); fn?.(); }}
          style={{ minHeight: 44, padding: '8px 14px', fontSize: 14, fontWeight: 800, borderRadius: 8, border: '1px solid #fff', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
          {toast.actionLabel}
        </button>
      )}
    </div>
  );
}
