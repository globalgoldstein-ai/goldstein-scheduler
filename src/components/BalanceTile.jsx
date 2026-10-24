// Goldstein Scheduler | Phase 9 | Session 3 | Build 2 | 2026-10-24 13:44 ET | balance tile: swap days + holiday swaps, both "since" a date
import { parseDate } from '../lib/schedule.js';

const sinceLabel = (since) =>
  since
    ? `since ${parseDate(since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
    : 'no agreed swaps yet';

function Panel({ title, value, even, detail, since }) {
  return (
    <div style={{
      flex: '1 1 150px', boxSizing: 'border-box', padding: '14px 14px', borderRadius: 12,
      background: even ? '#eef2f7' : '#e8f5e9', border: '1px solid #d7dee8',
    }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#667', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: even ? '#445' : '#2e7d32' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#778', marginTop: 4 }}>{detail}</div>
      <div style={{ fontSize: 11, color: '#99a', marginTop: 2 }}>{since}</div>
    </div>
  );
}

export default function BalanceTile({ balance, holiday, since }) {
  const s = sinceLabel(since);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Panel
        title="Swap balance (days)"
        value={balance.label}
        even={balance.net === 0}
        detail={`Aaron/Rebecca ${balance.arDays}d · Lisa ${balance.lisaDays}d`}
        since={s}
      />
      <Panel
        title="Holiday swaps"
        value={holiday.label}
        even={holiday.net === 0}
        detail={`Aaron/Rebecca ${holiday.arCount} · Lisa ${holiday.lisaCount}`}
        since={s}
      />
    </div>
  );
}
