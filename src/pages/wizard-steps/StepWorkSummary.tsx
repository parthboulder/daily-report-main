import { useState, useEffect, useRef, useCallback } from 'react'
import { type DSRDraft } from '../../lib/fieldOps'
import { C, StepHeader } from './shared'

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
const speechSupported = !!SpeechRecognition

function VoiceButton({ onAppend }: { fieldKey: string; currentValue: string; onAppend: (text: string) => void }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!speechSupported) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = true

    recognition.onresult = (e: any) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript
      }
      if (transcript) onAppend(transcript)
    }
    recognition.onerror = () => stop()
    recognition.onend = () => setListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }, [onAppend, stop])

  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  if (!speechSupported) return null

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      title={listening ? 'Stop dictation' : 'Start voice dictation'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 20,
        border: listening ? '1.5px solid ' + C.tertiary : '1.5px solid ' + C.outlineVariant,
        background: listening ? 'rgba(187,27,33,0.08)' : C.surfaceContainerLowest,
        color: listening ? C.tertiary : C.onSurfaceVariant,
        cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'Manrope, sans-serif',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        transition: 'all 150ms',
      }}
    >
      {listening ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      )}
      {listening ? 'Listening…' : 'Dictate'}
    </button>
  )
}

export default function StepWorkSummary({ draft, update, stepNumber, totalSteps }: { draft: DSRDraft; update: (u: Partial<DSRDraft>) => void; stepNumber: number; totalSteps: number }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  const fields = [
    { key: 'work_completed', label: 'Work Completed Today', required: true, placeholder: 'Describe tasks finalized today...' },
    { key: 'work_in_progress', label: 'Work in Progress', required: false, placeholder: 'Detail ongoing activities and status...' },
    { key: 'work_planned_tomorrow', label: 'Work Planned Tomorrow', required: false, placeholder: 'Outline scheduled goals for the next shift...' },
  ]

  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto' }}>
      <StepHeader title="Work Summary" description="Document completed, in-progress, and planned work for the current reporting period." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* Pulse animation for mic */}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>

      {/* Form Card */}
      <div style={{ background: C.surfaceContainerLow, padding: 32, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {fields.map(({ key, label, required, placeholder }) => {
          const value = draft[key as keyof DSRDraft] as string
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: C.onSurface, fontFamily: 'Manrope, sans-serif' }}>
                  {label}
                  {required && <span style={{ color: C.tertiary, marginLeft: 4 }}>*</span>}
                </label>
                <VoiceButton
                  fieldKey={key}
                  currentValue={value}
                  onAppend={(text) => {
                    const current = (draft[key as keyof DSRDraft] as string) || ''
                    const separator = current && !current.endsWith(' ') ? ' ' : ''
                    update({ [key]: current + separator + text })
                  }}
                />
              </div>
              <textarea
                value={value}
                onChange={(e) => update({ [key]: e.target.value })}
                placeholder={placeholder}
                rows={4}
                style={{
                  width: '100%', borderRadius: 8, padding: 16, fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  border: 'none', background: C.surfaceContainerLowest, color: C.onSurface,
                  resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
                  transition: 'box-shadow 150ms',
                }}
                onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px rgba(232,120,58,0.4)`)}
                onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
              />
            </div>
          )
        })}
      </div>

      {/* Auxiliary Data Row (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
        {/* Site Weather */}
        <div style={{ background: C.surfaceContainer, borderRadius: 8, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ background: C.primaryFixed, padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.onPrimaryContainer }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Site Weather</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, color: C.onSurface }}>
              {draft.weather_temp !== '' ? `${draft.weather_temp}°F` : '—'} — {draft.weather_conditions || 'Not set'}
            </div>
            <div style={{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 }}>From Weather &amp; Basics step</div>
          </div>
        </div>

        {/* Session Duration */}
        <div style={{ background: C.surfaceContainer, borderRadius: 8, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ background: '#cfe6f2', padding: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#40555f' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Session Duration</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, color: C.onSurface }}>
              {mins}m {secs.toString().padStart(2, '0')}s
            </div>
            <div style={{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 }}>Auto-saving active</div>
          </div>
        </div>
      </div>
    </div>
  )
}
