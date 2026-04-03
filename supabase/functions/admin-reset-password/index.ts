// ===== Edge Function: admin-reset-password =====
// Allows admin users (role = 'admin') to reset any user's password.
// Stores bcrypt hash in user_passwords table (no dependency on auth.admin API).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Decode JWT payload without verification (the service role getUser call verifies it)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload
  } catch {
    return null
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const token = authHeader.replace('Bearer ', '')

    // Decode JWT to get caller's user ID
    const payload = decodeJwtPayload(token)
    const callerId = payload?.sub as string | undefined
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Invalid token: no sub claim' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role client for all DB operations (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller is admin in user_profiles
    const { data: callerProfile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', callerId)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { targetUserId, newPassword } = await req.json()

    if (!targetUserId || !newPassword) {
      return new Response(JSON.stringify({ error: 'targetUserId and newPassword are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Hash the password with bcrypt (use sync variants — Deno Deploy does not support Workers)
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(newPassword, salt)

    const { error: upsertError } = await adminClient
      .from('user_passwords')
      .upsert({
        user_id: targetUserId,
        password_hash: hash,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      return new Response(JSON.stringify({ error: 'Failed to save password: ' + upsertError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Also update Supabase Auth to keep in sync (best effort)
    try {
      await adminClient.auth.admin.updateUserById(targetUserId, { password: newPassword })
    } catch (_) {
      // Ignore — user_passwords table is the source of truth
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
