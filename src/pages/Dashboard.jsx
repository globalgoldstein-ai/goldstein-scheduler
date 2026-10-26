// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | dashboard (11c simplify): tabs, Right now + Needs your OK, who's-using-this-phone chip; range may include own days; Cancel swap
import { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../hooks/useData.js';
import { swapBalance, parseDate, householdLabel } from '../lib/schedule.js';
import { holidayTally, trackingSince } from '../lib/tally.js';
import { rangeProblem } from '../lib/pick.js';
import { updateStatus, cancelSwap, restoreSwap } from '../lib/mutations.js';
import { loadActor, saveActor, cap, householdOf, otherHousehold, HOUSE_COLORS } from '../lib/people.js';
import BalanceTile from '../components/BalanceTile.jsx';
import CalendarView from '../components/CalendarView.jsx';
import HolidaysView from '../components/HolidaysView.jsx';
import HolidaySwapCards from '../components/ConflictCard.jsx';
import HistoryView from '../components/HistoryView.jsx';
import PickPanel from '../components/PickControls.jsx';
import SwapsView from '../components/SwapsView.jsx';
import BetaBanner from '../components/BetaBanner.jsx';
import Toast from '../components/Toast.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import HomeScreenTip from '../components/HomeScreenTip.jsx';
import { BETA } from '../version.js';
import { HOWTO_KEY, A2HS_KEY, hasSeen, markSeen, canSuggestHomeScreen } from '../lib/hints.js';
import WhoPicker from '../components/WhoPicker.jsx';
import TabBar from '../components/TabBar.jsx';
import { NowCard, NeedsOkCard } from '../components/NowCard.jsx';

const nice = (s) => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const span = (r) => (r.date_start === r.date_end ? nice(r.date_start) : `${nice(r.date_start)} – ${nice(r.date_end)}`);

// An email link looks like /?swap=<id>: open the Swaps tab on that swap, then tidy the address bar.
const readSwapParam = () => { try { return new URLSearchParams(window.location.search).get('swap'); } catch { return null; } };

export default function Dashboard() {
  const { swaps, events, audit, loading, error, refetch } = useData();
  const [actor, setActor] = useState(loadActor); // remembered on this phone (localStorage gs.actor)
  const [changingWho, setChangingWho] = useState(false);
  const [focusId, setFocusId] = useState(readSwapParam); // swap opened from an email link
  const [view, setView] = useState(() => (readSwapParam() ? 'swaps' : 'schedule')); // 'schedule' | 'holidays' | 'swaps' | 'history'
  useEffect(() => { if (focusId) { try { window.history.replaceState(null, '', window.location.pathname); } catch { /* not a browser */ } } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [pick, setPick] = useState(null); // tap-to-select: { kind: 'ask'|'edit', receiving, original?, start, end, suggested, err }
  const calRef = useRef(null);
  const [howOpen, setHowOpen] = useState(() => !hasSeen(HOWTO_KEY)); // "How this works", once, then via the ? button
  const [tipOpen, setTipOpen] = useState(() => canSuggestHomeScreen() && !hasSeen(A2HS_KEY));
  const [toast, setToast] = useState(null); // { text, actionLabel?, onAction?, ms? }
  const closeToast = useCallback(() => setToast(null), []);
  const closeHow = () => { markSeen(HOWTO_KEY); setHowOpen(false); };
  const closeTip = () => { markSeen(A2HS_KEY); setTipOpen(false); };
  const beta = (t) => (BETA ? `${t} (Beta: email goes to Aaron only.)` : t);
  const [jumpTo, setJumpTo] = useState(null); // 'YYYY-MM-DD#n': calendar shows this month after a save
  const saved = (date) => { if (date) setJumpTo(`${date}#${Date.now()}`); refetch(); };

  const goTab = (k) => {
    setView(k);
    setFocusId(null);
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
    if (e) { window.alert(e.message); refetch(); return; }
    refetch();
    const asker = householdLabel(householdOf(row.proposed_by));
    setToast({ text: beta(status === 'agreed' ? `Agreed. ${asker} will get an email.` : `Sent. ${asker} will get an email.`) });
  };
  // Cancel is immediate; the toast offers Undo for 10 seconds (puts the same row back, logged as restored).
  const cancel = async (row) => {
    const { error: e } = await cancelSwap(row, actor);
    if (e) { window.alert(e.message); return; }
    refetch();
    setToast({
      text: 'Swap cancelled', actionLabel: 'Undo', ms: 10000,
      onAction: async () => {
        const r = await restoreSwap(row, actor);
        if (r.error) { window.alert(`Couldn't undo: ${r.error.message}`); return; }
        refetch();
        setToast({ text: 'Swap restored.' });
      },
    });
  };
  const on = {
    agree: (row) => setStatus(row, 'agreed'),
    talk: (row) => setStatus(row, 'needs_discussion'),
    cancel,
    change: beginEdit,
  };

  return (
    <div style={{ padding: '16px 20px 96px', fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>
      <BetaBanner />
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>Goldstein Kids Scheduler</h1>
        <button onClick={() => setHowOpen(true)} aria-label="How this works"
          style={{ minWidth: 44, minHeight: 44, marginLeft: 'auto', fontSize: 18, fontWeight: 800, borderRadius: 22, cursor: 'pointer', background: '#fff', color: '#1565c0', border: '1px solid #1565c0' }}>?</button>
        <button onClick={() => setChangingWho(true)} aria-label={`Using as ${cap(actor)}. Tap to switch.`}
          style={{ minHeight: 44, padding: '6px 14px', fontSize: 14, fontWeight: 700, borderRadius: 22, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, background: chip.bg, color: chip.edge, border: `1px solid ${chip.edge}` }}>
          {cap(actor)} ▾
        </button>
      </header>

      {!howOpen && tipOpen && <HomeScreenTip onClose={closeTip} />}

      {view === 'schedule' && (
        <>
          <NowCard swaps={swaps} today={today} />
          <NeedsOkCard swaps={swaps} actor={actor} today={today} onAgree={on.agree} onTalk={on.talk} onChange={on.change} />
          <div ref={calRef} style={{ scrollMarginTop: 8 }}>
            {pick && <PickPanel key={`${pick.kind}-${pick.original?.id ?? ''}`} pick={pick} setPick={setPick} actor={actor} onCancel={() => setPick(null)}
              onDone={(d, r) => {
                setPick(null); saved(d);
                const other = householdLabel(otherHousehold(householdOf(actor)));
                setToast({ text: beta(r?.kind === 'edit' ? (r.datesChanged ? `Changed. ${other} needs to agree again.` : 'Saved.') : `Sent. ${other} will get an email.`) });
              }} />}
            <CalendarView swaps={swaps} events={events} jumpTo={jumpTo}
              pick={pick} onPickDay={tapDay}
              onAskFrom={pick ? null : beginAsk} onEditSwap={pick ? null : beginEdit} />
          </div>
          {!pick && (
            <button onClick={() => beginAsk()}
              style={{ width: '100%', minHeight: 52, marginTop: 16, fontSize: 17, fontWeight: 800, borderRadius: 12, border: 0, background: '#2e7d32', color: '#fff', cursor: 'pointer' }}>
              Ask for a swap
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

      {view === 'swaps' && <SwapsView swaps={swaps} actor={actor} today={today} on={on} focusId={focusId} onEventSaved={saved} />}

      {view === 'history' && <HistoryView audit={audit} />}

      {howOpen && <HowItWorks onClose={closeHow} />}
      <Toast toast={toast} onClose={closeToast} />
      <TabBar view={view} onChange={goTab} badge={{ schedule: needsOk }} />
    </div>
  );
}
