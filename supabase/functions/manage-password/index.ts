// ===== Edge Function: manage-password =====
// Handles password hashing, verification, and login against user_passwords table.
// Actions: hash (store), verify (login), reset (admin)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const body = await req.json()
    const { action } = body

    // Service-role client for reading/writing user_passwords (RLS blocks anon/authenticated)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // ===== ACTION: verify =====
    // Called during login. Checks email+password against user_passwords table.
    // On success, generates a session via signInWithPassword (Supabase Auth still needs the
    // password in auth.users to match — so we keep both in sync).
    if (action === 'verify') {
      const { email, password } = body
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'email and password are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Look up user by email in user_profiles
      const { data: profile } = await adminClient
        .from('user_profiles')
        .select('id, is_active')
        .eq('email', email)
        .single()

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Invalid login credentials' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!profile.is_active) {
        return new Response(JSON.stringify({ error: 'Your account has been deactivated. Contact your administrator.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get password hash from user_passwords
      const { data: pwRow } = await adminClient
        .from('user_passwords')
        .select('password_hash')
        .eq('user_id', profile.id)
        .single()

      if (!pwRow) {
        // No entry in user_passwords — fall back to Supabase Auth
        return new Response(JSON.stringify({ fallback: true }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify bcrypt hash
      const valid = bcrypt.compareSync(password, pwRow.password_hash)
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid login credentials' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Password verified! Now we need to also sync with Supabase Auth so
      // signInWithPassword works (for JWT session generation).
      // Update auth.users password to match, then let the client call signInWithPassword.
      await adminClient.auth.admin.updateUserById(profile.id, { password })

      return new Response(JSON.stringify({ verified: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ===== ACTION: set =====
    // Stores a hashed password in user_passwords. Used by admin-reset and admin-create.
    if (action === 'set') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify caller is admin
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user: caller }, error: authError } = await userClient.auth.getUser()
      if (authError || !caller) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: callerProfile } = await userClient
        .from('user_profiles')
        .select('role')
        .eq('id', caller.id)
        .single()

      if (!callerProfile || callerProfile.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { targetUserId, newPassword } = body
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

      // Hash the password
      const salt = bcrypt.genSaltSync(10)
      const hash = bcrypt.hashSync(newPassword, salt)

      // Upsert into user_passwords
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

      // Also update Supabase Auth to keep in sync (best effort — if this fails, user_passwords is still the source of truth)
      try {
        await adminClient.auth.admin.updateUserById(targetUserId, { password: newPassword })
      } catch (_) {
        // Ignore — user_passwords is authoritative
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ===== ACTION: update-own =====
    // User changes their own password (must be authenticated)
    if (action === 'update-own') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user }, error: authError } = await userClient.auth.getUser()
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { newPassword } = body
      if (!newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const salt = bcrypt.genSaltSync(10)
      const hash = bcrypt.hashSync(newPassword, salt)

      const { error: upsertError } = await adminClient
        .from('user_passwords')
        .upsert({
          user_id: user.id,
          password_hash: hash,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) {
        return new Response(JSON.stringify({ error: 'Failed to update password: ' + upsertError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Sync with Supabase Auth (best effort)
      try {
        await adminClient.auth.admin.updateUserById(user.id, { password: newPassword })
      } catch (_) {
        // Ignore
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: verify, set, update-own' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
