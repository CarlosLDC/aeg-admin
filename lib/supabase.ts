import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Explicitly enable the browser session machinery. This avoids edge-cases where
    // token refresh stops working after tab inactivity/throttling.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
