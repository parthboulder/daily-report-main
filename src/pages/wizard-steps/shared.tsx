// Shared constants, types, and components for wizard steps
import { Plus, Minus } from 'lucide-react'

export const C = {
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
  secondary: '#4d626c',
  tertiary: '#bb1b21',
}

export function StepHeader({ title, description, stepNumber, totalSteps }: { title: string; description: string; stepNumber: number; totalSteps: number }) {
  return (
    <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="text-2xl md:text-[30px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: C.onSurface, margin: '0 0 8px', letterSpacing: '-0.5px' }}>{title}</h1>
        <p className="text-sm md:text-[15px]" style={{ color: C.onSurfaceVariant, margin: 0 }}>{description}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 14, color: C.primary }}>Step {stepNumber} of {totalSteps}</span>
        <div style={{ width: 100, height: 4, background: C.surfaceContainerHigh, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${(stepNumber / totalSteps) * 100}%`, height: '100%', background: C.primary, borderRadius: 2 }} />
        </div>
      </div>
    </header>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', color: C.onSurfaceVariant, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
      {children}
    </label>
  )
}

export function InfoBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: '12px 16px', background: '#E8F2FE', border: '1px solid #B3D9F2', borderRadius: 8, fontSize: 13, color: '#185ABC', fontWeight: 500, marginBottom: 20 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        {message}
      </span>
    </div>
  )
}

export function Toggle({ value, onChange, label, sublabel }: { value: boolean; onChange: (v: boolean) => void; label?: string; sublabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {(label || sublabel) && (
        <div>
          {label && <h4 style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Manrope, sans-serif', color: C.onSurface, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</h4>}
          {sublabel && <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '2px 0 0' }}>{sublabel}</p>}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          position: 'relative', width: 56, height: 32, borderRadius: 16, border: 'none', cursor: 'pointer',
          background: value ? C.primary : C.surfaceContainerHighest, transition: 'background 200ms',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 4, width: 24, height: 24, borderRadius: '50%', background: '#fff',
          transition: 'left 200ms', left: value ? 'calc(100% - 28px)' : 4,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

export function CountStepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 44, height: 44, borderRadius: 8, background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <Minus size={16} color={C.onSurfaceVariant} />
      </button>
      <span style={{ fontSize: 20, fontWeight: 700, width: 40, textAlign: 'center', color: C.onSurface }}>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} style={{ width: 44, height: 44, borderRadius: 8, background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <Plus size={16} color={C.onSurfaceVariant} />
      </button>
    </div>
  )
}
