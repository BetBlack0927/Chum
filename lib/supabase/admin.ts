import { createClient } from '@supabase/supabase-js'

// Admin client using the service role key — bypasses RLS entirely.
// ONLY use this in server actions/server components after verifying
// the user's identity with the regular client first.
// NEVER import this in any client component or expose it to the browser.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
