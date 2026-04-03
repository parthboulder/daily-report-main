// ===== Edge Function: admin-manage-projects =====
// CRUD operations for projects table. Uses service_role key to bypass RLS.
// Actions: list, create, update, delete, sync

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'No authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use service role client for admin check too (avoids RLS issues on user_profiles)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Verify caller identity via their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser()
    if (authError || !caller) return jsonResponse({ error: 'Unauthorized' }, 401)

    // Check admin role using service role client (bypasses any RLS on user_profiles)
    const { data: callerProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return jsonResponse({ error: 'Admin access required' }, 403)
    }

    // Parse body
    const body = await req.json()
    const { action } = body

    // ── LIST ──
    if (action === 'list') {
      const { data, error } = await adminClient
        .from('projects')
        .select('*')
        .order('name')
      if (error) return jsonResponse({ error: error.message }, 400)
      return jsonResponse({ data })
    }

    // ── CREATE ──
    if (action === 'create') {
      const { name, code, superintendent, address } = body
      if (!name || !code) return jsonResponse({ error: 'name and code are required' }, 400)
      const { error } = await adminClient
        .from('projects')
        .insert({ name, code, superintendent: superintendent || null, address: address || null })
      if (error) return jsonResponse({ error: error.message }, 400)
      return jsonResponse({ success: true })
    }

    // ── UPDATE ──
    if (action === 'update') {
      const { id, updates } = body
      if (!id) return jsonResponse({ error: 'id is required' }, 400)
      const { error } = await adminClient
        .from('projects')
        .update(updates)
        .eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 400)
      return jsonResponse({ success: true })
    }

    // ── DELETE ──
    if (action === 'delete') {
      const { id } = body
      if (!id) return jsonResponse({ error: 'id is required' }, 400)
      const { error } = await adminClient
        .from('projects')
        .delete()
        .eq('id', id)
      if (error) return jsonResponse({ error: error.message }, 400)
      return jsonResponse({ success: true })
    }

    // ── SYNC ──
    if (action === 'sync') {
      const { projects: canonicalProjects } = body
      if (!Array.isArray(canonicalProjects)) return jsonResponse({ error: 'projects array is required' }, 400)

      const validCodes = canonicalProjects.map((p: any) => p.code)

      // Fetch all existing
      const { data: existing } = await adminClient.from('projects').select('*')
      const all = existing || []

      // Delete projects not in canonical list
      for (const p of all) {
        if (!validCodes.includes(p.code)) {
          await adminClient.from('projects').delete().eq('id', p.id)
        }
      }

      // Upsert canonical projects
      for (const cp of canonicalProjects) {
        const match = all.find((p: any) => p.code === cp.code)
        if (match) {
          await adminClient.from('projects').update({ name: cp.name }).eq('id', match.id)
        } else {
          await adminClient.from('projects').insert({ name: cp.name, code: cp.code })
        }
      }

      // Return updated list
      const { data: updated } = await adminClient.from('projects').select('*').order('name')
      return jsonResponse({ data: updated })
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    console.error('admin-manage-projects error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
