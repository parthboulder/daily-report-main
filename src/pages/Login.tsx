import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'


export default function Login() {
  const { user, loading, signIn, signInWithMicrosoft, lockoutUntil } = useAuth()
  const [microsoftLoading, setMicrosoftLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [lockoutSeconds, setLockoutSeconds] = useState(0)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) { setLockoutSeconds(0); return }

    function tick() {
      const remaining = Math.max(0, Math.ceil((lockoutUntil! - Date.now()) / 1000))
      setLockoutSeconds(remaining)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const isLockedOut = lockoutSeconds > 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f9f6', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 24, border: '2.5px solid #E8783A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12, color: '#5a615c' }}>Loading...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (user) return <Navigate to="/daily-reports" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLockedOut) return
    setError(null)
    setSubmitting(true)
    const { error: err } = await signIn(email, password)
    if (err) setError(err)
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9f9f6', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ===== Top Bar ===== */}
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: 'rgba(249,249,246,0.8)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/boulder-logo.png" alt="Boulder Companies" style={{ height: 36 }} />
          </div>
          <a
            href="mailto:support@bouldercompanies.com"
            style={{ color: '#5a615c', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}
          >
            Support
          </a>
        </div>
        <div style={{ height: 1, background: '#ecefea', width: '100%' }} />
      </header>

      {/* ===== Main Content ===== */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 24px 48px', position: 'relative', overflow: 'hidden' }}>

        {/* Abstract background blobs */}
        <div style={{ position: 'absolute', top: '25%', left: -80, width: 384, height: 384, background: 'rgba(232,120,58,0.06)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: -80, width: 320, height: 320, background: 'rgba(232,120,58,0.04)', borderRadius: '50%', filter: 'blur(60px)' }} />

        {/* ===== Auth Card (Dark) ===== */}
        <div style={{
          width: '100%', maxWidth: 448, background: '#0d0f0d', borderRadius: 12, padding: '40px 40px 36px',
          boxShadow: '0 32px 64px -12px rgba(13,15,13,0.14)', position: 'relative', zIndex: 10,
        }}>

          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <img src="/boulder-logo.png" alt="Boulder Companies" style={{ height: 48, margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#F5C4A8', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>
              Daily Site Reports
            </p>
          </div>

          {/* ===== Lockout Banner ===== */}
          {isLockedOut && (
            <div style={{
              background: 'rgba(187,27,33,0.12)', border: '1px solid rgba(187,27,33,0.25)', borderRadius: 8,
              padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fe4e49" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fe4e49' }}>Account temporarily locked</div>
                <div style={{ fontSize: 11, color: 'rgba(254,78,73,0.7)', marginTop: 2 }}>
                  Too many failed attempts. Try again in {lockoutSeconds}s
                </div>
              </div>
            </div>
          )}

          {/* ===== Login Form ===== */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: isLockedOut ? 0.5 : 1, pointerEvents: isLockedOut ? 'none' : 'auto' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(173,179,174,0.6)', fontWeight: 700, marginBottom: 8, paddingLeft: 4, fontFamily: 'Inter, sans-serif' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@bouldercompanies.com"
                autoComplete="email"
                style={{
                  width: '100%', background: 'rgba(46,52,48,0.3)', border: 'none', borderRadius: 8,
                  padding: '16px 20px', color: '#f9f9f6', fontSize: 14, outline: 'none',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)' }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(173,179,174,0.6)', fontWeight: 700, marginBottom: 8, paddingLeft: 4, fontFamily: 'Inter, sans-serif' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', background: 'rgba(46,52,48,0.3)', border: 'none', borderRadius: 8,
                    padding: '16px 48px 16px 20px', color: '#f9f9f6', fontSize: 14, outline: 'none',
                    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)' }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#adb3ae', padding: 0, display: 'flex' }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 14, height: 14, borderRadius: 3, accentColor: '#E8783A' }}
                />
                <span style={{ fontSize: 12, color: '#adb3ae', fontFamily: 'Inter, sans-serif' }}>Keep me signed in</span>
              </label>
              <span
                onClick={() => { setShowForgot(true); setForgotSent(false); setForgotEmail(email || '') }}
                style={{ fontSize: 12, color: '#F5C4A8', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Forgot access?
              </span>
            </div>

            {/* Error */}
            {error && !isLockedOut && (
              <div style={{
                fontSize: 12, borderRadius: 8, padding: '10px 14px',
                background: 'rgba(187,27,33,0.15)', color: '#fe4e49', border: '1px solid rgba(187,27,33,0.3)',
                fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
                </svg>
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={submitting || isLockedOut}
              style={{
                width: '100%', background: isLockedOut ? '#333' : '#E8783A', color: isLockedOut ? '#666' : '#FFF3EC',
                fontFamily: 'Manrope, sans-serif', fontWeight: 700, padding: '16px 0', borderRadius: 8,
                border: 'none', cursor: (submitting || isLockedOut) ? 'not-allowed' : 'pointer',
                fontSize: 15, marginTop: 4, opacity: submitting ? 0.6 : 1,
                boxShadow: isLockedOut ? 'none' : '0 4px 16px rgba(232,120,58,0.25)', transition: 'all 150ms',
              }}
              onMouseEnter={(e) => { if (!submitting && !isLockedOut) e.currentTarget.style.background = '#D06A30' }}
              onMouseLeave={(e) => { if (!isLockedOut) e.currentTarget.style.background = '#E8783A' }}
            >
              {isLockedOut ? `Locked (${lockoutSeconds}s)` : submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* ===== Security Badge ===== */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#adb3ae" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span style={{ fontSize: 9, color: 'rgba(173,179,174,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
              Secured with HTTPS &amp; bcrypt
            </span>
          </div>

          {/* ===== Divider ===== */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(46,52,48,0.5)' }} />
            <span style={{ margin: '0 16px', fontSize: 10, fontWeight: 700, color: 'rgba(173,179,174,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(46,52,48,0.5)' }} />
          </div>

          {/* ===== Sign in with Microsoft ===== */}
          <button
            onClick={async () => {
              setMicrosoftLoading(true)
              const { error: err } = await signInWithMicrosoft()
              if (err) { setError(err); setMicrosoftLoading(false) }
            }}
            disabled={microsoftLoading || isLockedOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 0', borderRadius: 8, border: '1px solid rgba(46,52,48,0.5)',
              background: microsoftLoading ? 'rgba(46,52,48,0.4)' : 'rgba(46,52,48,0.3)',
              color: '#f9f9f6', fontWeight: 600, fontSize: 14, cursor: (microsoftLoading || isLockedOut) ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', transition: 'all 150ms', boxSizing: 'border-box',
              opacity: isLockedOut ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!microsoftLoading && !isLockedOut) e.currentTarget.style.background = 'rgba(46,52,48,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(46,52,48,0.3)' }}
          >
            {microsoftLoading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Redirecting...
              </>
            ) : (
              <>
                {/* Microsoft logo */}
                <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                  <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
                  <rect x="11" y="0" width="10" height="10" fill="#7FBA00"/>
                  <rect x="0" y="11" width="10" height="10" fill="#00A4EF"/>
                  <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>
          <p style={{ fontSize: 10, color: 'rgba(173,179,174,0.4)', textAlign: 'center', marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
            Boulder Construction accounts only
          </p>

          {/* ===== Divider 2 ===== */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(46,52,48,0.5)' }} />
            <span style={{ margin: '0 16px', fontSize: 10, fontWeight: 700, color: 'rgba(173,179,174,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Inter, sans-serif' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(46,52,48,0.5)' }} />
          </div>

          {/* ===== New Report + Request Access ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              to="/daily-reports/new"
              style={{
                width: '100%', background: 'rgba(46,52,48,0.3)', color: '#f9f9f6', fontFamily: 'Inter, sans-serif',
                fontWeight: 500, padding: '14px 0', borderRadius: 8, border: '1px solid rgba(46,52,48,0.5)',
                fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, boxSizing: 'border-box', transition: 'all 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(46,52,48,0.5)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(46,52,48,0.3)' }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              New Report
            </Link>
            <button
              style={{
                width: '100%', background: 'transparent', color: '#adb3ae', fontFamily: 'Inter, sans-serif',
                fontWeight: 500, padding: '8px 0', border: 'none', fontSize: 12, cursor: 'pointer',
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f9f9f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#adb3ae' }}
            >
              Request System Access
            </button>
          </div>
        </div>

        {/* ===== Forgot Access Modal ===== */}
        {showForgot && (
          <>
            <div
              onClick={() => setShowForgot(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }}
            />
            <div style={{
              position: 'fixed', zIndex: 70, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 400, background: '#0d0f0d', borderRadius: 12, padding: '32px 32px 28px',
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
            }}>
              {/* Close */}
              <button
                onClick={() => setShowForgot(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#adb3ae', padding: 4, display: 'flex' }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {forgotSent ? (
                /* Success state */
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: '#f9f9f6', margin: '0 0 8px' }}>Request Sent</h3>
                  <p style={{ fontSize: 13, color: '#adb3ae', margin: '0 0 6px', lineHeight: 1.5 }}>
                    Your password reset request has been sent to the administrator.
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(173,179,174,0.6)', margin: '0 0 24px' }}>
                    Smit will reset your password and get back to you.
                  </p>
                  <button
                    onClick={() => setShowForgot(false)}
                    style={{ width: '100%', padding: '12px 0', borderRadius: 8, background: '#E8783A', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Manrope, sans-serif' }}
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                /* Form state */
                <>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: '#f9f9f6', margin: '0 0 8px' }}>Forgot Access?</h3>
                    <p style={{ fontSize: 13, color: '#adb3ae', margin: 0, lineHeight: 1.5 }}>
                      Enter your email and we'll notify the admin to reset your password.
                    </p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(173,179,174,0.6)', fontWeight: 700, marginBottom: 8, paddingLeft: 4, fontFamily: 'Inter, sans-serif' }}>
                      Your Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@bouldercompanies.com"
                      style={{
                        width: '100%', background: 'rgba(46,52,48,0.3)', border: 'none', borderRadius: 8,
                        padding: '14px 18px', color: '#f9f9f6', fontSize: 14, outline: 'none',
                        fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)' }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>

                  {forgotError && (
                    <div style={{ fontSize: 12, borderRadius: 8, padding: '10px 14px', marginBottom: 12, background: 'rgba(187,27,33,0.15)', color: '#fe4e49', border: '1px solid rgba(187,27,33,0.3)' }}>
                      {forgotError}
                    </div>
                  )}

                  <button
                    disabled={!forgotEmail || forgotSending}
                    onClick={async () => {
                      setForgotSending(true)
                      setForgotError(null)
                      try {
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
                        const resp = await fetch(`${supabaseUrl}/functions/v1/send-reset-request`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseAnonKey}`,
                            'apikey': supabaseAnonKey,
                          },
                          body: JSON.stringify({ userEmail: forgotEmail }),
                        })
                        const json = await resp.json()
                        if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`)
                        setForgotSent(true)
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : 'Failed to send request. Please try again.'
                        setForgotError(msg)
                      }
                      setForgotSending(false)
                    }}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 8, border: 'none',
                      cursor: (!forgotEmail || forgotSending) ? 'not-allowed' : 'pointer',
                      background: (!forgotEmail || forgotSending) ? '#333' : '#E8783A',
                      color: (!forgotEmail || forgotSending) ? '#666' : '#fff',
                      fontWeight: 700, fontSize: 14, fontFamily: 'Manrope, sans-serif',
                      boxShadow: forgotEmail ? '0 4px 16px rgba(232,120,58,0.25)' : 'none',
                      transition: 'all 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {forgotSending ? (
                      <>
                        <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Send Request to Admin
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: 11, color: 'rgba(173,179,174,0.4)', textAlign: 'center', marginTop: 16 }}>
                    An email will be sent directly to the administrator.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* ===== Footer ===== */}
      <footer style={{ width: '100%', padding: '24px 40px', background: '#f9f9f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#5a615c' }}>
            Boulder Companies. Daily Site Reports.
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service'].map((label) => (
              <span key={label} style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#5a615c', cursor: 'pointer' }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(90,97,92,0.4) !important; }
      `}</style>
    </div>
  )
}
