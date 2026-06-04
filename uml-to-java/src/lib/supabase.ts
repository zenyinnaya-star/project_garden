import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
 * Get them from https://supabase.com → your project → Settings → API
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// createClient requires non-empty strings — use harmless placeholders when not configured
export const supabase = createClient(
  SUPABASE_URL      ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
);
