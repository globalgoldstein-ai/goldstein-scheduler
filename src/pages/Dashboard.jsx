// Goldstein Scheduler | Phase 7 | Session 2 | Build 1 | 2026-08-23 22:12 ET | dashboard: balance + conflicts + write UI + draft button
import { useState } from 'react';
import { useData } from '../hooks/useData.js';
import { swapBalance, householdLabel } from '../lib/schedule.js';
import { detectConflicts } from '../lib/conflicts.js';
import { suggestAlternate } from '../lib/suggest.js';
import { updateStatus } from '../lib/mutations.js';
import BalanceTile from '../components/BalanceTile.jsx';
import SwapForm from '../components/SwapForm.jsx';
import EventForm from '../components/EventForm.jsx';

const ACTORS = ['aaron', 'rebecca', 'lisa'];

// The Claude API sometimes wraps output in ``` fences despite the system prompt.
// Strip them from anything we parse or display.
function stripFences(s = '') {
  const m = String(s).trim().match(/^```(?:[a-zA-Z0-9]*)?\s*\n?([\s\S]*?)\n?```$/);
  return (m ? m[1] : String(s)).trim();
}

// Defined at MODULE scope on purpose: a component declared inside Dashboard()
// is a new type on every render, which would remount and wipe draft state.
function ConflictCard({ conflict, sender }) {
  const { swap, event } = conflict;
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [draft, setDraft] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const draftMessage = async () => {
    setState('loading');
    setErrMsg('');
    setCopied(false);
    try {
      // Deterministic — this is the factual content the model must not invent.
      const alternate = suggestAlternate(swap, event);

      const res = await fetch('/.netlify/functions/draft-message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sender,
          alternate,
          conflict: {
            swapStart: swap.date_start,
            swapEnd: swap.date_end,
            eventTitle: event.title,
            eventCategory: event.category,
            eventStart: event.date_start,
            eventEnd: event.date_end,
          },
        }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(stripFences(raw));
      } catch {
        throw new Error(raw.slice(0, 160) || `HTTP ${res.status}`);
      }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      const text = stripFences(data.text);
      if (!text) throw new Error('Empty draft returned.');
      setDraft(text);
      setState('done');
      // No audit row: drafting is read-only. Only accept/apply actions log.
    } catch (e) {
      setErrMsg(e.message || 'Draft failed.');
      setState('error');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErrMsg('Copy blocked by the browser — select the text and copy manually.');
    }
  };

  return (
    <div style={{ padding: 12, marginBottom: 8, borderRadius: 8, background: '#fff4e5', border: '1px solid #ffcc80', fontSize: 14 }}>
      <div>⚠️ {conflict.message}</div>

      <button
        onClick={draftMessage}
        disabled={state === 'loading'}
        style={{
          marginTop: 10, padding: '6px 12px', fontSize: 13, borderRadius: 6,
          border: '1px solid #b26a00', background: '#fff', color: '#b26a00',
          fontWeight: 600, cursor: state === 'loading' ? 'default' : 'pointer',
          opacity: state === 'loading' ? 0.6 : 1,
        }}
      >
        {state === 'loading' ? 'Drafting…' : state === 'done' ? 'Redraft' : 'Draft message'}
      </button>

      {state === 'error' && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#c00' }}>Couldn’t draft: {errMsg}</div>
      )}

      {state === 'done' && (
        <div style={{ marginTop: 10, padding: 10, background: '#fff', border: '1px solid #ffcc80', borderRadius: 6 }}>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.45 }}>{draft}</div>
          <button
            onClick={copy}
            style={{ marginTop: 8, padding: '4px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #667', background: '#fff', color: '#445', fontWeight: 600 }}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          {errMsg && <div style={{ marginTop: 6, fontSize: 12, color: '#c00' }}>{errMsg}</div>}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { swaps, events, loading, error, refetch } = useData();
  const [actor, setActor] = useState('aaron');
  const [tab, setTab] = useState(null); // 'swap' | 'event' | null

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p style={{ padding: 24, color: '#c00' }}>Error: {error}</p>;

  const balance = swapBalance(swaps);
  const conflicts = detectConflicts(swaps, events);

  const agree = async (table, row) => {
    await updateStatus(table, row, 'agreed', actor);
    refetch();
  };

  const Row = ({ row, table, label }) => (
    <div style={{ padding: 12, marginBottom: 8, border: '1px solid #e3e8ef', borderRadius: 8, fontSize: 14 }}>
      <div>{label}</div>
      <div style={{ fontSize: 12, color: '#778', margin: '4px 0' }}>
        {row.date_start} → {row.date_end} · <strong>{row.status}</strong>
      </div>
      {row.status !== 'agreed' && (
        <button onClick={() => agree(table, row)}
          style={{ padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 600 }}>
          Mark agreed
        </button>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Goldstein Kids Scheduler</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: '#667', marginRight: 8 }}>I am:</label>
        <select value={actor} onChange={(e) => setActor(e.target.value)}
          style={{ padding: 8, fontSize: 15, borderRadius: 8, border: '1px solid #ccd' }}>
          {ACTORS.map((a) => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
        </select>
      </div>

      <BalanceTile balance={balance} />

      <div style={{ display: 'flex', gap: 8, margin: '20px 0 16px' }}>
        <button onClick={() => setTab(tab === 'swap' ? null : 'swap')}
          style={{ padding: '10px 16px', fontSize: 14, borderRadius: 8, border: '1px solid #2e7d32', background: tab === 'swap' ? '#2e7d32' : '#fff', color: tab === 'swap' ? '#fff' : '#2e7d32', fontWeight: 600 }}>
          + Swap
        </button>
        <button onClick={() => setTab(tab === 'event' ? null : 'event')}
          style={{ padding: '10px 16px', fontSize: 14, borderRadius: 8, border: '1px solid #1565c0', background: tab === 'event' ? '#1565c0' : '#fff', color: tab === 'event' ? '#fff' : '#1565c0', fontWeight: 600 }}>
          + Event
        </button>
      </div>

      {tab === 'swap' && <SwapForm actor={actor} onDone={() => { setTab(null); refetch(); }} />}
      {tab === 'event' && <EventForm actor={actor} onDone={() => { setTab(null); refetch(); }} />}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>
        Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
      </h2>
      {conflicts.length === 0 ? (
        <p style={{ color: '#778' }}>No holiday or school collisions. ✓</p>
      ) : (
        conflicts.map((c) => (
          <ConflictCard key={`${c.swap.id}:${c.event.id}`} conflict={c} sender={actor} />
        ))
      )}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>Swaps ({swaps.length})</h2>
      {swaps.map((s) => (
        <Row key={s.id} row={s} table="swaps"
          label={`${householdLabel(s.default_parent)} → ${householdLabel(s.receiving_parent)}`} />
      ))}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>Events ({events.length})</h2>
      {events.map((e) => (
        <Row key={e.id} row={e} table="events" label={`${e.title} (${e.category})`} />
      ))}
    </div>
  );
}
