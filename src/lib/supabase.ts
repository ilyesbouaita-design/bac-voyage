import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Support both Vite (VITE_*) and Next.js/Vercel integration (NEXT_PUBLIC_*) env var names
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ""
) as string;

const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  ""
) as string;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase env vars. Expected VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY " +
    "or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Typed Supabase client for the browser.
 * Uses the publishable (anon) key — safe to ship to the client; all access is
 * governed by Row-Level Security on the database side.
 */
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type { Database };
