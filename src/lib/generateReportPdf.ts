// ===== Client-side PDF generator using HTML + window.print() =====
// Matches the Boulder "Daily Progress Report" PDF format

import { type DSRDraft } from './fieldOps'

export interface PdfReportData {
  projectName: string
  projectCode: string
  date: string
  superintendent?: string
  weather?: string
  manpower: { trade: string; headcount: number; is_sufficient: boolean; notes?: string }[]
  work_completed: string
  work_in_progress: string
  work_planned_tomorrow: string
  deliveries: string[]
  issues: { category: string; description: string; schedule_impact: boolean; schedule_impact_days: number }[]
  inspections: { type: string; result: string; notes: string }[]
  notes: string
  photos: { dataUrl?: string; url?: string; caption?: string }[]
}

/** Build PdfReportData from the wizard draft */
export function draftToReportData(
  draft: DSRDraft,
  projectName: string,
  superintendent?: string,
): PdfReportData {
  const deliveryLines: string[] = []
  if (draft.has_deliveries) {
    for (const d of draft.deliveries) {
      let line = d.vendor || 'Delivery'
      if (d.description) line += ` — ${d.description}`
      if (d.has_damages) line += ` (Damages: ${d.damage_notes || 'reported'})`
      deliveryLines.push(line)
    }
  }

  const notesParts: string[] = []
  if (draft.has_equipment_changes && draft.equipment_notes) notesParts.push(draft.equipment_notes)
  if (draft.weather_impact && draft.weather_impact_notes) notesParts.push(`Weather impact: ${draft.weather_impact_notes}`)

  let weather = draft.weather_conditions || ''
  if (draft.weather_temp !== '') weather += `, ${draft.weather_temp}°F`
  if (draft.rain_inches !== '') weather += `, Rain: ${draft.rain_inches}"`
  if (draft.wind_speed_mph !== '') weather += `, Wind: ${draft.wind_speed_mph} mph`

  return {
    projectName,
    projectCode: draft.project_code,
    date: draft.date,
    superintendent,
    weather,
    manpower: draft.manpower.map(m => ({
      trade: m.trade,
      headcount: m.headcount,
      is_sufficient: m.is_sufficient,
      notes: m.notes,
    })),
    work_completed: draft.work_completed,
    work_in_progress: draft.work_in_progress,
    work_planned_tomorrow: draft.work_planned_tomorrow,
    deliveries: deliveryLines,
    issues: draft.has_issues ? draft.issues.map(i => ({
      category: i.category,
      description: i.description,
      schedule_impact: i.schedule_impact,
      schedule_impact_days: i.schedule_impact_days,
    })) : [],
    inspections: draft.has_inspections ? draft.inspections.map(i => ({
      type: i.type,
      result: i.result,
      notes: i.notes,
    })) : [],
    notes: notesParts.join('\n'),
    photos: draft.photos.map(p => ({ dataUrl: p.dataUrl, caption: p.caption })),
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>')
}

/** Opens a new window with the formatted report HTML and triggers print dialog */
export function generateReportPdf(data: PdfReportData) {
  const formattedDate = formatDate(data.date)
  const totalHeadcount = data.manpower.reduce((s, m) => s + m.headcount, 0)

  // Build weather section
  let weatherHtml = ''
  if (data.weather) {
    weatherHtml = `
      <div class="section">
        <h2>Weather</h2>
        <p style="margin:0;font-size:14px;line-height:1.6">${escapeHtml(data.weather)}</p>
      </div>`
  }

  // Build manpower section
  let manpowerHtml = ''
  if (data.manpower.length > 0) {
    const rows = data.manpower.map(m => {
      let label = `${escapeHtml(m.trade)}: ${m.headcount} worker${m.headcount !== 1 ? 's' : ''}`
      if (!m.is_sufficient) label += ' <span style="color:#bb1b21;font-weight:600">(SHORT)</span>'
      if (m.notes) label += ` — ${escapeHtml(m.notes)}`
      return `<p style="margin:0 0 4px;font-size:14px;line-height:1.6">${label}</p>`
    }).join('')
    manpowerHtml = `
      <div class="section">
        <h2>Manpower</h2>
        ${rows}
        <p style="margin:8px 0 0;font-size:13px;color:#5a615c">Total on site: <strong>${totalHeadcount}</strong></p>
      </div>`
  }

  // Build work summary
  let workHtml = ''
  const workParts: string[] = []
  if (data.work_completed) {
    workParts.push(`
      <h3 style="color:#E8783A;font-size:14px;font-weight:600;margin:0 0 6px">Work Completed Today</h3>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7">${escapeHtml(data.work_completed)}</p>`)
  }
  if (data.work_in_progress) {
    workParts.push(`
      <h3 style="color:#E8783A;font-size:14px;font-weight:600;margin:0 0 6px">Work in Progress</h3>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7">${escapeHtml(data.work_in_progress)}</p>`)
  }
  if (data.work_planned_tomorrow) {
    workParts.push(`
      <h3 style="color:#E8783A;font-size:14px;font-weight:600;margin:0 0 6px">Work Planned Tomorrow</h3>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7">${escapeHtml(data.work_planned_tomorrow)}</p>`)
  }
  if (workParts.length > 0) {
    workHtml = `<div class="section">${workParts.join('')}</div>`
  }

  // Deliveries
  let deliveriesHtml = ''
  if (data.deliveries.length > 0) {
    deliveriesHtml = `
      <div class="section">
        <h2>Deliveries</h2>
        ${data.deliveries.map(d => `<p style="margin:0 0 4px;font-size:14px;line-height:1.6">${escapeHtml(d)}</p>`).join('')}
      </div>`
  }

  // Issues
  let issuesHtml = ''
  if (data.issues.length > 0) {
    const issueItems = data.issues.map(i => {
      let line = `<strong>${escapeHtml(i.category)}</strong>`
      if (i.description) line += `: ${escapeHtml(i.description)}`
      if (i.schedule_impact) line += ` <span style="color:#bb1b21">(${i.schedule_impact_days} day${i.schedule_impact_days !== 1 ? 's' : ''} delay)</span>`
      return `<p style="margin:0 0 4px;font-size:14px;line-height:1.6">${line}</p>`
    }).join('')
    issuesHtml = `
      <div class="section">
        <h2>Issues & Delays</h2>
        ${issueItems}
      </div>`
  }

  // Inspections
  let inspectionsHtml = ''
  if (data.inspections.length > 0) {
    const inspItems = data.inspections.map(i => {
      const color = i.result === 'PASS' ? '#16a34a' : i.result === 'FAIL' ? '#bb1b21' : '#d97706'
      let line = `${escapeHtml(i.type || 'Inspection')} — <span style="color:${color};font-weight:700">${i.result}</span>`
      if (i.notes) line += ` — ${escapeHtml(i.notes)}`
      return `<p style="margin:0 0 4px;font-size:14px;line-height:1.6">${line}</p>`
    }).join('')
    inspectionsHtml = `
      <div class="section">
        <h2>Inspections</h2>
        ${inspItems}
      </div>`
  }

  // Notes
  let notesHtml = ''
  if (data.notes) {
    notesHtml = `
      <div class="section">
        <h2>Notes</h2>
        <p style="margin:0;font-size:14px;line-height:1.7">${escapeHtml(data.notes)}</p>
      </div>`
  }

  // Photos
  let photosHtml = ''
  const photoSources = data.photos.filter(p => p.dataUrl || p.url)
  if (photoSources.length > 0) {
    const photoGrid = photoSources.map(p => {
      const src = p.dataUrl || p.url || ''
      return `
        <div style="break-inside:avoid">
          <img src="${src}" style="width:100%;border-radius:6px;object-fit:cover;aspect-ratio:4/3" />
          ${p.caption ? `<p style="font-size:11px;color:#5a615c;margin:4px 0 0">${escapeHtml(p.caption)}</p>` : ''}
        </div>`
    }).join('')
    photosHtml = `
      <div class="section" style="page-break-before:auto">
        <h2>Site Photos</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          ${photoGrid}
        </div>
      </div>`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Daily Progress Report — ${escapeHtml(data.projectName)} — ${formattedDate}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: A4;
      margin: 20mm 20mm 25mm 20mm;
    }

    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #2e3430;
      font-size: 14px;
      line-height: 1.5;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header {
      margin-bottom: 24px;
    }

    .header .brand {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #E8783A;
      margin-bottom: 8px;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 800;
      color: #2e3430;
      margin: 0 0 4px;
      letter-spacing: -0.5px;
    }

    .header .subtitle {
      font-size: 15px;
      font-weight: 600;
      color: #E8783A;
    }

    .header .divider {
      width: 48px;
      height: 3px;
      background: #E8783A;
      border-radius: 2px;
      margin-top: 12px;
    }

    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    .section h2 {
      font-size: 15px;
      font-weight: 700;
      color: #E8783A;
      margin: 0 0 10px;
    }

    .section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #E8783A;
      margin: 0 0 6px;
    }

    .ai-summary {
      background: #fef7f2;
      border-left: 4px solid #E8783A;
      padding: 20px 24px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    .ai-summary .label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #5a615c;
      margin-bottom: 8px;
    }

    .ai-summary p {
      font-size: 13px;
      line-height: 1.7;
      color: #2e3430;
      margin: 0;
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 20mm;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #adb3ae;
    }

    @media screen {
      body {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 32px;
      }
      .no-print { display: block !important; }
    }

    @media print {
      .no-print { display: none !important; }
    }

    .no-print {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 100;
      display: flex;
      gap: 8px;
    }

    .no-print button {
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-print {
      background: #E8783A;
      color: #fff;
      box-shadow: 0 2px 8px rgba(232,120,58,0.3);
    }

    .btn-close {
      background: #ecefea;
      color: #2e3430;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">Download PDF</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>

  <div class="header">
    <div class="brand">B O U L D E R</div>
    <h1>Daily Progress Report</h1>
    <div class="subtitle">${escapeHtml(data.projectName)} | ${formattedDate}</div>
    <div class="divider"></div>
  </div>

  ${weatherHtml}
  ${manpowerHtml}
  ${workHtml}
  ${deliveriesHtml}
  ${issuesHtml}
  ${inspectionsHtml}
  ${notesHtml}
  ${photosHtml}

  <div class="footer">
    <span>Boulder Construction</span>
    <span>${escapeHtml(data.projectName)} · ${formattedDate}</span>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
