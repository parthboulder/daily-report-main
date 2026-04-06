// ===== Daily Site Report View — SiteIntelligence Design =====
import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchDSRById, fetchManpowerForDate, fetchDelaysForDate, type DSRRow, type ManpowerRow, type DelayRow } from '../lib/fieldOps'
import { generateReportPdf } from '../lib/generateReportPdf'
import { supabase } from '../lib/supabase'

// Material-style icon helper
function MIcon({ d, size = 20, fill = 'currentColor', style }: { d: string; size?: number; fill?: string; style?: React.CSSProperties }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} style={style}><path d={d} /></svg>
}

const ICONS = {
  arrowBack: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  checkCircle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  groups: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  assignment: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  localShipping: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  description: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  sunny: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
  air: 'M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zM18.5 11H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5H15c0 1.93 1.57 3.5 3.5 3.5S22 16.43 22 14.5 20.43 11 18.5 11z',
  happy: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-3.5 9.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z',
  pdf: 'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  camera: 'M12 15.2c1.77 0 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8 8.8 10.23 8.8 12s1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  notes: 'M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z',
}

const T = {
  bg: '#f9f9f6',
  surface: '#ffffff',
  surfaceDim: '#f3f4f0',
  surfaceHigh: '#e5e9e4',
  onSurface: '#2e3430',
  onSurfaceVar: '#5a615c',
  outline: '#adb3ae',
  primary: '#E8783A',
  primaryBg: '#FDDCCC',
  primaryDark: '#B84E1D',
  tertiary: '#bb1b21',
}

export default function DailySiteReportView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<DSRRow | null>(null)
  const [manpower, setManpower] = useState<ManpowerRow[]>([])
  const [delays, setDelays] = useState<DelayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [superintendentName, setSuperintendentName] = useState('')
  const generatingPdf = false

  useEffect(() => {
    if (!id) return
    fetchDSRById(parseInt(id)).then((r) => {
      setReport(r)
      if (r?.project_id) {
        fetchManpowerForDate(r.date || '', r.project_id, r.id).then((rows) => {
          setManpower(rows)
        })
        fetchDelaysForDate(r.date || '', r.project_id).then((rows) => {
          setDelays(rows)
        })
      }
      // Fetch superintendent name from user_profiles
      if (r?.submitted_by?.[0]) {
        supabase.from('user_profiles').select('full_name').eq('id', r.submitted_by[0]).single()
          .then(({ data }) => {
            if (data?.full_name) setSuperintendentName(data.full_name)
          })
      }
      setLoading(false)
    })
  }, [id])

  const manpowerData = useMemo(() => {
    const manpowerMap = manpower.reduce((acc, m) => {
      const trade = (m.name || '—').trim()
      if (!acc[trade]) {
        acc[trade] = { headcount: 0, sufficient: true, notes: [] }
      }
      acc[trade].headcount += m.people || 0
      acc[trade].sufficient = acc[trade].sufficient && (m.sufficient_amt_of_manpower !== 'No')
      if (m.notes) acc[trade].notes.push(m.notes)
      return acc
    }, {} as Record<string, { headcount: number; sufficient: boolean; notes: string[] }>)
    return Object.entries(manpowerMap).map(([trade, data]) => ({
      trade,
      headcount: data.headcount,
      is_sufficient: data.sufficient,
      notes: data.notes.join('; '),
    }))
  }, [manpower])

  const totalPersonnel = useMemo(() => manpowerData.reduce((sum, m) => sum + m.headcount, 0), [manpowerData])

  const handleDownloadPdf = () => {
    if (!report) return

    const totalManpower = manpowerData.reduce((sum, m) => sum + m.headcount, 0)

    // Parse deliveries text into lines
    const deliveryLines = report.deliveries
      ? report.deliveries.split('\n').filter(l => l.trim())
      : []

    // Parse issues and delays text into structured lines
    const parsedBlocks = report.issues_delays
      ? report.issues_delays
        .split(/\n\s*\n/) // separated blocks
        .map(block => block.trim())
        .filter(Boolean)
      : []

    const issueLines = parsedBlocks
      .filter(block => {
        const firstLine = block.split('\n')[0] || ''
        return !/^Delay\s*-\s*/i.test(firstLine)
      })
      .map((block) => {
        const firstLine = block.split('\n')[0] || ''
        if (/^\[.*\]/.test(firstLine)) {
          return { category: 'Issue', description: block, schedule_impact: false, schedule_impact_days: 0 }
        }
        return { category: 'Issue', description: block, schedule_impact: false, schedule_impact_days: 0 }
      })

    // Extract delays from issues_delays text
    const textDelays = parsedBlocks
      .filter(block => {
        const firstLine = block.split('\n')[0] || ''
        return /^Delay\s*-\s*/i.test(firstLine)
      })
      .map(block => {
        const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
        const firstLine = lines[0] || ''
        const activity = firstLine.replace(/^Delay\s*-\s*/i, '').trim()

        // Parse structured fields from the remaining lines
        let delay_days = 0
        let reason = ''
        let responsibility = ''
        let mitigation = ''

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          if (line.toLowerCase().startsWith('duration:')) {
            const durationMatch = line.match(/duration:\s*(\d+)/i)
            if (durationMatch) {
              delay_days = parseInt(durationMatch[1], 10) || 0
            }
          } else if (line.toLowerCase().startsWith('reason:')) {
            reason = line.replace(/^reason:\s*/i, '').trim()
          } else if (line.toLowerCase().startsWith('responsibility:')) {
            responsibility = line.replace(/^responsibility:\s*/i, '').trim()
          } else if (line.toLowerCase().startsWith('mitigation:')) {
            mitigation = line.replace(/^mitigation:\s*/i, '').trim()
          }
        }

        return {
          activity,
          delay_days,
          reason: reason || 'Not specified',
          responsibility,
          mitigation
        }
      })

    // Parse delays
    const dbDelays = delays.map(d => ({
      activity: d.delay || '',
      delay_days: d.days_impacted || 0,
      reason: d.cause_category || '',
      responsibility: (d.trade || []).join(', ') || '',
      mitigation: '', // Not stored in DB
    }))

    // Combine delays from database and text
    const delayLines = [...dbDelays, ...textDelays]

    // Parse inspections text
    const inspectionLines = report.inspection_today_upcoming_with_status
      ? report.inspection_today_upcoming_with_status.split('\n').filter(l => l.trim()).map(l => ({
        type: l, result: '', notes: '',
      }))
      : []

    // Build photo list
    const photoList = Array.isArray(report.photos)
      ? report.photos.map((p: any) => ({ url: p.url, caption: p.caption || p.filename }))
      : []

    generateReportPdf({
      projectName: 'Project #' + report.project_id,
      projectCode: 'Project #' + report.project_id,
      date: report.date || '',
      weather: report.weather || undefined,
      manpower: manpowerData,
      totalManpower,
      work_completed: report.work_completed_today || '',
      work_in_progress: report.work_in_progress || '',
      work_planned_tomorrow: report.work_planned_tomorrow || '',
      deliveries: deliveryLines,
      issues: issueLines,
      delays: delayLines,
      inspections: inspectionLines,
      notes: report.notes || '',
      photos: photoList,
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.bg }}>
        <div style={{ width: 20, height: 20, border: `2px solid ${T.outline}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, background: T.bg, fontFamily: 'Inter, sans-serif' }}>
        <p style={{ fontSize: 15, color: T.onSurfaceVar }}>Report not found</p>
        <button onClick={() => navigate('/daily-reports')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: T.surfaceDim, color: T.onSurface, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Back to Reports
        </button>
      </div>
    )
  }

  const projectId = report.project_id || 0
  const formattedDate = report.date
    ? new Date(report.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '—'
  const submittedAt = report.report_sent_at
    ? new Date(report.report_sent_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  const photos: { url: string; filename?: string; caption?: string }[] =
    Array.isArray(report.photos) ? report.photos : []

  const statusColor = (report.report_status === 'Submitted' || report.report_status === 'Sent')
    ? { bg: T.primaryBg, text: T.primaryDark }
    : { bg: '#FEF3C7', text: '#D97706' }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top App Bar ── */}
      <header className="px-4 md:px-8" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(249,249,246,0.8)', backdropFilter: 'blur(16px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, paddingBottom: 12,
        borderBottom: `1px solid ${T.surfaceHigh}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/boulder-logo.png" alt="Boulder" className="h-7 md:h-12" />
          <nav className="hidden md:flex" style={{ gap: 24 }}>
            <Link to="/daily-reports" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, color: T.onSurfaceVar, textDecoration: 'none' }}>Dashboard</Link>
            {['Compliance', 'Teams'].map((item) => (
              <a key={item} href="#" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, color: T.onSurfaceVar, textDecoration: 'none' }}>{item}</a>
            ))}
            <Link to="/reports" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8783A', textDecoration: 'none', borderBottom: '2px solid #E8783A', paddingBottom: 4 }}>Reports</Link>
            <Link to="/daily-reports" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, color: T.onSurfaceVar, textDecoration: 'none' }}>Daily Logs</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>S</span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="px-4 md:px-6 lg:px-8 pt-8 pb-24 md:pb-32" style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.onSurfaceVar, marginBottom: 24 }}>
          <button onClick={() => navigate('/daily-reports')} style={{ background: 'none', border: 'none', color: T.onSurfaceVar, cursor: 'pointer', fontSize: 13 }}>Active Reports</button>
          <span style={{ fontSize: 11 }}>›</span>
          <span style={{ color: T.primary, fontWeight: 500 }}>Report #{report.id}</span>
        </div>

        {/* ── Header Card ── */}
        <section className="p-5 md:p-8" style={{
          background: T.surface, borderRadius: 12, marginBottom: 24,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(173,179,174,0.1)',
        }}>
          <div style={{ position: 'absolute', top: -48, right: -48, width: 128, height: 128, borderRadius: '50%', background: 'rgba(232,120,58,0.05)' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ background: T.primary, color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 13, fontWeight: 700, letterSpacing: '0.12em' }}>#{projectId}</span>
                <h1 className="text-xl md:text-[28px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: T.onSurface, margin: 0, letterSpacing: '-0.5px' }}>Daily Site Report</h1>
              </div>
              <p style={{ fontSize: 14, color: T.onSurfaceVar, margin: '4px 0 0', fontWeight: 500 }}>{formattedDate}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: statusColor.bg, color: statusColor.text,
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              }}>
                <MIcon d={ICONS.checkCircle} size={16} fill={statusColor.text} style={{ fontVariationSettings: "'FILL' 1" }} />
                {report.report_status || 'Unknown'}
              </div>
              {submittedAt && (
                <span style={{ fontSize: 13, color: T.onSurfaceVar, fontWeight: 500 }}>{submittedAt}</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Grid: Left (2/3) + Right (1/3) ── */}
        <style>{`.dsrv-grid { display: grid; gap: 24px; grid-template-columns: 1fr; margin-bottom: 24px; } @media (min-width: 768px) { .dsrv-grid { grid-template-columns: 2fr 1fr; } }`}</style>
        <div className="dsrv-grid">

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Manpower */}
            <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: T.onSurface, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MIcon d={ICONS.groups} fill={T.primary} />
                  Manpower Summary
                </h2>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Read Only</span>
              </div>

              {manpower.length > 0 ? (
                <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.surfaceDim }}>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.onSurfaceVar }}>Trade</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.onSurfaceVar }}>Count</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.onSurfaceVar }}>Sufficient</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manpowerData.map((m, idx) => {
                        const ok = m.is_sufficient
                        return (
                          <tr key={idx} style={{ borderTop: `1px solid ${T.surfaceHigh}` }}>
                            <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500, color: T.onSurface }}>
                              {m.trade}
                              {!ok && m.notes && <p style={{ fontSize: 11, color: '#92400e', margin: '2px 0 0' }}>{m.notes}</p>}
                            </td>
                            <td style={{ textAlign: 'center', padding: '14px 16px', fontSize: 14, fontWeight: 600, color: T.onSurface }}>{String(m.headcount).padStart(2, '0')}</td>
                            <td style={{ textAlign: 'center', padding: '14px 16px' }}>
                              {ok ? (
                                <span style={{ color: T.primary, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                                  <MIcon d={ICONS.check} size={14} fill={T.primary} /> Yes
                                </span>
                              ) : (
                                <span style={{ color: T.tertiary, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                                  <MIcon d={ICONS.close} size={14} fill={T.tertiary} /> No
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      <tr style={{ borderTop: `2px solid ${T.surfaceHigh}`, background: T.surfaceDim }}>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: T.onSurface }}>Total Personnel</td>
                        <td style={{ textAlign: 'center', padding: '14px 16px', fontSize: 14, fontWeight: 700, color: T.onSurface }}>{String(totalPersonnel).padStart(2, '0')}</td>
                        <td style={{ textAlign: 'center', padding: '14px 16px' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : report.manpower ? (
                <div>
                  <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line', color: T.onSurface, margin: '0 0 16px' }}>{report.manpower}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    Total Personnel: {manpowerData.length > 0 ? totalPersonnel : (
                      // Parse from text if needed
                      report.manpower.split('\n').reduce((sum: number, line: string) => {
                        const match = line.match(/:\s*(\d+)/)
                        return sum + (match ? parseInt(match[1], 10) : 0)
                      }, 0)
                    )}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: T.onSurfaceVar, fontStyle: 'italic', margin: 0 }}>No manpower data</p>
              )}
            </section>

            {/* Work Summary — dark panel */}
            {(report.work_completed_today || report.work_in_progress || report.work_planned_tomorrow) && (
              <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: T.onSurface, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MIcon d={ICONS.assignment} fill={T.primary} />
                  Work Summary
                </h2>
                <div style={{
                  background: T.surfaceDim, color: T.onSurface, padding: 24, borderRadius: 10,
                  fontSize: 13, lineHeight: 1.8, minHeight: 100,
                  borderLeft: `4px solid ${T.primary}`,
                }}>
                  {report.work_completed_today && (
                    <>
                      <div style={{ color: T.primary, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11, marginBottom: 8 }}>COMPLETED TODAY</div>
                      <p style={{ margin: '0 0 20px', whiteSpace: 'pre-line' }}>{report.work_completed_today}</p>
                    </>
                  )}
                  {report.work_in_progress && (
                    <>
                      <div style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11, marginBottom: 8 }}>IN PROGRESS</div>
                      <p style={{ margin: '0 0 20px', whiteSpace: 'pre-line' }}>{report.work_in_progress}</p>
                    </>
                  )}
                  {report.work_planned_tomorrow && (
                    <>
                      <div style={{ color: '#92400e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11, marginBottom: 8 }}>PLANNED TOMORROW</div>
                      <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{report.work_planned_tomorrow}</p>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Deliveries */}
            {report.deliveries && (
              <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: T.onSurface, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MIcon d={ICONS.localShipping} fill={T.primary} />
                  Deliveries
                </h2>
                <div style={{ background: T.surfaceDim, padding: 16, borderRadius: 8 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line', color: T.onSurface, margin: 0 }}>{report.deliveries}</p>
                </div>
              </section>
            )}

            {/* Issues & Delays */}
            {report.issues_delays && (
              <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: T.onSurface, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MIcon d={ICONS.warning} fill="#d97706" />
                  Issues & Delays
                </h2>
                <div style={{ background: '#fef9c3', padding: 16, borderRadius: 8, border: '1px solid #fde68a', display: 'grid', gap: 12 }}>
                  {report.issues_delays.split(/\n\s*\n/).map((block, index) => {
                    const trimmed = block.trim()
                    if (!trimmed) return null
                    const lines = trimmed.split('\n')
                    const type = /^Delay\s*-\s*/i.test(lines[0]) ? 'Delay' : /^\[.*\]/.test(lines[0]) ? 'Issue' : 'Issue'
                    return (
                      <div key={index} style={{ borderLeft: `4px solid ${type === 'Delay' ? '#9e421f' : '#b21b21'}`, paddingLeft: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: type === 'Delay' ? '#9e421f' : '#92400e', margin: '0 0 4px' }}>{type}</p>
                        {lines.map((line, lineIdx) => (
                          <p key={lineIdx} style={{ fontSize: 13, lineHeight: 1.6, margin: lineIdx === 0 ? 0 : '2px 0 0', whiteSpace: 'pre-wrap', color: '#5f4636' }}>{line}</p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Inspections */}
            {report.inspection_today_upcoming_with_status && (
              <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: T.onSurface, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MIcon d={ICONS.description} fill={T.primary} />
                  Inspections
                </h2>
                <div style={{ background: T.surfaceDim, padding: 16, borderRadius: 8 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line', color: T.onSurface, margin: 0 }}>{report.inspection_today_upcoming_with_status}</p>
                </div>
              </section>
            )}

            {/* Notes */}
            {report.notes && (
              <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: T.onSurface, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MIcon d={ICONS.notes} fill={T.primary} />
                  Notes
                </h2>
                <div style={{ background: T.surfaceDim, padding: 16, borderRadius: 8 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line', color: T.onSurface, margin: 0 }}>{report.notes}</p>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Site Photos */}
            <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Site Progress</h3>
              {photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {photos.slice(0, 3).map((p, i) => (
                    <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                      <img
                        src={p.url}
                        alt={p.caption || p.filename || 'Site photo'}
                        style={{
                          width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8,
                          filter: 'grayscale(100%)', transition: 'filter 300ms',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.filter = 'grayscale(0%)')}
                        onMouseLeave={e => (e.currentTarget.style.filter = 'grayscale(100%)')}
                      />
                    </a>
                  ))}
                  {photos.length > 3 ? (
                    <div style={{
                      aspectRatio: '1', borderRadius: 8, background: T.surfaceDim,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, color: T.onSurfaceVar,
                    }}>
                      <MIcon d={ICONS.camera} size={24} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>+{photos.length - 3} More</span>
                    </div>
                  ) : (
                    <div style={{
                      aspectRatio: '1', borderRadius: 8, background: T.surfaceDim,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, color: T.onSurfaceVar,
                    }}>
                      <MIcon d={ICONS.camera} size={24} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{photos.length} Photo{photos.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: 24, borderRadius: 8, background: T.surfaceDim, textAlign: 'center', color: T.onSurfaceVar }}>
                  <MIcon d={ICONS.camera} size={28} />
                  <p style={{ fontSize: 12, margin: '8px 0 0', fontWeight: 500 }}>No photos attached</p>
                </div>
              )}
            </section>

            {/* Conditions */}
            <section style={{ background: T.surface, borderRadius: 12, padding: 24, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Conditions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MIcon d={ICONS.sunny} size={20} fill="#d97706" />
                    <span style={{ fontSize: 14, fontWeight: 500, color: T.onSurface }}>Weather</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.onSurface }}>{report.weather || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MIcon d={ICONS.happy} size={20} fill={T.primary} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: T.onSurface }}>Safety Incident</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>None</span>
                </div>
              </div>
            </section>

            {/* Sign-off */}
            <section style={{ background: T.surface, borderRadius: 12, padding: 24, borderTop: `4px solid ${T.primary}`, boxShadow: '0 0 0 1px rgba(173,179,174,0.1)' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceVar, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Submitted By</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
                    {(superintendentName || 'S')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    {superintendentName || 'Superintendent'}
                  </p>
                  <p style={{ fontSize: 12, color: T.onSurfaceVar, margin: '2px 0 0' }}>Site Supervisor</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: T.onSurfaceVar, fontStyle: 'italic', margin: '16px 0 0', paddingTop: 12, borderTop: `1px solid ${T.surfaceHigh}` }}>
                "Electronically signed on {submittedAt || '—'}"
              </p>
            </section>
          </div>
        </div>

        {/* ── Footer Action Bar ── */}
        <footer style={{
          background: T.surface, borderRadius: 12, padding: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 0 0 1px rgba(173,179,174,0.1)',
          flexWrap: 'wrap', gap: 16,
        }}>
          <button
            onClick={() => navigate('/daily-reports')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: 'transparent', color: T.onSurface,
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            <MIcon d={ICONS.arrowBack} size={18} />
            All Reports
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 8, border: 'none',
                background: '#cfe6f2', color: '#2d424c',
                fontWeight: 700, fontSize: 14, cursor: generatingPdf ? 'default' : 'pointer',
                opacity: generatingPdf ? 0.6 : 1,
              }}
            >
              <MIcon d={ICONS.pdf} size={18} />
              {generatingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            <Link
              to="/daily-reports/new"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 8, border: 'none', textDecoration: 'none',
                background: T.primary, color: '#fff',
                fontWeight: 700, fontSize: 14,
                boxShadow: '0 2px 8px rgba(232,120,58,0.2)',
              }}
            >
              <MIcon d={ICONS.add} size={18} fill="#fff" />
              New Report
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
