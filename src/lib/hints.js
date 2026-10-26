// Goldstein Scheduler | Phase 11 | Session 7 | Build 1 | 2026-10-26 08:53 ET | one-time hints: remembered in localStorage (keys never change), never throws
export const HOWTO_KEY = 'gs.seenHowTo';
export const A2HS_KEY = 'gs.seenA2HS';

export function hasSeen(key) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}
export function markSeen(key) {
  try { localStorage.setItem(key, '1'); } catch { /* storage blocked: the hint may show again */ }
}

// iPhone or iPad, not already opened from the home screen (works for Safari and Chrome on iOS).
export function canSuggestHomeScreen() {
  try {
    const ua = navigator.userAgent || '';
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    return ios && !standalone;
  } catch { return false; }
}
