// ===== Daily Reports Dashboard — SiteIntelligence Design =====
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { fetchDSRList, fetchProjects, type DSRRow, type FieldProject } from '../lib/fieldOps'
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from '../lib/projectColors'
import { useAuth, filterByAccess } from '../lib/AuthContext'

const TODAY = new Date().toISOString().split('T')[0]

// MD3 color tokens (light)
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
  primary: '#E8783A',
  primaryFixed: '#FDDCCC',
  primaryFixedDim: '#F5C4A8',
  onPrimary: '#FFF3EC',
  onPrimaryContainer: '#B84E1D',
  primaryContainer: '#FDDCCC',
  tertiary: '#bb1b21',
  tertiaryContainer: '#fe4e49',
}

function getLastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

import type { UserProfile } from '../lib/AuthContext'

export default function FieldOpsDashboard() {
  const navigate = useNavigate()
  const { profile, signOut, updatePassword, user, isAdmin, fetchAllUsers, adminResetPassword } = useAuth()
  const [allProjects, setAllProjects] = useState<FieldProject[]>([])
  const [reports, setReports] = useState<DSRRow[]>([])
  const [_loading, setLoading] = useState(true)
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  // Admin state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [adminLoadingUsers, setAdminLoadingUsers] = useState(false)
  const [adminSelectedUser, setAdminSelectedUser] = useState<UserProfile | null>(null)
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const [adminPasswordMsg, setAdminPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [adminResetting, setAdminResetting] = useState(false)
  const last7Days = getLastNDays(7)

  // Load projects from DB
  useEffect(() => {
    fetchProjects().then(setAllProjects)
  }, [])

  // Filter projects by user access
  const projects = filterByAccess(allProjects, profile)

  const load = useCallback(async () => {
    setLoading(true)
    const projectId = projectFilter ? parseInt(projectFilter, 10) : undefined
    const data = await fetchDSRList({ projectId, limit: 200 })
    // Filter reports by user's allowed projects
    const filtered = filterByAccess(data, profile)
    setReports(filtered)
    setLoading(false)
  }, [projectFilter, profile])

  useEffect(() => { load() }, [load])

  const projectIds = projects.map((p) => p.id)
  const todayReports: Record<number, DSRRow | undefined> = {}
  for (const p of projects) {
    todayReports[p.id] = reports.find((r) => r.date === TODAY && r.projects && r.projects.includes(p.name))
  }

  const submittedToday = Object.values(todayReports).filter(Boolean).length
  const totalProjects = projectIds.length

  const weeklyData = last7Days.map((date) => {
    const submitted = projects.filter((p) =>
      reports.some((r) => r.date === date && r.projects && r.projects.includes(p.name))
    ).length
    return { date, submitted, pct: totalProjects > 0 ? Math.round((submitted / totalProjects) * 100) : 0 }
  })

  const compliancePct = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, d) => s + d.pct, 0) / weeklyData.length)
    : 0

  const pendingProjects = projectIds.filter((id) => !todayReports[id])

  return (
    <div style={{ background: C.surface, minHeight: '100vh', color: C.onSurface, fontFamily: 'Inter, system-ui, sans-serif' }}>

      <Navbar
        activePage="dashboard"
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onProfileClick={() => { setShowProfilePanel(true); setPasswordMsg(null); setNewPassword(''); setConfirmPassword('') }}
      />

      <div className="flex">
        {/* ===== Mobile Overlay ===== */}
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />}

        {/* ===== Sidebar ===== */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 fixed z-50 flex flex-col`} style={{ width: 256, left: 0, top: 65, bottom: 0, background: C.surfaceContainer, borderRight: `1px solid ${C.outlineVariant}30`, overflowY: 'auto' }}>
          <div style={{ padding: '24px 24px 8px' }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Site Locations</h3>
            <p style={{ fontSize: 11, color: C.onSurfaceVariant, fontWeight: 500, margin: '4px 0 0' }}>Active Projects</p>
          </div>
          <nav style={{ flex: 1, paddingTop: 8 }}>
            {/* All sites */}
            <button
              onClick={() => { setProjectFilter(null); setSidebarOpen(false) }}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 24px', border: 'none', cursor: 'pointer',
                background: !projectFilter ? C.primary : 'transparent',
                color: !projectFilter ? C.onPrimary : C.onSurfaceVariant,
                fontWeight: !projectFilter ? 700 : 500, fontSize: 14,
                borderRadius: !projectFilter ? '0 24px 24px 0' : 0,
                transition: 'all 150ms',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              All Sites
            </button>
            {projects.map((proj) => {
              const colors = PROJECT_COLORS[proj.code] || DEFAULT_PROJECT_COLOR
              const active = projectFilter === String(proj.id)
              const submitted = !!todayReports[proj.id]
              return (
                <button
                  key={proj.id}
                  onClick={() => { setProjectFilter(active ? null : String(proj.id)); setSidebarOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 24px', border: 'none', cursor: 'pointer',
                    background: active ? C.primary : 'transparent',
                    color: active ? C.onPrimary : C.onSurfaceVariant,
                    fontWeight: active ? 700 : 500, fontSize: 14,
                    borderRadius: active ? '0 24px 24px 0' : 0,
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surfaceContainerHigh }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: submitted ? '#22c55e' : C.tertiary, flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: colors.bg, color: colors.text, padding: '1px 6px', borderRadius: 4 }}>{proj.code}</span>
                </button>
              )
            })}
          </nav>
          <div style={{ padding: 24 }}>
            <Link
              to="/sites/new"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 0', background: C.primary, color: C.onPrimary, borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'background 150ms' }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add New Site
            </Link>
          </div>
        </aside>

        {/* ===== Main ===== */}
        <main style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }} className="p-4 md:p-8 lg:p-12">

          {/* ===== Bento Header ===== */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: 48 }}>

            {/* Summary card — Animated Gradient */}
            <div className="md:col-span-2 hero-gradient-card" style={{ borderRadius: 12, padding: 32, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Animated gradient layer */}
              <div className="hero-gradient-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
              {/* Floating orbs */}
              <div className="hero-orb hero-orb-1" />
              <div className="hero-orb hero-orb-2" />
              <div className="hero-orb hero-orb-3" />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ color: '#FFF7ED', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Status Overview'}
                </span>
                <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 36, color: '#ffffff', margin: '8px 0 16px', letterSpacing: '-0.5px' }}>
                  {profile?.allowed_projects && profile.allowed_projects.length > 0 ? 'Your Projects' : "Today's Reports"}
                </h1>
                <div className="flex items-end gap-3">
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: 64, color: '#FFF7ED', lineHeight: 1 }}>{submittedToday}</span>
                  <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)', paddingBottom: 8 }}>of {totalProjects} submitted</span>
                </div>
              </div>
              <div style={{ marginTop: 32, display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
                <Link
                  to="/daily-reports/new"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#ffffff', color: '#EA580C', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  New Report
                </Link>
                <Link
                  to="/reports"
                  style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 150ms', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  View Older Reports
                </Link>
              </div>
            </div>

            {/* Compliance chart */}
            <div style={{ background: C.surfaceContainer, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', border: `1px solid ${C.outlineVariant}30` }}>
              <div className="flex justify-between items-start" style={{ marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: C.onSurface, margin: 0 }}>7-Day Compliance</h3>
                  <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '4px 0 0' }}>Submission Trend</p>
                </div>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.primary }}>{compliancePct}%</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, padding: '0 8px', minHeight: 80 }}>
                {weeklyData.map(({ date, submitted, pct }) => {
                  const isToday = date === TODAY
                  const barBg = pct >= 80 ? '#E8783A' : pct >= 50 ? '#E8783A' : '#E8783A'
                  const heightPct = Math.max(8, pct)
                  return (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', background: C.surfaceContainerHigh, borderRadius: '3px 3px 0 0', position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                        <div
                          style={{ width: '100%', borderRadius: '3px 3px 0 0', background: isToday ? barBg : barBg + '99', transition: 'height 0.3s ease', height: `${heightPct}%` }}
                          title={`${submitted}/${totalProjects}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between" style={{ marginTop: 12 }}>
                {weeklyData.map(({ date }) => (
                  <span key={date} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: date === TODAY ? C.primary : C.onSurfaceVariant, letterSpacing: '0.05em' }}>
                    {date === TODAY ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ===== Pending Reports (card grid) ===== */}
          {pendingProjects.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 22, color: C.onSurface, margin: 0 }}>Pending Reports</h2>
                <span style={{ fontSize: 13, color: C.onSurfaceVariant, fontWeight: 500 }}>{pendingProjects.length} active tasks</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingProjects.map((id) => {
                  const proj = projects.find((p) => p.id === id)
                  const colors = proj ? (PROJECT_COLORS[proj.code] || DEFAULT_PROJECT_COLOR) : DEFAULT_PROJECT_COLOR
                  return (
                    <div
                      key={id}
                      onClick={() => navigate('/daily-reports/new')}
                      style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 20, cursor: 'pointer', border: `1px solid ${C.outlineVariant}30`, transition: 'all 150ms', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.surfaceContainerLow; e.currentTarget.style.borderColor = `${C.primary}30` }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.surfaceContainerLowest; e.currentTarget.style.borderColor = `${C.outlineVariant}30` }}
                    >
                      <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                        <div style={{ padding: 8, background: C.surfaceContainer, borderRadius: 8 }}>
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={colors.text} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span style={{ padding: '3px 10px', background: `${C.tertiaryContainer}1a`, color: C.tertiary, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 20 }}>
                          Not submitted
                        </span>
                      </div>
                      <h4 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, color: C.onSurface, margin: '0 0 8px' }}>{proj?.name || 'Project'}</h4>
                      <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '0 0 16px' }}>{proj?.superintendent || 'No superintendent assigned'}</p>
                      <div className="flex items-center justify-between" style={{ fontSize: 12, fontWeight: 500, color: C.onSurfaceVariant }}>
                        <span className="flex items-center gap-1">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                          Due today
                        </span>
                        <span className="flex items-center gap-1" style={{ color: C.primary, cursor: 'pointer' }}>
                          Start Draft
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Mobile Floating New Report Button */}
      <Link
        to="/daily-reports/new"
        className="md:hidden fixed z-40"
        style={{ bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(232,120,58,0.4)', textDecoration: 'none' }}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      </Link>

      {/* ===== Profile Panel (Slide-over) ===== */}
      {showProfilePanel && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowProfilePanel(false)} />
          <div className="fixed z-[70] right-0 top-0 bottom-0" style={{ width: '100%', maxWidth: 400, background: C.surfaceContainerLowest, boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* Panel Header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.outlineVariant}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>My Profile</h2>
              <button
                onClick={() => setShowProfilePanel(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4, borderRadius: 6, display: 'flex' }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Profile Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

              {/* Avatar + Name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, #F5A623)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'Manrope, sans-serif', marginBottom: 12 }}>
                  {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.onSurface, fontFamily: 'Manrope, sans-serif' }}>{profile?.full_name || 'User'}</div>
                <div style={{ fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 }}>{profile?.role || 'Member'}</div>
              </div>

              {/* Info Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {/* Email */}
                <div style={{ background: C.surfaceContainerLow, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, fontWeight: 700, marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{user?.email || profile?.email || '—'}</div>
                </div>

                {/* Role */}
                <div style={{ background: C.surfaceContainerLow, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, fontWeight: 700, marginBottom: 4 }}>Role</div>
                  <div style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{profile?.role || 'Member'}</div>
                </div>

                {/* Assigned Projects */}
                <div style={{ background: C.surfaceContainerLow, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, fontWeight: 700, marginBottom: 8 }}>Assigned Projects</div>
                  {profile?.allowed_projects && profile.allowed_projects.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {profile.allowed_projects.map((code) => {
                        const colors = PROJECT_COLORS[code] || DEFAULT_PROJECT_COLOR
                        return (
                          <span key={code} style={{ padding: '4px 10px', background: colors.bg, color: colors.text, fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                            {code}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: C.primary, fontWeight: 600 }}>All Projects (Admin)</div>
                  )}
                </div>

                {/* Status */}
                <div style={{ background: C.surfaceContainerLow, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, fontWeight: 700, marginBottom: 4 }}>Account Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: profile?.is_active ? '#22c55e' : C.tertiary }} />
                    <span style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{profile?.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              {/* ===== Change Password Section ===== */}
              <div style={{ borderTop: `1px solid ${C.outlineVariant}30`, paddingTop: 24 }}>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, color: C.onSurface, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Change Password
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 8, border: `1px solid ${C.outlineVariant}60`,
                        background: C.surfaceContainerLow, fontSize: 13, color: C.onSurface, outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `${C.outlineVariant}60` }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 8, border: `1px solid ${C.outlineVariant}60`,
                        background: C.surfaceContainerLow, fontSize: 13, color: C.onSurface, outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = `${C.outlineVariant}60` }}
                    />
                  </div>

                  {passwordMsg && (
                    <div style={{
                      fontSize: 12, borderRadius: 8, padding: '10px 14px',
                      background: passwordMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(187,27,33,0.1)',
                      color: passwordMsg.type === 'success' ? '#16a34a' : C.tertiary,
                      border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(187,27,33,0.2)'}`,
                    }}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <button
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    onClick={async () => {
                      if (newPassword.length < 6) {
                        setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
                        return
                      }
                      if (newPassword !== confirmPassword) {
                        setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
                        return
                      }
                      setChangingPassword(true)
                      setPasswordMsg(null)
                      const { error } = await updatePassword(newPassword)
                      if (error) {
                        setPasswordMsg({ type: 'error', text: error })
                      } else {
                        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' })
                        setNewPassword('')
                        setConfirmPassword('')
                      }
                      setChangingPassword(false)
                    }}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: (!newPassword || !confirmPassword || changingPassword) ? C.surfaceContainerHigh : C.primary,
                      color: (!newPassword || !confirmPassword || changingPassword) ? C.onSurfaceVariant : '#fff',
                      fontWeight: 700, fontSize: 13, fontFamily: 'Manrope, sans-serif',
                      transition: 'all 150ms',
                    }}
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* ===== Admin: Manage Users (only for admin role) ===== */}
              {isAdmin && (
                <div style={{ borderTop: `1px solid ${C.outlineVariant}30`, paddingTop: 24, marginTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, color: C.onSurface, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={C.primary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      Manage Users
                    </h3>
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.primary, background: `${C.primary}15`, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</span>
                  </div>

                  {/* Load users button */}
                  {allUsers.length === 0 && (
                    <button
                      onClick={async () => {
                        setAdminLoadingUsers(true)
                        const users = await fetchAllUsers()
                        setAllUsers(users)
                        setAdminLoadingUsers(false)
                      }}
                      disabled={adminLoadingUsers}
                      style={{
                        width: '100%', padding: '10px 0', borderRadius: 8, border: `1px solid ${C.outlineVariant}40`,
                        background: C.surfaceContainerLow, color: C.onSurface, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {adminLoadingUsers ? (
                        <>
                          <div style={{ width: 14, height: 14, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Loading users...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          Load All Users
                        </>
                      )}
                    </button>
                  )}

                  {/* User list */}
                  {allUsers.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {allUsers.map((u) => {
                        const selected = adminSelectedUser?.id === u.id
                        return (
                          <div key={u.id}>
                            <button
                              onClick={() => {
                                setAdminSelectedUser(selected ? null : u)
                                setAdminNewPassword('')
                                setAdminPasswordMsg(null)
                              }}
                              style={{
                                width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                                border: selected ? `1.5px solid ${C.primary}` : `1px solid ${C.outlineVariant}30`,
                                background: selected ? `${C.primary}08` : C.surfaceContainerLow,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                                transition: 'all 150ms',
                              }}
                            >
                              {/* Avatar */}
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: selected ? C.primary : C.surfaceContainerHigh,
                                color: selected ? '#fff' : C.onSurfaceVariant,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700,
                              }}>
                                {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {u.full_name || 'Unknown'}
                                </div>
                                <div style={{ fontSize: 11, color: C.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {u.email}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#22c55e' : C.tertiary }} />
                                <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontWeight: 500 }}>{u.role}</span>
                              </div>
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.onSurfaceVariant} strokeWidth={2} style={{ flexShrink: 0, transform: selected ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            {/* Expanded: Reset password form */}
                            {selected && (
                              <div style={{ padding: '12px 14px', marginTop: 4, background: `${C.primary}05`, borderRadius: 8, border: `1px solid ${C.primary}15` }}>
                                <div style={{ fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 8 }}>
                                  Reset password for <span style={{ color: C.primary }}>{u.full_name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <input
                                    type="text"
                                    value={adminNewPassword}
                                    onChange={(e) => setAdminNewPassword(e.target.value)}
                                    placeholder="New password (min 6 chars)"
                                    style={{
                                      flex: 1, padding: '10px 12px', borderRadius: 6, border: `1px solid ${C.outlineVariant}60`,
                                      background: C.surfaceContainerLowest, fontSize: 12, color: C.onSurface, outline: 'none', boxSizing: 'border-box',
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = C.primary }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = `${C.outlineVariant}60` }}
                                  />
                                  <button
                                    disabled={adminResetting || adminNewPassword.length < 6}
                                    onClick={async () => {
                                      setAdminResetting(true)
                                      setAdminPasswordMsg(null)
                                      const { error } = await adminResetPassword(u.id, adminNewPassword)
                                      if (error) {
                                        setAdminPasswordMsg({ type: 'error', text: error })
                                      } else {
                                        setAdminPasswordMsg({ type: 'success', text: `Password reset for ${u.full_name}!` })
                                        setAdminNewPassword('')
                                      }
                                      setAdminResetting(false)
                                    }}
                                    style={{
                                      padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', flexShrink: 0,
                                      background: (adminResetting || adminNewPassword.length < 6) ? C.surfaceContainerHigh : C.primary,
                                      color: (adminResetting || adminNewPassword.length < 6) ? C.onSurfaceVariant : '#fff',
                                      fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif',
                                      transition: 'all 150ms',
                                    }}
                                  >
                                    {adminResetting ? '...' : 'Reset'}
                                  </button>
                                </div>
                                {adminPasswordMsg && (
                                  <div style={{
                                    fontSize: 11, borderRadius: 6, padding: '8px 10px', marginTop: 8,
                                    background: adminPasswordMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(187,27,33,0.1)',
                                    color: adminPasswordMsg.type === 'success' ? '#16a34a' : C.tertiary,
                                  }}>
                                    {adminPasswordMsg.text}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel Footer — Sign Out */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.outlineVariant}30` }}>
              <button
                onClick={async () => { setShowProfilePanel(false); await signOut(); navigate('/login') }}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 8, border: `1px solid ${C.tertiary}40`,
                  background: 'transparent', color: C.tertiary, fontWeight: 700, fontSize: 13,
                  fontFamily: 'Manrope, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.tertiary}10` }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        /* ===== Animated Gradient Hero Card ===== */
        .hero-gradient-bg {
          background: linear-gradient(135deg, #E8783A, #EF8E3A, #F5A623, #EF8E3A, #E8783A);
          background-size: 300% 300%;
          animation: heroGradientFlow 20s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes heroGradientFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Floating orbs */
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .hero-orb-1 {
          width: 240px; height: 240px;
          top: -80px; right: -60px;
          background: rgba(245,166,35,0.12);
          filter: blur(60px);
          animation: orbFloat1 24s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .hero-orb-2 {
          width: 180px; height: 180px;
          bottom: -50px; left: 10%;
          background: rgba(239,142,58,0.1);
          filter: blur(70px);
          animation: orbFloat2 28s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .hero-orb-3 {
          width: 130px; height: 130px;
          top: 30%; right: 22%;
          background: rgba(245,166,35,0.08);
          filter: blur(50px);
          animation: orbFloat3 22s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes orbFloat1 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(12px, -18px); }
          50%  { transform: translate(-8px, -10px); }
          75%  { transform: translate(6px, 14px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes orbFloat2 {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-15px, 10px); }
          50%  { transform: translate(10px, 18px); }
          75%  { transform: translate(-8px, -12px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes orbFloat3 {
          0%   { transform: translate(0, 0); }
          33%  { transform: translate(10px, 12px); }
          66%  { transform: translate(-12px, 6px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  )
}
