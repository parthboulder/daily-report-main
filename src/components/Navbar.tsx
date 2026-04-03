// ===== Shared Navbar — Mobile-optimized, responsive across all screens =====
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// MD3 color tokens
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
  primaryFixed: '#FDDCCC',
  onPrimary: '#FFF3EC',
  onPrimaryContainer: '#B84E1D',
  tertiary: '#bb1b21',
}

type ActivePage = 'dashboard' | 'reports' | 'daily-logs' | 'admin'

interface NavbarProps {
  activePage: ActivePage
  /** Show the sidebar hamburger toggle (used on Dashboard) */
  onToggleSidebar?: () => void
  /** Show the "New Report" action */
  showNewReport?: boolean
  /** Callback when "My Profile" is clicked (instead of navigating) */
  onProfileClick?: () => void
}

export default function Navbar({ activePage, onToggleSidebar, showNewReport = true, onProfileClick }: NavbarProps) {
  const navigate = useNavigate()
  const { profile, signOut, isAdmin } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const navLinks: { label: string; to: string; page: ActivePage; adminOnly?: boolean }[] = [
    { label: 'Dashboard', to: '/daily-reports', page: 'dashboard' },
    { label: 'Reports', to: '/reports', page: 'reports' },
    { label: 'Daily Logs', to: '/daily-log', page: 'daily-logs' },
    { label: 'Admin', to: '/admin', page: 'admin', adminOnly: true },
  ]

  const visibleLinks = navLinks.filter(l => !l.adminOnly || isAdmin)

  return (
    <>
      <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.surfaceContainerHigh}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="flex items-center justify-between px-3 md:px-10 py-2 md:py-4 max-w-screen-2xl mx-auto gap-2">

          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={C.onSurface}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
              </button>
            )}
            {/* Mobile hamburger — always visible on mobile to open nav links */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="flex md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              aria-label="Open navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={C.onSurface}>
                {mobileNavOpen
                  ? <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  : <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                }
              </svg>
            </button>
            <Link to="/daily-reports" style={{ textDecoration: 'none' }} className="shrink-0">
              <img src="/boulder-logo.png" alt="Boulder" className="h-7 md:h-12" />
            </Link>
          </div>

          {/* Center: Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {visibleLinks.map(link => (
              link.page === activePage ? (
                <span
                  key={link.page}
                  className="text-sm"
                  style={{ color: C.primary, fontWeight: 700, borderBottom: `2px solid ${C.primary}`, paddingBottom: 2 }}
                >{link.label}</span>
              ) : (
                <Link
                  key={link.page}
                  to={link.to}
                  className="text-sm whitespace-nowrap"
                  style={{ color: C.onSurfaceVariant, fontWeight: 500, textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
                >{link.label}</Link>
              )
            ))}
          </nav>

          {/* Right: New Report + User avatar */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {showNewReport && (
              <Link
                to="/daily-reports/new"
                className="hidden md:inline-flex items-center gap-1.5"
                style={{ padding: '8px 16px', background: C.primary, color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', transition: 'opacity 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New Report
              </Link>
            )}

            {/* User Menu */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div className="w-8 h-8 md:w-10 md:h-10" style={{ borderRadius: '50%', background: C.primaryFixed, border: `1px solid ${C.outlineVariant}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.onPrimaryContainer }}>
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.onSurface, lineHeight: 1.2 }}>{profile?.full_name || 'User'}</div>
                  <div style={{ fontSize: 10, color: C.onSurfaceVariant, lineHeight: 1.2 }}>{profile?.role || 'member'}</div>
                </div>
              </button>
              {showUserMenu && (
                <div className="z-50" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: C.surfaceContainerLowest, borderRadius: 10, border: `1px solid ${C.outlineVariant}40`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.outlineVariant}30` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{profile?.full_name || 'User'}</div>
                    <div style={{ fontSize: 11, color: C.onSurfaceVariant }}>{profile?.email || ''}</div>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); onProfileClick?.() }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.onSurface, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surfaceContainerLow)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    My Profile
                  </button>
                  <button
                    onClick={async () => { setShowUserMenu(false); await signOut(); navigate('/login') }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.tertiary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surfaceContainerLow)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div
            className="md:hidden"
            style={{
              background: C.surfaceContainerLowest,
              borderTop: `1px solid ${C.surfaceContainerHigh}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            {visibleLinks.map(link => (
              link.page === activePage ? (
                <div
                  key={link.page}
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px',
                    background: `${C.primary}10`,
                    borderLeft: `3px solid ${C.primary}`,
                    color: C.primary, fontWeight: 700, fontSize: 14,
                    cursor: 'default',
                  }}
                >
                  {link.label}
                </div>
              ) : (
                <Link
                  key={link.page}
                  to={link.to}
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px',
                    borderLeft: '3px solid transparent',
                    color: C.onSurfaceVariant, fontWeight: 500, fontSize: 14,
                    textDecoration: 'none', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.surfaceContainerLow }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {link.label}
                </Link>
              )
            ))}
            {showNewReport && (
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.surfaceContainerHigh}` }}>
                <Link
                  to="/daily-reports/new"
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '12px 0',
                    background: C.primary, color: '#fff',
                    borderRadius: 8, fontWeight: 700, fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  New Report
                </Link>
              </div>
            )}
            {onToggleSidebar && (
              <div style={{ padding: '0 20px 12px', borderTop: `1px solid ${C.surfaceContainerHigh}` }}>
                <button
                  onClick={() => { setMobileNavOpen(false); onToggleSidebar() }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '12px 0', marginTop: 12,
                    background: C.surfaceContainerHigh, color: C.onSurface,
                    border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
                  Site Locations
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile overlay to close nav */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ top: 'auto' }}
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </>
  )
}
