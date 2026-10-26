// Goldstein Scheduler | Phase 11 | Session 6 | Build 3 | 2026-10-25 21:10 ET | version label shown at the bottom of the History tab
// PHASE is edited by hand when a phase ships. Commit and build time are injected by vite.config.js.
export const PHASE = '11c';
// Set to false at launch (also set ALERT_LIVE=true in Netlify). Shows the beta banner on every screen.
export const BETA = true;
const commit = typeof __APP_COMMIT__ === 'undefined' ? 'local' : __APP_COMMIT__;
const built = typeof __APP_BUILT__ === 'undefined' ? null : __APP_BUILT__;

export const versionLabel = () => {
  const when = built
    ? new Date(built).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'
    : null;
  return `Version ${PHASE} · build ${commit}${when ? ` · ${when}` : ''}`;
};
