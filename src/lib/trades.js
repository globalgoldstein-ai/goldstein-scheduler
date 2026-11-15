// Goldstein Scheduler | Phase 11 | Session 8 | Build 1 | 2026-11-15 17:15 ET | trades: find a swap's other side

// The other side of a trade, or null. "Original" is the side created first.
export function tradePartner(swap, swaps = []) {
  if (!swap.trade_id) return null;
  const partner = swaps.find((s) => s.trade_id === swap.trade_id && s.id !== swap.id) ?? null;
  if (!partner) return null;
  const mine = swap.created_at ?? swap.date_start;
  const theirs = partner.created_at ?? partner.date_start;
  return { partner, isOriginal: mine <= theirs };
}
