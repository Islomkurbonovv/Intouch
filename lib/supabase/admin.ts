import { createClient as createAdminClient } from "@supabase/supabase-js"

// Service-role client for privileged operations (creating/deleting auth users).
// NEVER import this into client components.
export function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
