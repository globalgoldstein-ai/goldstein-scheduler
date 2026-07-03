// Goldstein Scheduler | Phase 4 | Session 1 | Build 1 | 2026-07-03 12:58 ET | supabase client
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
