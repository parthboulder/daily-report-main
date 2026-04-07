// ===== Edge Function: trigger-daily-report =====
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-action',
}

serve(async (req) => {
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const triggerSecretKey = Deno.env.get('TRIGGER_SECRET_KEY') || ''

    // Verify caller — same pattern as admin-create-user
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

    // Get action from body or query param
    let body: any = {}
    try { body = await req.json() } catch { /* no body */ }
    const action = body.action || new URL(req.url).searchParams.get('action')

    // --- ACTION: trigger (manual run) ---
    if (action === 'trigger') {
      const triggerRes = await fetch('https://api.trigger.dev/api/v1/tasks/manual-daily-report/trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${triggerSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: {
            triggeredBy: caller.email || caller.id,
            emailTo: body.to || '',
            emailCc: body.cc || '',
            emailToJson: body.toJson || '[]',
            emailCcJson: body.ccJson || '[]',
            testMode: false,
          },
        }),
      })

      const triggerText = await triggerRes.text()
      let triggerData: any
      try { triggerData = JSON.parse(triggerText) } catch { triggerData = { raw: triggerText } }

      if (!triggerRes.ok) {
        return new Response(JSON.stringify({
          error: 'Trigger failed',
          status: triggerRes.status,
          details: triggerData,
        }), {
          status: triggerRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, run: triggerData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- ACTION: get-run-status ---
    if (action === 'get-run-status') {
      const { runId } = body
      if (!runId) {
        return new Response(JSON.stringify({ error: 'runId is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const runRes = await fetch(`https://api.trigger.dev/api/v3/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${triggerSecretKey}`,
          'Content-Type': 'application/json',
        },
      })

      const runText = await runRes.text()
      let runData: any
      try { runData = JSON.parse(runText) } catch { runData = { raw: runText } }

      if (!runRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch run status', details: runData }), {
          status: runRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        run: {
          id: runData.id,
          status: runData.status,
          taskIdentifier: runData.taskIdentifier,
          createdAt: runData.createdAt,
          startedAt: runData.startedAt,
          finishedAt: runData.finishedAt,
          durationMs: runData.durationMs,
          output: runData.output,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- ACTION: get-schedule ---
    if (action === 'get-schedule') {
      const schedulesRes = await fetch('https://api.trigger.dev/api/v1/schedules', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${triggerSecretKey}`,
          'Content-Type': 'application/json',
        },
      })

      const schedulesText = await schedulesRes.text()
      let schedulesData: any
      try { schedulesData = JSON.parse(schedulesText) } catch { schedulesData = { raw: schedulesText } }

      if (!schedulesRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch schedules', details: schedulesData }), {
          status: schedulesRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const allSchedules = schedulesData.data || schedulesData || []
      const dailySchedule = Array.isArray(allSchedules)
        ? allSchedules.find((s: any) => s.taskIdentifier === 'scheduled-daily-report')
        : null

      return new Response(JSON.stringify({ success: true, schedule: dailySchedule || null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- ACTION: update-schedule ---
    if (action === 'update-schedule') {
      const { cron, timezone } = body

      if (!cron) {
        return new Response(JSON.stringify({ error: 'cron is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const listRes = await fetch('https://api.trigger.dev/api/v1/schedules', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${triggerSecretKey}`,
          'Content-Type': 'application/json',
        },
      })
      const listData = await listRes.json()
      const allSchedules = listData.data || listData || []
      const existing = Array.isArray(allSchedules)
        ? allSchedules.find((s: any) => s.taskIdentifier === 'scheduled-daily-report')
        : null

      let result
      if (existing) {
        result = await fetch(`https://api.trigger.dev/api/v1/schedules/${existing.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${triggerSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task: 'scheduled-daily-report',
            cron,
            timezone: timezone || 'America/New_York',
          }),
        })
      } else {
        result = await fetch('https://api.trigger.dev/api/v1/schedules', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${triggerSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task: 'scheduled-daily-report',
            cron,
            timezone: timezone || 'America/New_York',
            deduplicationKey: 'daily-report-schedule',
            externalId: 'daily-report-schedule',
          }),
        })
      }

      const resultText = await result.text()
      let resultData: any
      try { resultData = JSON.parse(resultText) } catch { resultData = { raw: resultText } }

      if (!result.ok) {
        return new Response(JSON.stringify({ error: 'Failed to update schedule', details: resultData }), {
          status: result.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, schedule: resultData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: trigger, get-schedule, update-schedule' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
