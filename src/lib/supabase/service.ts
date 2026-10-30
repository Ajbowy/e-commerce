import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { assertProductionEnv } from "@/lib/runtime-config";

/**
 * Service-role client — bypasses RLS. Import this ONLY inside
 * `src/app/api/**\/route.ts` handlers, never in Client Components or
 * anything that ends up in a browser bundle.
 */
export function createServiceClient() {
  if (process.env.NODE_ENV === "production") {
    assertProductionEnv();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration for server-side operations.");
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
