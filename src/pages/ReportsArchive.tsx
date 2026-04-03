// ===== Reports Archive — Standalone Page =====
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { fetchDSRList, fetchProjects, type DSRRow, type FieldProject } from '../lib/fieldOps'
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from '../lib/projectColors'
import { useAuth, filterByAccess } from '../lib/AuthContext'

const C = {
  surface: '#f9f9f6',
  surfaceContainer: '#ecefea',
  surfaceContainerLow: '#f3f4f0',
  surfaceContainerHigh: '#e5e9e4',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#2e3430',
  onSurfaceVariant: '#5a615c',
  outlineVariant: '#adb3ae',
  primary: '#E8783A',
  onPrimary: '#FFF3EC',
}

export default function ReportsArchive() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [allProjects, setAllProjects] = useState<FieldProject[]>([])
  const [reports, setReports] = useState<DSRRow[]>([])
  const [loading, setLoading] = useState(true)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProjects().then(setAllProjects)
  }, [])

  const projects = filterByAccess(allProjects, profile)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchDSRList({ projectCode: projectFilter || undefined, limit: 200 })
    setReports(filterByAccess(data, profile))
    setLoading(false)
  }, [projectFilter, profile])

  useEffect(() => { load() }, [load])

  const filteredReports = reports.filter((r) => {
    const matchesProject = !projectFilter || r.projects?.includes(projectFilter)
    const matchesSearch = !search ||
      r.projects?.join('').toLowerCase().includes(search.toLowerCase()) ||
      (r.work_completed_today || '').toLowerCase().includes(search.toLowerCase())
    return matchesProject && matchesSearch
  })

  return (
    <div style={{ background: C.surface, minHeight: '100vh', color: C.onSurface, fontFamily: 'Inter, system-ui, sans-serif' }}>

      <Navbar activePage="reports" />

      {/* ===== Main Content ===== */}
      <main className="px-4 md:px-6 lg:px-10 py-8 md:py-10 lg:py-12" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Page Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 28, color: C.onSurface, margin: 0, letterSpacing: '-0.5px' }}>Report Archive</h1>
            <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '6px 0 0' }}>{filteredReports.length} reports total in current cycle</p>
          </div>
          <Link
            to="/daily-reports/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: C.primary, color: C.onPrimary,
              borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(232,120,58,0.2)',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Report
          </Link>
        </div>

        {/* Archive Card */}
        <div style={{ background: C.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${C.outlineVariant}30` }}>

          {/* Filters bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ padding: '20px 32px', borderBottom: `1px solid ${C.surfaceContainerHigh}` }}>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.onSurfaceVariant} strokeWidth={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reports..."
                  style={{ background: C.surfaceContainerLow, border: 'none', borderRadius: 8, paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, fontSize: 13, color: C.onSurface, width: 280, outline: 'none' }}
                />
              </div>
            </div>
            {/* Project filter pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => setProjectFilter(null)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: !projectFilter ? C.primary : C.surfaceContainerLow, color: !projectFilter ? C.onPrimary : C.onSurfaceVariant, transition: 'all 150ms' }}>All</button>
              {projects.map((proj) => {
                const active = projectFilter === proj.code
                return (
                  <button key={proj.code} onClick={() => setProjectFilter(active ? null : proj.code)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? C.primary : C.surfaceContainerLow, color: active ? C.onPrimary : C.onSurfaceVariant, transition: 'all 150ms' }}>
                    {proj.code}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: `${C.surfaceContainerLow}80` }}>
                  {['ID', 'Project', 'Date', 'Superintendent', 'Status', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '14px 32px', textAlign: h === 'Action' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 32px', textAlign: 'center', color: C.onSurfaceVariant, fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <div style={{ width: 18, height: 18, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Loading reports...
                      </div>
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 32px', textAlign: 'center', color: C.onSurfaceVariant, fontSize: 14 }}>
                      No reports found. <Link to="/daily-reports/new" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>Submit today's report →</Link>
                    </td>
                  </tr>
                ) : filteredReports.map((r, idx) => {
                  const code = r.projects?.[0] || null
                  const colors = code ? (PROJECT_COLORS[code] || DEFAULT_PROJECT_COLOR) : DEFAULT_PROJECT_COLOR
                  const isSubmitted = ['Submitted', 'Sent'].includes(r.report_status || '')
                  const date = r.date ? new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
                  const proj = code ? projects.find((p) => p.code === code) : null
                  return (
                    <tr
                      key={r.id}
                      style={{ borderTop: idx > 0 ? `1px solid ${C.surfaceContainerHigh}` : undefined, cursor: 'pointer', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.surfaceContainerLowest)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => navigate(`/daily-reports/${r.id}`)}
                    >
                      <td style={{ padding: '18px 32px', fontSize: 13, fontFamily: 'monospace', color: C.onSurfaceVariant }}>#{r.id}</td>
                      <td style={{ padding: '18px 32px' }}>
                        <div className="flex items-center gap-2">
                          <span style={{ padding: '2px 8px', background: colors.bg, color: colors.text, fontSize: 10, fontWeight: 700, borderRadius: 4 }}>{code || '—'}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurface }}>{proj?.name || code || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '18px 32px', fontSize: 13, color: C.onSurfaceVariant }}>{date}</td>
                      <td style={{ padding: '18px 32px', fontSize: 13, color: C.onSurfaceVariant }}>{proj?.superintendent || '—'}</td>
                      <td style={{ padding: '18px 32px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: isSubmitted ? `${C.primary}1a` : C.surfaceContainerHigh, color: isSubmitted ? C.primary : C.onSurfaceVariant, fontSize: 12, fontWeight: 700, borderRadius: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSubmitted ? C.primary : C.outlineVariant }} />
                          {r.report_status || 'Unknown'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 32px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/daily-reports/${r.id}`) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, transition: 'color 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 32px', background: `${C.surfaceContainerLow}30`, borderTop: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant }}>
              Showing {filteredReports.length} reports
            </span>
            <div className="flex gap-2">
              <button style={{ padding: '4px 12px', background: C.surfaceContainerHigh, border: 'none', borderRadius: 4, color: C.onSurfaceVariant, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Prev</button>
              <button style={{ padding: '4px 12px', background: C.surfaceContainerHigh, border: 'none', borderRadius: 4, color: C.onSurfaceVariant, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}
