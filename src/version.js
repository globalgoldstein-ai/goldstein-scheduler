// Goldstein Scheduler | Phase 11 | Session 5 | Build 2 | 2026-10-25 16:40 ET | version label shown at the bottom of the page
// PHASE is edited by hand when a phase ships. Commit and build time are injected by vite.config.js.
export const PHASE = '11b';
const commit = typeof __APP_COMMIT__ === 'undefined' ? 'local' : __APP_COMMIT__;
const built = typeof __APP_BUILT__ === 'undefined' ? null : __APP_BUILT__;

export const versionLabel = () => {
  const when = built
    ? new Date(built).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'
    : null;
  return `Version ${PHASE} · build ${commit}${when ? ` · ${when}` : ''}`;
};
