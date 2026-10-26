// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | balance: one line, tap to open the two panels with their explanations
import { useState } from 'react';
import { parseDate } from '../lib/schedule.js';

const sinceLabel = (since) =>
  since
    ? `since ${parseDate(since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
    : 'no agreed swaps yet';

function Panel({ title, value, even, detail, since, explain }) {
  return (
    <div style={{
      flex: '1 1 150px', boxSizing: 'border-box', padding: '14px 14px', borderRadius: 12,
      background: even ? '#eef2f7' : '#e8f5e9', border: '1px solid #d7dee8',
    }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, color: '#667', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: even ? '#445' : '#2e7d32' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#556', marginTop: 4 }}>{explain}</div>
      <div style={{ fontSize: 12, color: '#778', marginTop: 4 }}>{detail}</div>
      <div style={{ fontSize: 11, color: '#99a', marginTop: 2 }}>{since}</div>
    </div>
  );
}

export default function BalanceTile({ balance, holiday, since }) {
  const s = sinceLabel(since);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        style={{ width: '100%', minHeight: 44, padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#445', background: '#f5f7fa', border: '1px solid #d7dee8', borderRadius: 10, cursor: 'pointer' }}>
        Days borrowed: <strong>{balance.label}</strong> · Holiday swaps: <strong>{holiday.label}</strong> <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && <Details balance={balance} holiday={holiday} s={s} />}
    </div>
  );
}

function Details({ balance, holiday, s }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
      <Panel
        title="Days borrowed"
        value={balance.label}
        explain="Extra days each household has had Zoe because of agreed swaps."
        even={balance.net === 0}
        detail={`Aaron/Rebecca ${balance.arDays}d · Lisa ${balance.lisaDays}d`}
        since={s}
      />
      <Panel
        title="Holiday swaps"
        value={holiday.label}
        explain="Agreed swaps that landed on a holiday or no-school day."
        even={holiday.net === 0}
        detail={`Aaron/Rebecca ${holiday.arCount} · Lisa ${holiday.lisaCount}`}
        since={s}
      />
    </div>
  );
}
