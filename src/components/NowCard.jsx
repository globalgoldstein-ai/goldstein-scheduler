// Goldstein Scheduler | Phase 11 | Session 6 | Build 1 | 2026-10-25 17:14 ET | home cards: "Right now" and "Needs your OK"
import { parseDate, householdLabel } from '../lib/schedule.js';
import { rightNow } from '../lib/now.js';
import { cap, householdOf, HOUSE_COLORS } from '../lib/people.js';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);
const big = { minHeight: 44, padding: '10px 16px', fontSize: 15, borderRadius: 8, fontWeight: 700, cursor: 'pointer' };

export function NowCard({ swaps, today }) {
  const n = rightNow(swaps, today);
  const c = HOUSE_COLORS[n.holder];
  return (
    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: c.bg, border: `1px solid ${c.edge}` }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#667' }}>Right now</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: c.edge, marginTop: 2 }}>Zoe is with {householdLabel(n.holder)}</div>
      <div style={{ fontSize: 14, color: '#445', marginTop: 2 }}>
        {n.next
          ? `until ${nice(n.until)} · ${householdLabel(n.next.holder)} from ${nice(n.next.from)}`
          : 'No change coming up.'}
      </div>
    </div>
  );
}

// Requests from the OTHER household that still wait for an answer.
export function NeedsOkCard({ swaps, actor, today, onAgree, onTalk }) {
  const mine = householdOf(actor);
  const items = swaps.filter((s) => s.status === 'proposed' && householdOf(s.proposed_by) !== mine && s.date_end >= today);
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#fff8e1', border: '1px solid #ffb300' }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#8a5a00', fontWeight: 700 }}>Needs your OK</div>
      {items.map((s) => (
        <div key={s.id} style={{ marginTop: 8 }}>
          <div style={{ fontSize: 15 }}>
            <strong>{cap(s.proposed_by)}</strong>{householdOf(s.proposed_by) === s.receiving_parent
              ? <> asks to have Zoe <strong>{span(s)}</strong>.</>
              : <> asks for <strong>{span(s)}</strong>. {householdLabel(s.receiving_parent)} would have Zoe.</>}
          </div>
          {s.notes && <div style={{ fontSize: 13, color: '#665', marginTop: 2 }}>“{s.notes}”</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={() => onAgree(s)} style={{ ...big, border: 0, background: '#2e7d32', color: '#fff' }}>Agree</button>
            <button onClick={() => onTalk(s)} style={{ ...big, border: '1px solid #99a', background: '#fff', color: '#445' }}>Let's talk</button>
          </div>
        </div>
      ))}
    </div>
  );
}
