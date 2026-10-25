// Goldstein Scheduler | Phase 11 | Session 5 | Build 2 | 2026-10-25 16:40 ET | dashboard: balance + holiday tally + schedule/holidays views + holiday swaps + trades + withdraw + tap-to-select swaps/returns + draft button
import { useState, useRef } from 'react';
import { useData } from '../hooks/useData.js';
import { swapBalance, householdLabel } from '../lib/schedule.js';
import { holidayTally, trackingSince } from '../lib/tally.js';
import { categoryLabel, kidLabel } from '../lib/labels.js';
import { suggestAlternate, suggestReturn } from '../lib/suggest.js';
import { dayOk, rangeProblem } from '../lib/pick.js';
import { updateStatus, updateTradeStatus, withdrawSwap } from '../lib/mutations.js';
import { groupSwaps } from '../lib/trades.js';
import BalanceTile from '../components/BalanceTile.jsx';
import CalendarView from '../components/CalendarView.jsx';
import HolidaysView from '../components/HolidaysView.jsx';
import { PickBanner, PickBar } from '../components/PickControls.jsx';
import { versionLabel } from '../version.js';
import EventForm from '../components/EventForm.jsx';

const ACTORS = ['aaron', 'rebecca', 'lisa'];
const householdOf = (a) => (a === 'lisa' ? 'lisa' : 'aaron_rebecca');

// The Claude API sometimes wraps output in ``` fences despite the system prompt.
// Strip them from anything we parse or display.
function stripFences(s = '') {
  const m = String(s).trim().match(/^```(?:[a-zA-Z0-9]*)?\s*\n?([\s\S]*?)\n?```$/);
  return (m ? m[1] : String(s)).trim();
}

// Defined at MODULE scope on purpose: a component declared inside Dashboard()
// is a new type on every render, which would remount and wipe draft state.
function ConflictCard({ conflict, sender, swaps, events }) {
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
      const today = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
      const alternate = suggestAlternate(swap, event, { swaps, events, today });

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
    <div style={{ padding: 12, marginBottom: 8, borderRadius: 8, background: '#f1faf9', border: '1px solid #80cbc4', fontSize: 14 }}>
      <div>⇄ {conflict.message}</div>

      <button
        onClick={draftMessage}
        disabled={state === 'loading'}
        style={{
          marginTop: 10, padding: '6px 12px', fontSize: 13, borderRadius: 6,
          border: '1px solid #00695c', background: '#fff', color: '#00695c',
          fontWeight: 600, cursor: state === 'loading' ? 'default' : 'pointer',
          opacity: state === 'loading' ? 0.6 : 1,
        }}
      >
        {state === 'loading' ? 'Drafting…' : state === 'done' ? 'Redraft' : 'Suggest other dates'}
      </button>
      {state === 'idle' && (
        <div style={{ fontSize: 12, color: '#667', marginTop: 4 }}>
          Optional. Writes a text you can copy and send, offering days outside the break. Nothing changes in the app.
        </div>
      )}

      {state === 'error' && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#c00' }}>Couldn’t draft: {errMsg}</div>
      )}

      {state === 'done' && (
        <div style={{ marginTop: 10, padding: 10, background: '#fff', border: '1px solid #80cbc4', borderRadius: 6 }}>
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
  const [view, setView] = useState('schedule'); // 'schedule' | 'holidays'
  const [pick, setPick] = useState(null); // tap-to-select: { kind: 'ask'|'return', original?, start, end, suggested, err }
  const calRef = useRef(null);
  const [jumpTo, setJumpTo] = useState(null); // 'YYYY-MM-DD#n': calendar shows this month after a save
  const saved = (date) => { if (date) setJumpTo(`${date}#${Date.now()}`); refetch(); };

  // Start select mode on the Schedule calendar and bring it into view.
  const beginPick = (next, month) => {
    setTab(null);
    setView('schedule');
    setPick(next);
    if (month) setJumpTo(`${month}#${Date.now()}`);
    setTimeout(() => calRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 60);
  };
  const beginAsk = (date = null) => beginPick({ kind: 'ask', start: date, end: null, suggested: false, err: null }, date);
  const beginReturn = (swap) => {
    const today = new Date().toLocaleDateString('en-CA');
    const s = suggestReturn(swap, { swaps, events, today });
    beginPick({ kind: 'return', original: swap, start: s?.date_start ?? null, end: s?.date_end ?? null, suggested: !!s, err: null }, s?.date_start ?? swap.date_start);
  };
  const tapDay = (d) => setPick((p) => {
    if (!p) return p;
    if (!p.start || p.end || d < p.start) return { ...p, start: d, end: null, suggested: false, err: null };
    const bad = rangeProblem(p, p.start, d);
    return bad ? { ...p, err: bad } : { ...p, end: d, suggested: false, err: null };
  });

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p style={{ padding: 24, color: '#c00' }}>Error: {error}</p>;

  const balance = swapBalance(swaps);
  const holiday = holidayTally(swaps, events);
  const since = trackingSince(swaps);

  const agree = async (table, row) => {
    await updateStatus(table, row, 'agreed', actor);
    refetch();
  };

  const agreeTrade = async (rows) => {
    await updateTradeStatus(rows, 'agreed', actor);
    refetch();
  };

  const nice = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);
  const statusText = (st) => (st === 'proposed' ? 'asked, waiting' : st === 'needs_discussion' ? 'needs discussion' : st);

  // Only the household that asked can withdraw, and only while it's still waiting.
  const withdraw = async (row) => {
    if (!window.confirm(`Withdraw this request (${span(row)})? It will be removed.`)) return;
    const { error } = await withdrawSwap(row, actor);
    if (error) window.alert(error.message);
    refetch();
  };
  const canWithdraw = (row) => row.status === 'proposed' && householdOf(row.proposed_by) === householdOf(actor);
  const withdrawBtn = (row) => canWithdraw(row) && (
    <button onClick={() => withdraw(row)}
      style={{ marginLeft: 8, padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #b71c1c', background: '#fff', color: '#b71c1c', fontWeight: 600 }}>
      Withdraw
    </button>
  );

  const Row = ({ row, table, label }) => (
    <div style={{ padding: 12, marginBottom: 8, border: '1px solid #e3e8ef', borderRadius: 8, fontSize: 14 }}>
      <div>{label}</div>
      <div style={{ fontSize: 12, color: '#778', margin: '4px 0' }}>
        {span(row)} · <strong>{statusText(row.status)}</strong>
      </div>
      {row.status !== 'agreed' && (
        <button onClick={() => agree(table, row)}
          style={{ padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 600 }}>
          Mark agreed
        </button>
      )}
      {table === 'swaps' && withdrawBtn(row)}
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

      <BalanceTile balance={balance} holiday={holiday} since={since} />

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        {[['schedule', 'Schedule'], ['holidays', 'Holidays']].map(([k, label]) => (
          <button key={k} onClick={() => { setView(k); if (k !== 'schedule') setPick(null); }} aria-pressed={view === k}
            style={{ padding: '8px 16px', fontSize: 14, borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              border: '1px solid #263238', background: view === k ? '#263238' : '#fff', color: view === k ? '#fff' : '#263238' }}>
            {label}
          </button>
        ))}
      </div>

      {view === 'schedule' ? (
        <div ref={calRef} style={{ scrollMarginTop: 8 }}>
          {pick && <PickBanner pick={pick} />}
          <CalendarView swaps={swaps} events={events} jumpTo={jumpTo}
            pick={pick} pickOk={(d) => dayOk(pick, d)} onPickDay={tapDay}
            onAskFrom={pick ? null : beginAsk} />
          {pick && <PickBar pick={pick} setPick={setPick} actor={actor} onCancel={() => setPick(null)}
            onDone={(d) => { setPick(null); saved(d); }} />}
        </div>
      ) : <HolidaysView swaps={swaps} events={events} />}

      <div style={{ display: 'flex', gap: 8, margin: '20px 0 16px' }}>
        <button onClick={() => (pick?.kind === 'ask' ? setPick(null) : beginAsk())}
          style={{ padding: '10px 16px', minHeight: 44, fontSize: 14, borderRadius: 8, border: '1px solid #2e7d32', background: pick?.kind === 'ask' ? '#2e7d32' : '#fff', color: pick?.kind === 'ask' ? '#fff' : '#2e7d32', fontWeight: 600 }}>
          Ask for days
        </button>
        <button onClick={() => { setPick(null); setTab(tab === 'event' ? null : 'event'); }}
          style={{ padding: '10px 16px', fontSize: 14, borderRadius: 8, border: '1px solid #1565c0', background: tab === 'event' ? '#1565c0' : '#fff', color: tab === 'event' ? '#fff' : '#1565c0', fontWeight: 600 }}>
          + Event
        </button>
      </div>

      {tab === 'event' && <EventForm actor={actor} onDone={(d) => { setTab(null); saved(d); }} />}

      <h2 style={{ fontSize: 16, margin: '24px 0 4px' }}>
        Swaps during holidays {holiday.items.length > 0 && `(${holiday.items.length})`}
      </h2>
      <p style={{ fontSize: 13, color: '#667', margin: '0 0 8px' }}>
        Agreed swaps that fall on a holiday or no-school day. That's allowed. They're listed so holidays stay fair, and counted in the Holiday swaps total above.
      </p>
      {holiday.items.length === 0 ? (
        <p style={{ color: '#778' }}>None yet.</p>
      ) : (
        holiday.items.map((c) => (
          <ConflictCard key={c.swap.id} conflict={c} sender={actor} swaps={swaps} events={events} />
        ))
      )}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>Swaps ({swaps.length})</h2>
      {groupSwaps(swaps).map((g) => {
        if (g.rows.length === 1) {
          const s = g.rows[0];
          return (
            <div key={g.key}>
              <Row row={s} table="swaps"
                label={`${householdLabel(s.default_parent)} → ${householdLabel(s.receiving_parent)}`} />
              {s.status !== 'needs_discussion' && !(pick?.kind === 'return' && pick.original.id === s.id) && (
                <button onClick={() => beginReturn(s)}
                  style={{ margin: '-2px 0 10px', padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #00695c', background: '#fff', color: '#00695c', fontWeight: 600 }}>
                  ⇄ Add the other side (trade)
                </button>
              )}
            </div>
          );
        }
        const pending = g.rows.some((r) => r.status !== 'agreed');
        return (
          <div key={g.key} style={{ padding: 12, marginBottom: 8, border: '1px solid #80cbc4', background: '#f1faf9', borderRadius: 8, fontSize: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⇄ Trade</div>
            {g.rows.map((r) => (
              <div key={r.id} style={{ marginBottom: 4 }}>
                {householdLabel(r.receiving_parent)} gets {span(r)} · <strong>{statusText(r.status)}</strong>
                {withdrawBtn(r)}
              </div>
            ))}
            {pending && (
              <button onClick={() => agreeTrade(g.rows)}
                style={{ marginTop: 6, padding: '6px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #2e7d32', background: '#fff', color: '#2e7d32', fontWeight: 600 }}>
                Mark both agreed
              </button>
            )}
          </div>
        );
      })}

      <h2 style={{ fontSize: 16, margin: '24px 0 8px' }}>Events ({events.length})</h2>
      {events.map((e) => (
        <Row key={e.id} row={e} table="events" label={`${e.title} (${categoryLabel(e.category)}${e.kid === 'zoe' ? '' : `, ${kidLabel(e.kid)}`})`} />
      ))}

      <p style={{ fontSize: 11, color: '#99a', margin: '32px 0 0', textAlign: 'center' }}>{versionLabel()}</p>
    </div>
  );
}
