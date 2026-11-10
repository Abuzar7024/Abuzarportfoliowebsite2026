import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase browser client when public environment variables
 * are explicitly provided. All AI Hackathon registration persistence runs
 * server-side via `/api/avatar/*` so database credentials never touch the browser.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "";
  const supabasePublishableKey =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || "";

  if (!supabaseUrl || !supabasePublishableKey) return null;

  if (!browserClient) {
    browserClient =
      typeof window !== "undefined"
        ? createBrowserClient(supabaseUrl, supabasePublishableKey)
        : createClient(supabaseUrl, supabasePublishableKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
  }
  return browserClient;
}
