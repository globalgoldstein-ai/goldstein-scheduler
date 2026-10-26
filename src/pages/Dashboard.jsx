// Goldstein Scheduler | Phase 11 | Session 6 | Build 2 | 2026-10-25 20:38 ET | dashboard (11c simplify): tabs, Right now + Needs your OK, who's-using-this-phone chip; range may include own days; Cancel swap
import { useState, useRef } from 'react';
import { useData } from '../hooks/useData.js';
import { swapBalance, parseDate } from '../lib/schedule.js';
import { holidayTally, trackingSince } from '../lib/tally.js';
import { rangeProblem } from '../lib/pick.js';
import { updateStatus, cancelSwap } from '../lib/mutations.js';
import { loadActor, saveActor, cap, householdOf, HOUSE_COLORS } from '../lib/people.js';
import BalanceTile from '../components/BalanceTile.jsx';
import CalendarView from '../components/CalendarView.jsx';
import HolidaysView from '../components/HolidaysView.jsx';
import HolidaySwapCards from '../components/ConflictCard.jsx';
import HistoryView from '../components/HistoryView.jsx';
import PickPanel from '../components/PickControls.jsx';
import SwapsView from '../components/SwapsView.jsx';
import WhoPicker from '../components/WhoPicker.jsx';
import TabBar from '../components/TabBar.jsx';
import { NowCard, NeedsOkCard } from '../components/NowCard.jsx';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);

export default function Dashboard() {
  const { swaps, events, audit, loading, error, refetch } = useData();
  const [actor, setActor] = useState(loadActor); // remembered on this phone (localStorage gs.actor)
  const [changingWho, setChangingWho] = useState(false);
  const [view, setView] = useState('schedule'); // 'schedule' | 'holidays' | 'swaps' | 'history'
  const [pick, setPick] = useState(null); // tap-to-select: { kind: 'ask'|'edit', receiving, original?, start, end, suggested, err }
  const calRef = useRef(null);
  const [jumpTo, setJumpTo] = useState(null); // 'YYYY-MM-DD#n': calendar shows this month after a save
  const saved = (date) => { if (date) setJumpTo(`${date}#${Date.now()}`); refetch(); };

  const goTab = (k) => {
    setView(k);
    if (k !== 'schedule') setPick(null);
    try { window.scrollTo(0, 0); } catch { /* not a browser */ }
  };

  // Start select mode on the Schedule calendar and bring it into view.
  const beginPick = (next, month) => {
    setView('schedule');
    setPick(next);
    if (month) setJumpTo(`${month}#${Date.now()}`);
    setTimeout(() => calRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 80);
  };
  const beginEdit = (row) => beginPick({ kind: 'edit', receiving: row.receiving_parent, original: row, start: row.date_start, end: row.date_end, suggested: true, err: null }, row.date_start);
  const beginAsk = (date = null) => beginPick({ kind: 'ask', receiving: householdOf(actor), start: date, end: null, suggested: false, err: null }, date);
  const tapDay = (d) => setPick((p) => {
    if (!p) return p;
    if (!p.start || p.end || d < p.start) return { ...p, start: d, end: null, suggested: false, err: null };
    const bad = rangeProblem(p, p.start, d);
    return bad ? { ...p, err: bad } : { ...p, end: d, suggested: false, err: null };
  });

  if (!actor || changingWho) {
    return <WhoPicker current={actor} onCancel={actor ? () => setChangingWho(false) : null}
      onPick={(a) => { saveActor(a); setActor(a); setPick(null); setChangingWho(false); }} />;
  }
  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p style={{ padding: 24, color: '#c00' }}>Error: {error}</p>;

  const today = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const balance = swapBalance(swaps);
  const holiday = holidayTally(swaps, events);
  const since = trackingSince(swaps);
  const chip = HOUSE_COLORS[householdOf(actor)];
  const needsOk = swaps.filter((s) => s.status === 'proposed' && householdOf(s.proposed_by) !== householdOf(actor) && s.date_end >= today).length;

  const setStatus = async (row, status) => {
    const { error: e } = await updateStatus('swaps', row, status, actor);
    if (e) window.alert(e.message);
    refetch();
  };
  const cancel = async (row) => {
    const what = row.status === 'agreed' ? 'agreed swap' : 'request';
    if (!window.confirm(`Cancel this ${what} (${span(row)})? The regular schedule applies again. It will show in History.`)) return;
    const { error: e } = await cancelSwap(row, actor);
    if (e) window.alert(e.message);
    refetch();
  };
  const on = {
    agree: (row) => setStatus(row, 'agreed'),
    talk: (row) => setStatus(row, 'needs_discussion'),
    cancel,
    change: beginEdit,
  };

  return (
    <div style={{ padding: '16px 20px 96px', fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Goldstein Kids Scheduler</h1>
        <button onClick={() => setChangingWho(true)} aria-label={`Using as ${cap(actor)}. Tap to switch.`}
          style={{ minHeight: 44, padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 22, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, background: chip.bg, color: chip.edge, border: `1px solid ${chip.edge}` }}>
          {cap(actor)} ▾
        </button>
      </header>

      {view === 'schedule' && (
        <>
          <NowCard swaps={swaps} today={today} />
          <NeedsOkCard swaps={swaps} actor={actor} today={today} onAgree={on.agree} onTalk={on.talk} onChange={on.change} />
          <div ref={calRef} style={{ scrollMarginTop: 8 }}>
            {pick && <PickPanel key={`${pick.kind}-${pick.original?.id ?? ''}`} pick={pick} setPick={setPick} actor={actor} onCancel={() => setPick(null)}
              onDone={(d) => { setPick(null); saved(d); }} />}
            <CalendarView swaps={swaps} events={events} jumpTo={jumpTo}
              pick={pick} onPickDay={tapDay}
              onAskFrom={pick ? null : beginAsk} onEditSwap={pick ? null : beginEdit} />
          </div>
          {!pick && (
            <button onClick={() => beginAsk()}
              style={{ width: '100%', minHeight: 52, marginTop: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 0, background: '#2e7d32', color: '#fff', cursor: 'pointer' }}>
              Ask for days
            </button>
          )}
          <BalanceTile balance={balance} holiday={holiday} since={since} />
        </>
      )}

      {view === 'holidays' && (
        <>
          <HolidaySwapCards items={holiday.items} sender={actor} swaps={swaps} events={events} />
          <HolidaysView swaps={swaps} events={events} />
        </>
      )}

      {view === 'swaps' && <SwapsView swaps={swaps} actor={actor} today={today} on={on} onEventSaved={saved} />}

      {view === 'history' && <HistoryView audit={audit} />}

      <TabBar view={view} onChange={goTab} badge={{ schedule: needsOk }} />
    </div>
  );
}
