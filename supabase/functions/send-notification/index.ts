// ===== Edge Function: send-notification =====
// Sends email notification to admins/PMs when a DSR is submitted.
// Uses Resend API. Graceful no-op if RESEND_API_KEY is not set.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  reportId: number
  projectCode: string
  date: string
  superintendentId: string | null
  summary: {
    totalHeadcount: number
    deliveryCount: number
    issueCount: number
    inspectionCount: number
    failedInspections: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ success: true, emailsSent: 0, message: 'RESEND_API_KEY not configured — skipping email' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  try {
    const body: RequestBody = await req.json()
    const { reportId, projectCode, date, superintendentId, summary } = body

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Look up superintendent name
    let superintendentName = 'Unknown'
    if (superintendentId) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('full_name')
        .eq('id', superintendentId)
        .single()
      if (profile?.full_name) superintendentName = profile.full_name
    }

    // Look up notification recipients (admins)
    const { data: recipients } = await supabaseAdmin
      .from('user_profiles')
      .select('email, full_name')
      .eq('role', 'admin')
      .eq('is_active', true)

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: 'No recipients found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })

    const appUrl = Deno.env.get('APP_URL') || 'https://boulder-daily-reports.vercel.app'
    const reportUrl = `${appUrl}/daily-reports/${reportId}`

    const issueAlert = summary.failedInspections > 0
      ? `<tr><td style="padding:8px 0;color:#DC2626;font-weight:600;">⚠️ ${summary.failedInspections} Failed Inspection${summary.failedInspections !== 1 ? 's' : ''}</td></tr>`
      : ''

    const htmlBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin-bottom:20px;">
          <h2 style="margin:0 0 4px;font-size:18px;color:#166534;">Daily Site Report Submitted</h2>
          <p style="margin:0;font-size:14px;color:#15803D;">${projectCode} · ${formattedDate}</p>
        </div>
        <table style="width:100%;font-size:14px;color:#374151;">
          <tr><td style="padding:8px 0;color:#6B7280;">Superintendent</td><td style="padding:8px 0;font-weight:500;">${superintendentName}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Total Headcount</td><td style="padding:8px 0;font-weight:500;">${summary.totalHeadcount}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Deliveries</td><td style="padding:8px 0;font-weight:500;">${summary.deliveryCount}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Issues</td><td style="padding:8px 0;font-weight:500;">${summary.issueCount}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;">Inspections</td><td style="padding:8px 0;font-weight:500;">${summary.inspectionCount}</td></tr>
          ${issueAlert}
        </table>
        <div style="margin-top:20px;">
          <a href="${reportUrl}" style="display:inline-block;background:#166534;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">View Full Report</a>
        </div>
        <p style="margin-top:24px;font-size:11px;color:#9CA3AF;">Report #${reportId} · Boulder Daily Reports</p>
      </div>
    `

    let emailsSent = 0
    for (const recipient of recipients) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('EMAIL_FROM') || 'Boulder Reports <reports@boulder-daily-reports.com>',
            to: [recipient.email],
            subject: `DSR Submitted: ${projectCode} — ${formattedDate}`,
            html: htmlBody,
          }),
        })
        if (res.ok) emailsSent++
      } catch {
        // Skip failed individual emails
      }
    }

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
