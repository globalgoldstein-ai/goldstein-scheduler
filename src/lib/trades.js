// Goldstein Scheduler | Phase 11 | Session 6 | Build 1 | 2026-10-25 17:14 ET | trades: group swaps that share a trade_id; find a swap's other side

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

// The other side of a trade, or null. "Original" is the side created first.
export function tradePartner(swap, swaps = []) {
  if (!swap.trade_id) return null;
  const partner = swaps.find((s) => s.trade_id === swap.trade_id && s.id !== swap.id) ?? null;
  if (!partner) return null;
  const mine = swap.created_at ?? swap.date_start;
  const theirs = partner.created_at ?? partner.date_start;
  return { partner, isOriginal: mine <= theirs };
}
