import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseEnv {
  url: string
  publishableKey: string
}

export function readSupabaseEnv(): SupabaseEnv | null {
  const url: unknown = import.meta.env.VITE_SUPABASE_URL
  const publishableKey: unknown = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (typeof url !== 'string' || url === '') return null
  if (typeof publishableKey !== 'string' || publishableKey === '') return null
  return { url, publishableKey }
}

export function createSupabaseBrowserClient(env: SupabaseEnv): SupabaseClient {
  return createClient(env.url, env.publishableKey)
}
