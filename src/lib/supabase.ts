import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // JWT access token expires in 15 minutes (configured in Supabase Dashboard)
    // Refresh token is stored as HTTP-only cookie by Supabase
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Invoke a Supabase Edge Function with automatic auth token forwarding.
 */
export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body })
    if (error) return { data: null, error: error.message }
    return { data: data as T, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Edge function call failed' }
  }
}
