// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 20:52 ET | holiday swap cards with the optional "Suggest other dates" draft (read-only, no audit rows)
import { useState } from 'react';
import { suggestAlternate } from '../lib/suggest.js';

// The Claude API sometimes wraps output in ``` fences despite the system prompt.
// Strip them from anything we parse or display.
function stripFences(s = '') {
  const m = String(s).trim().match(/^```(?:[a-zA-Z0-9]*)?\s*\n?([\s\S]*?)\n?```$/);
  return (m ? m[1] : String(s)).trim();
}

// Defined at MODULE scope on purpose: a component declared inside Dashboard()
// is a new type on every render, which would remount and wipe draft state.
export function ConflictCard({ conflict, sender, swaps, events }) {
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
      <div style={{ fontSize: 12, fontWeight: 700, color: '#00695c', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Agreed swap during a holiday</div>
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
          Optional. Claude writes a text you can copy and send, offering other days outside the break. Nothing changes in the app.
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
            {copied ? 'Copied ✓' : 'Copy text'}
          </button>
          <div style={{ marginTop: 6, fontSize: 12, color: '#667' }}>This is only a draft. Copy it into your messages. Redraft writes a different version; neither one changes the schedule.</div>
          {errMsg && <div style={{ marginTop: 6, fontSize: 12, color: '#c00' }}>{errMsg}</div>}
        </div>
      )}
    </div>
  );
}

// The "Swaps during holidays" section, shown on the Holidays tab.
export default function HolidaySwapCards({ items = [], sender, swaps, events }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Swaps during holidays {items.length > 0 && `(${items.length})`}</h2>
      <p style={{ fontSize: 13, color: '#667', margin: '0 0 8px' }}>
        Agreed swaps that fall on a holiday or no-school day. That's allowed. They're listed so holidays stay fair.
      </p>
      {items.length === 0
        ? <p style={{ color: '#778' }}>None yet.</p>
        : items.map((c) => <ConflictCard key={c.swap.id} conflict={c} sender={sender} swaps={swaps} events={events} />)}
    </div>
  );
}
