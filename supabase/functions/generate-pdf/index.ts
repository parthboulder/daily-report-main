// ===== Edge Function: generate-pdf =====
// Generates a formatted PDF of a Daily Site Report.
// Uses real schema: projects, submitted_by, work_completed_today, report_sent_at,
// manpower (text), deliveries (text), issues_delays (text), etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportId } = await req.json()
    if (!reportId) throw new Error('reportId is required')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch report
    const { data: report, error: reportErr } = await supabaseAdmin
      .from('daily_site_report')
      .select('*')
      .eq('id', reportId)
      .single()
    if (reportErr || !report) throw new Error('Report not found')

    const projectCode = report.projects?.[0] || 'Unknown'
    const date = report.date || 'Unknown'

    // Look up superintendent name from submitted_by
    let superintendentName = ''
    if (report.submitted_by?.[0]) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('full_name')
        .eq('id', report.submitted_by[0])
        .single()
      if (profile?.full_name) superintendentName = profile.full_name
    }

    // Fetch manpower rows from separate table
    const { data: manpowerRows } = await supabaseAdmin
      .from('manpower')
      .select('*')
      .contains('projects', [projectCode])
      .eq('date', date)

    const manpower = manpowerRows || []

    // ── Build PDF ──
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = 20

    function checkPageBreak(needed: number) {
      if (y + needed > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage()
        y = 20
      }
    }

    function addSectionHeader(title: string) {
      checkPageBreak(20)
      y += 6
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 101, 52)
      doc.text(title, margin, y)
      y += 2
      doc.setDrawColor(187, 247, 208)
      doc.line(margin, y, margin + contentWidth, y)
      y += 8
    }

    function addTextBlock(label: string, value: string) {
      checkPageBreak(20)
      if (label) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(107, 114, 128)
        doc.text(label, margin, y)
        y += 5
      }
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      const lines = doc.splitTextToSize(value || '—', contentWidth)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 4
    }

    // ── Title ──
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 101, 52)
    doc.text('Daily Site Report', margin, y)
    y += 10

    doc.setFontSize(14)
    doc.setTextColor(55, 65, 81)
    doc.text(projectCode, margin, y)

    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(formattedDate, margin, y + 6)
    y += 16

    doc.setFontSize(9)
    doc.setTextColor(156, 163, 175)
    doc.text(`Report #${reportId}${superintendentName ? ` · Superintendent: ${superintendentName}` : ''}`, margin, y)
    y += 10

    // ── Weather ──
    if (report.weather) {
      addSectionHeader('Weather')
      addTextBlock('', report.weather)
    }

    // ── Manpower (from separate table rows) ──
    if (manpower.length > 0) {
      addSectionHeader('Manpower')
      const totalHC = manpower.reduce((s: number, m: any) => s + (m.people || 0), 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      doc.text(`Total on site: ${totalHC} workers across ${manpower.length} trades`, margin, y)
      y += 8

      for (const m of manpower) {
        checkPageBreak(8)
        doc.setFontSize(9)
        const sufficient = m.sufficient_amt_of_manpower !== 'No'
        const line = `${m.name || '—'}: ${m.people || 0} ${sufficient ? '' : '(SHORT)'} ${m.notes || ''}`
        doc.text(line.trim(), margin, y)
        y += 5
      }
      y += 4
    } else if (report.manpower) {
      // Fallback to text field (Airtable-migrated data)
      addSectionHeader('Manpower')
      addTextBlock('', report.manpower)
    }

    // ── Work Summary ──
    if (report.work_completed_today || report.work_in_progress || report.work_planned_tomorrow) {
      addSectionHeader('Work Summary')
      if (report.work_completed_today) addTextBlock('COMPLETED TODAY', report.work_completed_today)
      if (report.work_in_progress) addTextBlock('IN PROGRESS', report.work_in_progress)
      if (report.work_planned_tomorrow) addTextBlock('PLANNED TOMORROW', report.work_planned_tomorrow)
    }

    // ── Deliveries (text field) ──
    if (report.deliveries) {
      addSectionHeader('Deliveries')
      addTextBlock('', report.deliveries)
    }

    // ── Issues & Delays (text field) ──
    if (report.issues_delays) {
      addSectionHeader('Issues & Delays')
      addTextBlock('', report.issues_delays)
    }

    // ── Inspections (text field) ──
    if (report.inspection_today_upcoming_with_status) {
      addSectionHeader('Inspections')
      addTextBlock('', report.inspection_today_upcoming_with_status)
    }

    // ── Notes ──
    if (report.notes) {
      addSectionHeader('Notes')
      addTextBlock('', report.notes)
    }

    // ── Footer ──
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(
        `Boulder Daily Reports · ${projectCode} · ${date} · Page ${i}/${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    const pdfBytes = doc.output('arraybuffer')

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="DSR-${projectCode}-${date}.pdf"`,
      },
      status: 200,
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
