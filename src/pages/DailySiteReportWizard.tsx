// ===== Daily Site Report Wizard — FieldWorks Pro / Stitch Design =====
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, WifiOff, Loader2,
} from 'lucide-react'
import {
  type DSRDraft, type PhotoDraft,
  emptyDraft, saveDraft, loadDraft, clearDraft,
  fetchProjects, fetchActiveTradesForProject,
  submitDSR, enqueueOfflineSubmission, processOfflineQueue,
  getOfflineQueueLength,
} from '../lib/fieldOps'
import { useAuth, filterByAccess } from '../lib/AuthContext'
import { C } from './wizard-steps/shared'
import StepWeather from './wizard-steps/StepWeather'
import StepManpower from './wizard-steps/StepManpower'
import StepWorkSummary from './wizard-steps/StepWorkSummary'
import StepDeliveries from './wizard-steps/StepDeliveries'
import StepIssues from './wizard-steps/StepIssues'
import StepPhotos from './wizard-steps/StepPhotos'
import StepReview from './wizard-steps/StepReview'

const STEPS = ['Weather', 'Manpower', 'Summary', 'Deliveries', 'Issues', 'Photos', 'Submit']
const TODAY = new Date().toISOString().split('T')[0]

const STEP_ICONS: Record<string, React.ReactNode> = {
  Weather: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </svg>
  ),
  Manpower: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
  Summary: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
  ),
  Deliveries: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  ),
  Issues: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
  Photos: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 12.5c-1.24 0-2.25 1.01-2.25 2.25S10.76 17 12 17s2.25-1.01 2.25-2.25S13.24 12.5 12 12.5zm0-8.5L9.74 6.5H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8.5c0-1.1-.9-2-2-2h-4.74L12 4zm0 13c-1.93 0-3.5-1.57-3.5-3.5S10.07 10 12 10s3.5 1.57 3.5 3.5S13.93 17 12 17zm-6.5-9h-2v-2h2v2z"/>
    </svg>
  ),
  Submit: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
  ),
}

const NEXT_STEP_LABELS: Record<number, string> = {
  0: 'Continue to Manpower',
  1: 'Continue to Summary',
  2: 'Continue to Deliveries',
  3: 'Continue to Issues',
  4: 'Continue to Photos',
  5: 'Continue to Submit',
}

export default function DailySiteReportWizard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<DSRDraft>(() => {
    const saved = loadDraft()
    if (saved && saved.date === TODAY) return saved
    return emptyDraft(TODAY)
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueued, setOfflineQueued] = useState(getOfflineQueueLength())
  const [projects, setProjects] = useState<{ id: number; name: string; code: string }[]>([])
  const [loadingTrades, setLoadingTrades] = useState(false)
  const DEFAULT_TRADES = [
    'Concrete', 'Rebar', 'Formwork', 'Framing (Wood / Metal)', 'Masonry (CMU / Brick)',
    'Structural Steel', 'Plumbing', 'Electrical', 'HVAC', 'Fire Sprinkler',
    'Low Voltage', 'Roofing', 'Waterproofing', 'Insulation', 'Stucco / EIFS',
    'Windows / Storefront', 'Drywall', 'Painting', 'Ceiling (ACT / Gyp)',
    'Flooring (Tile / Carpet / LVT)', 'Millwork / Casework', 'Trim / Carpentry',
    'Doors, Frames & Hardware', 'Shower Enclosures', 'Tile (Shower Surround)',
    'Bathroom Accessories', 'FF&E Installation', 'Appliance Installation',
    'Elevators', 'Site Work', 'Landscaping', 'Paving / Asphalt', 'Utilities',
  ]
  const [availableTrades, setAvailableTrades] = useState<string[]>(DEFAULT_TRADES)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; reportId?: number; error?: string } | null>(null)
  const [, setDraftSaved] = useState(false)
  const [addTradeInput, setAddTradeInput] = useState('')
  const [, setAddTradeFocused] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true)
      await processOfflineQueue(profile?.id || null)
      setOfflineQueued(getOfflineQueueLength())
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [profile])

  useEffect(() => { fetchProjects().then(all => setProjects(filterByAccess(all, profile))) }, [profile])

  useEffect(() => {
    if (!draft.project_code) return
    setLoadingTrades(true)
    fetchActiveTradesForProject(draft.project_code).then((trades) => {
      setAvailableTrades([...new Set([...trades, ...DEFAULT_TRADES])])
      setLoadingTrades(false)
    })
  }, [draft.project_code])

  const updateDraft = useCallback((updates: Partial<DSRDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...updates }
      saveDraft(next)
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
      return next
    })
  }, [])

  const goToStep = (step: number) => updateDraft({ step })
  const nextStep = () => goToStep(Math.min(draft.step + 1, STEPS.length - 1))
  const prevStep = () => goToStep(Math.max(draft.step - 1, 0))

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const newPhoto: PhotoDraft = { id: `${Date.now()}-${Math.random()}`, dataUrl, caption: '' }
        setDraft((prev) => { const updated = { ...prev, photos: [...prev.photos, newPhoto] }; saveDraft(updated); return updated })
      }
      reader.readAsDataURL(file)
    }
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    if (!isOnline) {
      enqueueOfflineSubmission(draft)
      setOfflineQueued((q) => q + 1)
      clearDraft()
      setSubmitting(false)
      setSubmitResult({ success: true })
      return
    }
    const result = await submitDSR(draft, profile?.id?.toString() || null)
    setSubmitting(false)
    setSubmitResult(result)
    if (result.success) clearDraft()
  }

  const canProceed = (): boolean => {
    switch (draft.step) {
      case 0: return !!draft.project_code && !!draft.weather_conditions
      case 1: return draft.manpower.length > 0
      case 2: return draft.work_completed.trim().length > 0
      default: return true
    }
  }

  const currentProject = projects.find(p => p.code === draft.project_code)

  if (submitResult && !submitResult.success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center', background: C.surfaceContainerLow, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: C.onSurface, marginBottom: 8 }}>Submission Failed</h2>
        <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 4, maxWidth: 400 }}>{submitResult.error || 'An unknown error occurred'}</p>
        <p style={{ fontSize: 12, color: C.onSurfaceVariant, marginBottom: 24 }}>Your draft has been preserved. You can try again.</p>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
          <button onClick={() => setSubmitResult(null)} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Try Again</button>
          <button onClick={() => navigate('/daily-reports')} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.surfaceContainerHigh, color: C.onSurface, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (submitResult?.success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center', background: C.surfaceContainerLow, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Check size={40} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 22, fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: C.onSurface, marginBottom: 8 }}>Report Submitted</h2>
        <p style={{ fontSize: 15, color: C.onSurfaceVariant, marginBottom: 4 }}>
          {draft.project_code} — {new Date(draft.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {!isOnline && <p style={{ fontSize: 13, marginTop: 8, padding: '8px 16px', borderRadius: 8, background: '#fef9c3', color: '#854d0e' }}>Saved offline — will sync when connected</p>}
        {isOnline && submitResult.reportId && <p style={{ fontSize: 13, marginTop: 8, color: C.onSurfaceVariant }}>Report #{submitResult.reportId}</p>}
        <div style={{ display: 'flex', gap: 12, marginTop: 32, width: '100%', maxWidth: 320 }}>
          {isOnline && submitResult.reportId && (
            <button onClick={() => navigate(`/daily-reports/${submitResult.reportId}`)} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.surfaceContainerHigh, color: C.primary, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>View Report</button>
          )}
          <button onClick={() => navigate('/daily-reports')} style={{ flex: 1, padding: 12, borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    )
  }


  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: 'Inter, sans-serif' }}>

      {/* ===== Fixed Top Nav ===== */}
      <nav className="px-3 md:px-8" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(249,249,246,0.92)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${C.surfaceContainerHigh}` }}>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={C.onSurface}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <img src="/boulder-logo.png" alt="Boulder" className="h-7 md:h-12" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {!isOnline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fef9c3', borderRadius: 20, fontSize: 12, color: '#854d0e', fontWeight: 600 }}>
              <WifiOff size={14} />Offline{offlineQueued > 0 ? ` · ${offlineQueued} queued` : ''}
            </div>
          )}
          {/* account avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 20, border: `1px solid ${C.surfaceContainerHigh}` }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{(profile?.full_name || 'U')[0].toUpperCase()}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== Mobile Overlay ===== */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />}

      {/* ===== Fixed Left Sidebar ===== */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 fixed z-50 flex`} style={{ top: 0, left: 0, width: 256, height: '100vh', background: C.surface, flexDirection: 'column', paddingTop: 80 }}>
        {/* Project info */}
        <div style={{ padding: '0 24px', marginBottom: 32 }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: '#E8783A' }}>
            {currentProject ? `Project #${currentProject.code}` : 'No project'}
          </div>
          <div style={{ fontSize: 12, color: C.onSurfaceVariant, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
            Step {draft.step + 1} of {STEPS.length}
          </div>
        </div>

        {/* Step navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', fontSize: 14, fontWeight: 500 }}>
          {STEPS.map((label, i) => {
            const active = i === draft.step
            return (
              <button
                key={label}
                type="button"
                onClick={() => { if (i <= draft.step) { goToStep(i); setSidebarOpen(false) } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 24px', border: 'none',
                  borderRight: active ? '4px solid #E8783A' : '4px solid transparent',
                  cursor: i <= draft.step ? 'pointer' : 'default',
                  color: active ? '#E8783A' : C.onSurfaceVariant,
                  fontWeight: active ? 700 : 500, fontSize: 14,
                  opacity: i > draft.step ? 0.45 : 1,
                  background: active ? C.surfaceContainer : 'transparent',
                  transition: 'all 150ms',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!active && i <= draft.step) (e.currentTarget as HTMLButtonElement).style.background = `${C.surfaceContainer}80` }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <span style={{ display: 'flex', opacity: active ? 1 : 0.6 }}>{STEP_ICONS[label]}</span>
                {label}
              </button>
            )
          })}
        </nav>

        {/* Sidebar bottom links */}
        <div style={{ borderTop: `1px solid ${C.outlineVariant}20`, padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', background: 'none', border: 'none', color: C.onSurfaceVariant, fontSize: 14, cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
            Support
          </button>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', background: 'none', border: 'none', color: C.onSurfaceVariant, fontSize: 14, cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
            Archive
          </button>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="pt-20 pb-36" style={{ minHeight: '100vh' }}>
        {draft.step === 0 && <StepWeather draft={draft} update={updateDraft} projects={projects} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
        {draft.step === 1 && <StepManpower draft={draft} update={updateDraft} loadingTrades={loadingTrades} availableTrades={availableTrades} setAvailableTrades={setAvailableTrades} addTradeInput={addTradeInput} setAddTradeInput={setAddTradeInput} setAddTradeFocused={setAddTradeFocused} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
        {draft.step === 2 && <StepWorkSummary draft={draft} update={updateDraft} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
        {draft.step === 3 && <StepDeliveries draft={draft} update={updateDraft} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
        {draft.step === 4 && <StepIssues draft={draft} update={updateDraft} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
        {draft.step === 5 && <StepPhotos draft={draft} photoInputRef={photoInputRef} onCapture={handlePhotoCapture} onRemove={(id) => updateDraft({ photos: draft.photos.filter((p) => p.id !== id) })} onCaption={(id, caption) => updateDraft({ photos: draft.photos.map((p) => (p.id === id ? { ...p, caption } : p)) })} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
        {draft.step === 6 && <StepReview draft={draft} goToStep={goToStep} projects={projects} superintendentName={profile?.full_name} stepNumber={draft.step + 1} totalSteps={STEPS.length} />}
      </main>

      {/* ===== Fixed Bottom Action Bar ===== */}
      <footer className="px-3 md:px-8 lg:px-12" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: `${C.surfaceContainerLowest}cc`, backdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, paddingTop: 10, paddingBottom: 10 }}>
        <button
          type="button"
          onClick={() => saveDraft(draft)}
          className="flex text-xs md:text-sm"
          style={{ alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: C.primary, fontWeight: 700, cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
          Save
        </button>
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {draft.step > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="text-xs md:text-sm px-3 md:px-5 py-2 md:py-3"
              style={{ borderRadius: 8, border: 'none', background: 'transparent', color: C.onSurfaceVariant, fontWeight: 700, cursor: 'pointer' }}
            >
              Previous
            </button>
          )}
          {draft.step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="text-xs md:text-sm px-4 md:px-7 py-2.5 md:py-3"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: 'none', background: canProceed() ? C.primary : C.surfaceContainerHigh, color: canProceed() ? C.onPrimary : C.onSurfaceVariant, fontFamily: 'Manrope, sans-serif', fontWeight: 700, cursor: canProceed() ? 'pointer' : 'default', boxShadow: canProceed() ? '0 4px 16px rgba(232,120,58,0.2)' : 'none', whiteSpace: 'nowrap' }}
            >
              {NEXT_STEP_LABELS[draft.step] || 'Continue'}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="text-xs md:text-sm px-4 md:px-7 py-2.5 md:py-3"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, border: 'none', background: submitting ? C.primaryFixed : C.primary, color: submitting ? C.onPrimaryContainer : C.onPrimary, fontFamily: 'Manrope, sans-serif', fontWeight: 700, cursor: submitting ? 'default' : 'pointer', boxShadow: '0 4px 16px rgba(232,120,58,0.2)' }}
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><Check size={14} /> Submit</>}
            </button>
          )}
        </div>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
