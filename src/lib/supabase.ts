import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env",
  );
}

/**
 * Typed Supabase client for the browser.
 * Uses the publishable (anon) key — safe to ship to the client; all access is
 * governed by Row-Level Security on the database side.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type { Database };
