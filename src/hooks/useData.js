// Goldstein Scheduler | Phase 4 | Session 1 | Build 1 | 2026-07-03 12:58 ET | live data hook: swaps + events + audit
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';

export function useData() {
  const [swaps, setSwaps] = useState([]);
  const [events, setEvents] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [s, e, a] = await Promise.all([
      supabase.from('swaps').select('*').order('date_start', { ascending: true }),
      supabase.from('events').select('*').order('date_start', { ascending: true }),
      supabase.from('audit_log').select('*').order('ts', { ascending: false }).limit(200),
    ]);
    const firstErr = s.error || e.error || a.error;
    if (firstErr) setError(firstErr.message);
    else {
      setSwaps(s.data ?? []);
      setEvents(e.data ?? []);
      setAudit(a.data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { swaps, events, audit, loading, error, refetch };
}
