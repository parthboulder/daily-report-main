// ===== Edge Function: auto-generate-todos =====
// Creates TODO items for manpower shortages and failed inspections.
// Real to_do schema: name, projects (text[]), status, urgent (bool), comments, deadline

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManpowerEntry {
  trade: string
  headcount: number
  is_sufficient: boolean
  notes: string
}

interface InspectionEntry {
  type: string
  result: 'PASS' | 'FAIL' | 'PARTIAL'
  notes: string
}

interface RequestBody {
  reportId: number
  projectCode: string
  date: string
  manpower: ManpowerEntry[]
  inspections: InspectionEntry[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    const { reportId, projectCode, date, manpower, inspections } = body

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let todosCreated = 0

    // Create TODOs for manpower shortages
    const shortages = manpower.filter((m) => !m.is_sufficient)
    if (shortages.length > 0) {
      const { error } = await supabaseAdmin.from('to_do').insert(
        shortages.map((m) => ({
          name: `Manpower shortage — ${m.trade} on ${projectCode} (${date}): ${m.notes || 'Check staffing levels'}`,
          projects: [projectCode],
          status: 'Open',
          urgent: true,
          comments: `Auto-generated from DSR #${reportId}. Trade: ${m.trade}, Headcount: ${m.headcount}`,
        }))
      )
      if (!error) todosCreated += shortages.length
    }

    // Create TODOs for failed inspections
    const failures = inspections.filter((i) => i.result === 'FAIL')
    if (failures.length > 0) {
      const { error } = await supabaseAdmin.from('to_do').insert(
        failures.map((insp) => ({
          name: `Inspection FAILED — ${insp.type} on ${projectCode}: ${insp.notes || 'Corrective action required'}`,
          projects: [projectCode],
          status: 'Open',
          urgent: true,
          comments: `Auto-generated from DSR #${reportId}.`,
        }))
      )
      if (!error) todosCreated += failures.length
    }

    return new Response(
      JSON.stringify({ success: true, todosCreated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
