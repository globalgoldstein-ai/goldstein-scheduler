// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 21:10 ET | beta notice shown at the top of every screen until launch
import { BETA } from '../version.js';

export default function BetaBanner() {
  if (!BETA) return null;
  return (
    <div role="note" style={{ margin: '0 0 12px', padding: '8px 12px', borderRadius: 8, background: '#fff3cd', border: '1px solid #e0b43a', color: '#5c4400', fontSize: 13, lineHeight: 1.35 }}>
      <b>Beta test.</b> The swaps and events here are sample data until we finalize. Email alerts go only to Aaron for now.
    </div>
  );
}
