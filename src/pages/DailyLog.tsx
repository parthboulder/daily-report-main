// ===== Daily Log — Timeline & Activity Feed for a Single Day =====
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  fetchProjects, fetchDSRsForDate, fetchManpowerForDate,
  fetchDeliveriesForDate, fetchDelaysForDate, fetchInspectionsForDate,
  type FieldProject, type DSRRow, type ManpowerRow,
  type DeliveryRow, type DelayRow, type InspectionRow,
} from '../lib/fieldOps'
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from '../lib/projectColors'
import { useAuth, filterByAccess } from '../lib/AuthContext'

const C = {
  surface: '#f9f9f6',
  surfaceContainer: '#ecefea',
  surfaceContainerLow: '#f3f4f0',
  surfaceContainerHigh: '#e5e9e4',
  surfaceContainerHighest: '#dee4de',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#2e3430',
  onSurfaceVariant: '#5a615c',
  outlineVariant: '#adb3ae',
  outline: '#767c77',
  primary: '#E8783A',
  primaryFixed: '#FDDCCC',
  onPrimary: '#FFF3EC',
  onPrimaryContainer: '#B84E1D',
  tertiary: '#bb1b21',
  tertiaryContainer: '#fe4e49',
}

const TODAY = new Date().toISOString().split('T')[0]

function ProjectBadge({ id, code }: { id: number; code?: string }) {
  const colors = code ? (PROJECT_COLORS[code] || DEFAULT_PROJECT_COLOR) : DEFAULT_PROJECT_COLOR
  return (
    <span style={{ padding: '4px 10px', background: colors.bg, color: colors.text, fontSize: 11, fontWeight: 700, borderRadius: 4 }}>#{id}</span>
  )
}

export default function DailyLog() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [projectFilter, setProjectFilter] = useState<number | null>(null)
  const [allProjects, setAllProjects] = useState<FieldProject[]>([])
  const [reports, setReports] = useState<DSRRow[]>([])
  const [manpower, setManpower] = useState<ManpowerRow[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [delays, setDelays] = useState<DelayRow[]>([])
  const [inspections, setInspections] = useState<InspectionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects().then(setAllProjects) }, [])
  const projects = filterByAccess(allProjects, profile)

  const load = useCallback(async () => {
    setLoading(true)
    const pc = projectFilter || undefined
    const [r, m, del, dly, insp] = await Promise.all([
      fetchDSRsForDate(selectedDate, pc),
      fetchManpowerForDate(selectedDate, pc),
      fetchDeliveriesForDate(selectedDate, pc),
      fetchDelaysForDate(selectedDate, pc),
      fetchInspectionsForDate(selectedDate, pc),
    ])
    setReports(r)
    setManpower(m)
    setDeliveries(del)
    setDelays(dly)
    setInspections(insp)
    setLoading(false)
  }, [selectedDate, projectFilter])

  useEffect(() => { load() }, [load])

  // Derived data
  const submittedIds = new Set(reports.map((r) => r.project_id).filter(Boolean))
  const missingSites = projects.filter((p) => !submittedIds.has(p.id))
  const totalHeadcount = manpower.reduce((s, m) => s + (m.people || 0), 0)
  const shortages = manpower.filter((m) => m.sufficient_amt_of_manpower === 'No')
  const failedInspections = inspections.filter((i) => i.result === 'Fail')
  const damagedDeliveries = deliveries.filter((d) => (d.missing_items_damages_everything_received || '').toLowerCase().includes('damage'))
  const totalAlerts = missingSites.length + shortages.length + failedInspections.length + damagedDeliveries.length + delays.length

  // Manpower by trade
  const tradeMap: Record<string, number> = {}
  for (const m of manpower) {
    if (m.name && m.people) tradeMap[m.name] = (tradeMap[m.name] || 0) + m.people
  }
  const trades = Object.entries(tradeMap).sort((a, b) => b[1] - a[1])

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ background: C.surface, minHeight: '100vh', color: C.onSurface, fontFamily: 'Inter, system-ui, sans-serif' }}>

      <Navbar activePage="daily-logs" />

      <main className="px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 28, color: C.onSurface, margin: 0, letterSpacing: '-0.5px' }}>Daily Log</h1>
            <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '6px 0 0' }}>{dateLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '10px 14px', background: C.surfaceContainerLowest, border: `1.5px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, color: C.onSurface, fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', cursor: 'pointer' }}
            />
            <Link
              to="/daily-reports/new"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: C.primary, color: C.onPrimary, borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Report
            </Link>
          </div>
        </div>

        {/* Project Filter Pills */}
        <div className="flex items-center gap-1 flex-wrap" style={{ marginBottom: 32 }}>
          <button onClick={() => setProjectFilter(null)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: !projectFilter ? C.primary : C.surfaceContainerLow, color: !projectFilter ? C.onPrimary : C.onSurfaceVariant, transition: 'all 150ms' }}>All Sites</button>
          {projects.map((p) => {
            const active = projectFilter === p.id
            return (
              <button key={p.id} onClick={() => setProjectFilter(active ? null : p.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? C.primary : C.surfaceContainerLow, color: active ? C.onPrimary : C.onSurfaceVariant, transition: 'all 150ms' }}>
                {p.name}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 80, color: C.onSurfaceVariant, fontSize: 14 }}>
            <div style={{ width: 18, height: 18, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading daily log...
          </div>
        ) : (
          <>
            {/* ===== Quick Stats ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 32 }}>
              {[
                { label: 'Reports Submitted', value: `${reports.length} / ${projects.length}`, accent: reports.length === projects.length ? C.primary : C.tertiary, icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
                { label: 'Total Workers', value: String(totalHeadcount), accent: C.primary, icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                { label: 'Deliveries', value: String(deliveries.length), accent: damagedDeliveries.length > 0 ? C.tertiary : C.primary, icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
                { label: 'Alerts', value: String(totalAlerts), accent: totalAlerts > 0 ? C.tertiary : C.primary, icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              ].map((s) => (
                <div key={s.label} style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 20, border: `1px solid ${C.outlineVariant}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <div style={{ padding: 8, background: C.surfaceContainer, borderRadius: 8, color: s.accent }}>{s.icon}</div>
                  </div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 28, color: s.accent, lineHeight: 1 }}>{s.value}</div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.onSurfaceVariant, margin: '8px 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* ===== Alerts Section ===== */}
            {totalAlerts > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: '0 0 16px' }}>Alerts</h2>
                <div className="flex flex-col gap-3">
                  {missingSites.map((p) => (
                    <div key={`miss-${p.code}`} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.tertiary} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
                      <ProjectBadge id={p.id} code={p.code} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.tertiary }}>Report not submitted</span>
                      <span style={{ fontSize: 12, color: C.onSurfaceVariant, marginLeft: 'auto' }}>{p.name}</span>
                    </div>
                  ))}
                  {shortages.map((m) => (
                    <div key={`short-${m.id}`} style={{ background: '#fef9ee', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#b45309" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {m.project_id && <ProjectBadge id={m.project_id} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Manpower shortage — {m.name}: {m.people} workers</span>
                      {m.notes && <span style={{ fontSize: 12, color: C.onSurfaceVariant, marginLeft: 'auto' }}>{m.notes}</span>}
                    </div>
                  ))}
                  {failedInspections.map((i) => (
                    <div key={`insp-${i.id}`} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.tertiary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      {i.project_id && <ProjectBadge id={i.project_id} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.tertiary }}>Inspection FAILED — {i.name}</span>
                      {i.details && <span style={{ fontSize: 12, color: C.onSurfaceVariant, marginLeft: 'auto' }}>{i.details}</span>}
                    </div>
                  ))}
                  {damagedDeliveries.map((d) => (
                    <div key={`dmg-${d.id}`} style={{ background: '#fef9ee', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#b45309" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      {d.project_id && <ProjectBadge id={d.project_id} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>Delivery damage — {d.name}</span>
                    </div>
                  ))}
                  {delays.map((d) => (
                    <div key={`dly-${d.id}`} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.tertiary} strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
                      {d.project_id && <ProjectBadge id={d.project_id} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.tertiary }}>[{d.cause_category}] {d.delay}{d.days_impacted ? ` — ${d.days_impacted}d impact` : ''}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== Manpower & Weather Row ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: 32 }}>

              {/* Manpower Summary */}
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 24, border: `1px solid ${C.outlineVariant}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: '0 0 20px' }}>Manpower Summary</h2>
                {trades.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.onSurfaceVariant }}>No manpower data for this date.</p>
                ) : (
                  <>
                    <div className="flex items-end gap-2" style={{ marginBottom: 20 }}>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: 48, color: C.primary, lineHeight: 1 }}>{totalHeadcount}</span>
                      <span style={{ fontSize: 14, color: C.onSurfaceVariant, paddingBottom: 6 }}>total workers</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {trades.map(([trade, count]) => {
                        const isShort = shortages.some((s) => s.name === trade)
                        const pct = totalHeadcount > 0 ? Math.round((count / totalHeadcount) * 100) : 0
                        return (
                          <div key={trade}>
                            <div className="flex justify-between" style={{ marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: isShort ? C.tertiary : C.onSurface }}>{trade}{isShort ? ' (SHORT)' : ''}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurfaceVariant }}>{count}</span>
                            </div>
                            <div style={{ height: 6, background: C.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: isShort ? C.tertiary : C.primary, borderRadius: 3, transition: 'width 300ms' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Weather Overview */}
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 24, border: `1px solid ${C.outlineVariant}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: '0 0 20px' }}>Weather Overview</h2>
                {reports.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.onSurfaceVariant }}>No weather data for this date.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reports.map((r) => {
                      return (
                        <div key={r.id} className="flex items-start gap-3" style={{ padding: '10px 14px', background: C.surfaceContainerLow, borderRadius: 8 }}>
                          {r.project_id && <ProjectBadge id={r.project_id} />}
                          <span style={{ fontSize: 13, color: C.onSurface, flex: 1 }}>{r.weather || 'No weather recorded'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ===== Work Highlights ===== */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: '0 0 16px' }}>Work Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Completed Today', field: 'work_completed_today' as const, color: C.primary },
                  { title: 'In Progress', field: 'work_in_progress' as const, color: '#b45309' },
                  { title: 'Planned Tomorrow', field: 'work_planned_tomorrow' as const, color: C.onPrimaryContainer },
                ].map(({ title, field, color }) => (
                  <div key={field} style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 20, border: `1px solid ${C.outlineVariant}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>{title}</h3>
                    {reports.filter((r) => r[field]).length === 0 ? (
                      <p style={{ fontSize: 13, color: C.onSurfaceVariant }}>No data.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {reports.filter((r) => r[field]).map((r) => {
                          return (
                            <div key={r.id} style={{ borderLeft: `3px solid ${color}`, paddingLeft: 12 }}>
                              <div style={{ marginBottom: 4 }}>{r.project_id && <ProjectBadge id={r.project_id} />}</div>
                              <p style={{ fontSize: 13, color: C.onSurface, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r[field]}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ===== Report Timeline ===== */}
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: '0 0 16px' }}>Report Timeline</h2>
              {reports.length === 0 ? (
                <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 40, textAlign: 'center', border: `1px solid ${C.outlineVariant}30` }}>
                  <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: 0 }}>No reports submitted for this date.</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 32 }}>
                  {/* Vertical line */}
                  <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: C.surfaceContainerHigh }} />

                  <div className="flex flex-col gap-4">
                    {reports.map((r) => {
                      const proj = r.project_id ? projects.find((p) => p.id === r.project_id) : null
                      const time = r.report_sent_at
                        ? new Date(r.report_sent_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                        : '—'
                      const isSubmitted = ['Submitted', 'Sent'].includes(r.report_status || '')
                      return (
                        <div
                          key={r.id}
                          onClick={() => navigate(`/daily-reports/${r.id}`)}
                          style={{ position: 'relative', background: C.surfaceContainerLowest, borderRadius: 12, padding: 20, border: `1px solid ${C.outlineVariant}30`, cursor: 'pointer', transition: 'all 150ms', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.primary}40`; e.currentTarget.style.boxShadow = `0 2px 8px ${C.primary}1a` }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.outlineVariant}30`; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                        >
                          {/* Timeline dot */}
                          <div style={{ position: 'absolute', left: -27, top: 24, width: 10, height: 10, borderRadius: '50%', background: isSubmitted ? C.primary : C.tertiary, border: `2px solid ${C.surfaceContainerLowest}` }} />

                          <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 8 }}>
                            <div className="flex items-center gap-3">
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant, fontFamily: 'monospace' }}>{time}</span>
                              {r.project_id && <ProjectBadge id={r.project_id} />}
                              <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>{proj?.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {proj?.superintendent && <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>{proj.superintendent}</span>}
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: isSubmitted ? `${C.primary}1a` : C.surfaceContainerHigh, color: isSubmitted ? C.primary : C.onSurfaceVariant, fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSubmitted ? C.primary : C.outlineVariant }} />
                                {r.report_status || 'Unknown'}
                              </span>
                            </div>
                          </div>

                          {/* Summary snippet */}
                          <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: C.onSurfaceVariant }}>
                            {r.weather && <span>Weather: {r.weather.split('|')[0].trim()}</span>}
                            {r.manpower && <span>Manpower: {r.manpower.split('\n').length} trades</span>}
                            {r.deliveries && <span>Deliveries logged</span>}
                            {r.issues_delays && <span style={{ color: C.tertiary }}>Issues reported</span>}
                          </div>

                          <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: C.outlineVariant }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}
