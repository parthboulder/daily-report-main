// ===== Add New Site Page =====
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { addProject } from '../lib/fieldOps'

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
  onPrimary: '#ffffff',
  onPrimaryContainer: '#B84E1D',
  tertiary: '#bb1b21',
}

export default function AddSite() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [superintendent, setSuperintendent] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const canSubmit = name.trim().length > 0 && code.trim().length >= 2 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    const result = await addProject({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      superintendent: superintendent.trim() || undefined,
      address: address.trim() || undefined,
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => navigate('/daily-reports'), 1500)
    } else {
      setError(result.error || 'Failed to add site')
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: C.onSurface,
    background: C.surfaceContainerLowest,
    border: `1.5px solid ${C.outlineVariant}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color 200ms',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: C.onSurfaceVariant,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 8,
  }

  if (success) {
    return (
      <div style={{ background: C.surface, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke={C.onPrimary} strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 24, color: C.onSurface, margin: '0 0 8px' }}>Site Added</h2>
          <p style={{ color: C.onSurfaceVariant, fontSize: 14 }}>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.surface, minHeight: '100vh', color: C.onSurface, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.surfaceContainerHigh}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="flex items-center justify-between px-6 md:px-10 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              to="/daily-reports"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: C.surfaceContainerHigh, border: 'none', cursor: 'pointer', textDecoration: 'none', color: C.onSurfaceVariant, transition: 'background 150ms' }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <img src="/boulder-logo.png" alt="Boulder" style={{ height: 48 }} />
          </div>
        </div>
      </header>

      {/* Form */}
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 30, color: C.onSurface, margin: '0 0 8px', letterSpacing: '-0.5px' }}>Add New Site</h1>
          <p style={{ color: C.onSurfaceVariant, fontSize: 15, margin: 0 }}>Register a new project location to start tracking daily reports.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ background: C.surfaceContainerLowest, borderRadius: 16, border: `1px solid ${C.outlineVariant}30`, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* Site Name */}
            <div>
              <label style={labelStyle}>Site / Project Name <span style={{ color: C.tertiary }}>*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Hampton Inn Stephenville"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = C.outlineVariant)}
                autoFocus
              />
            </div>

            {/* Site Code */}
            <div>
              <label style={labelStyle}>Site Code <span style={{ color: C.tertiary }}>*</span></label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="e.g. HIS"
                maxLength={6}
                style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = C.outlineVariant)}
              />
              <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '6px 0 0' }}>2-6 character unique identifier (letters & numbers only)</p>
            </div>

            {/* Superintendent */}
            <div>
              <label style={labelStyle}>Superintendent Name</label>
              <input
                type="text"
                value={superintendent}
                onChange={e => setSuperintendent(e.target.value)}
                placeholder="e.g. John Smith"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = C.outlineVariant)}
              />
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>Site Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, City, State"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.primary)}
                onBlur={e => (e.currentTarget.style.borderColor = C.outlineVariant)}
              />
            </div>

          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: C.tertiary, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Link
              to="/daily-reports"
              style={{
                padding: '14px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                background: C.surfaceContainerHigh, color: C.onSurfaceVariant, border: 'none', cursor: 'pointer',
                transition: 'background 150ms', display: 'inline-flex', alignItems: 'center',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: '14px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
                background: canSubmit ? C.primary : C.surfaceContainerHighest,
                color: canSubmit ? C.onPrimary : C.outlineVariant,
                transition: 'all 200ms', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: canSubmit ? `0 4px 16px ${C.primary}33` : 'none',
              }}
            >
              {submitting && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
                </svg>
              )}
              {submitting ? 'Adding Site...' : 'Add Site'}
            </button>
          </div>
        </form>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}
