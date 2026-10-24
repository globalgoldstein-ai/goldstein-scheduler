// Goldstein Scheduler | Phase 10 | Session 3 | Build 1 | 2026-10-24 14:13 ET | trades: group swaps that share a trade_id

// Returns [{ key, rows }] in list order. A trade's rows appear once, at the position of its earliest swap.
export function groupSwaps(swaps = []) {
  const out = [];
  const byTrade = new Map();
  for (const s of swaps) {
    if (!s.trade_id) { out.push({ key: s.id, rows: [s] }); continue; }
    let g = byTrade.get(s.trade_id);
    if (!g) { g = { key: s.trade_id, rows: [] }; byTrade.set(s.trade_id, g); out.push(g); }
    g.rows.push(s);
  }
  return out;
}
