// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | "How this works" card: shown once after Who's using this phone, reopened by the ? button
import { BETA } from '../version.js';

const STEPS = [
  ['See who has Zoe.', 'Green = Aaron/Rebecca, purple = Lisa.'],
  ['Need different days?', 'Tap Ask for a swap, then tap the first and last day.'],
  ['Wait for an email.', 'When the other household asks, you get an email. Tap Review and respond, then Agree or Let\'s talk.'],
  ['Plans changed?', 'Swaps tab, then ⋯, then Change or Cancel.'],
];

export default function HowItWorks({ onClose }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="How this works" style={{
      position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ fontSize: 20, margin: '0 0 12px' }}>How this works</h2>
        <ol style={{ margin: 0, paddingLeft: 22, fontSize: 15, lineHeight: 1.45, color: '#223' }}>
          {STEPS.map(([head, rest]) => (
            <li key={head} style={{ marginBottom: 10 }}><strong>{head}</strong> {rest}</li>
          ))}
        </ol>
        {BETA && <p style={{ fontSize: 13, color: '#5c4400', background: '#fff3cd', borderRadius: 8, padding: '8px 10px', margin: '4px 0 0' }}>Beta: only Aaron gets emails for now.</p>}
        <button onClick={onClose} style={{ width: '100%', minHeight: 52, marginTop: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 0, background: '#2e7d32', color: '#fff', cursor: 'pointer' }}>
          Got it
        </button>
      </div>
    </div>
  );
}
