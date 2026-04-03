import { type DSRDraft, type IssueCategory, type IssueDraft, type InspectionDraftItem } from '../../lib/fieldOps'
import { C, Toggle, CountStepper, StepHeader } from './shared'

const ISSUE_CATEGORIES: { value: IssueCategory; icon: React.ReactNode }[] = [
  {
    value: 'Weather',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>,
  },
  {
    value: 'Permits',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
  },
  {
    value: 'Labor',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  },
  {
    value: 'Supply Chain',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/></svg>,
  },
  {
    value: 'Quality',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-10 5h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
  },
  {
    value: 'Other',
    icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
  },
]

const INSPECTION_TYPES = [
  'Structural Framing', 'Rough-in Plumbing', 'Rough-in Electrical', 'HVAC Rough',
  'Fire Safety', 'Foundation Wall', 'Insulation', 'Drywall',
  'Final Electrical', 'Final Plumbing', 'Final HVAC', 'Final Building',
  'Fire Final', 'Special Inspection', 'City Inspection', 'Elevator',
]

export default function StepIssues({ draft, update, stepNumber, totalSteps }: { draft: DSRDraft; update: (u: Partial<DSRDraft>) => void; stepNumber: number; totalSteps: number }) {
  const updateIssue = (idx: number, changes: Partial<IssueDraft>) => {
    update({ issues: draft.issues.map((is, i) => (i === idx ? { ...is, ...changes } : is)) })
  }
  const updateInspection = (idx: number, changes: Partial<InspectionDraftItem>) => {
    update({ inspections: draft.inspections.map((insp, i) => (i === idx ? { ...insp, ...changes } : insp)) })
  }

  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StepHeader title="Issues & Inspections" description="Record blockers, deficiencies, and inspection results." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* ─── Issues Toggle ─── */}
      <div style={{ background: C.surfaceContainer, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, margin: 0 }}>Any issues or delays today?</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle value={draft.has_issues} onChange={(v) => update({ has_issues: v })} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{draft.has_issues ? 'YES' : 'NO'}</span>
        </div>
      </div>

      {/* ─── Issue Cards ─── */}
      {draft.has_issues && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {draft.issues.map((issue, idx) => (
            <div key={idx} className="p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid rgba(173,179,174,0.15)` }}>
              {/* Issue Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', background: C.tertiary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
                  }}>{String(idx + 1).padStart(2, '0')}</span>
                  <h4 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Issue #{idx + 1}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => update({ issues: draft.issues.filter((_, i) => i !== idx) })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.tertiary)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>

              {/* Category Grid */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, marginTop: 0 }}>Select Category</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {ISSUE_CATEGORIES.map(({ value, icon }) => {
                    const active = issue.category === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateIssue(idx, { category: value })}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '12px 4px', borderRadius: 8, cursor: 'pointer',
                          background: active ? C.tertiary : C.surfaceContainerLowest,
                          border: `1px solid ${active ? C.tertiary : 'rgba(173,179,174,0.2)'}`,
                          color: active ? '#fff' : C.onSurfaceVariant,
                          boxShadow: active ? '0 4px 12px rgba(187,27,33,0.2)' : 'none',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surfaceContainer }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = C.surfaceContainerLowest }}
                      >
                        <span style={{ marginBottom: 4, display: 'flex' }}>{icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{value}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Description of the issue</label>
                <textarea
                  value={issue.description}
                  onChange={(e) => updateIssue(idx, { description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  style={{
                    width: '100%', borderRadius: 8, padding: 16, fontSize: 14,
                    border: 'none', background: C.surfaceContainerHighest, color: C.onSurface,
                    resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
                    transition: 'box-shadow 150ms',
                  }}
                  onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
                  onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                />
              </div>

              {/* Schedule Impact + Trade */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 16,
                padding: '20px 0', borderTop: `1px solid rgba(173,179,174,0.1)`, borderBottom: `1px solid rgba(173,179,174,0.1)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Did this delay the schedule?</span>
                    <Toggle value={issue.schedule_impact} onChange={(v) => updateIssue(idx, { schedule_impact: v })} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Trade affected (optional)</label>
                    <input
                      type="text"
                      value={issue.trade}
                      onChange={(e) => updateIssue(idx, { trade: e.target.value })}
                      placeholder="e.g. Electrical, Plumbing"
                      style={{
                        width: '100%', borderRadius: 8, padding: '10px 16px', fontSize: 14,
                        border: 'none', background: C.surfaceContainer, color: C.onSurface,
                        outline: 'none', boxSizing: 'border-box', transition: 'box-shadow 150ms',
                      }}
                      onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
                      onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                    />
                  </div>
                </div>
                {issue.schedule_impact && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef9c3', padding: '12px 16px', borderRadius: 8, border: '1.5px solid #fde68a' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Days of impact</span>
                    <CountStepper value={issue.schedule_impact_days} onChange={(v) => updateIssue(idx, { schedule_impact_days: v })} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Issue Button */}
          <button
            type="button"
            onClick={() => update({ issues: [...draft.issues, { category: 'Other', description: '', schedule_impact: false, schedule_impact_days: 0, trade: '' }] })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.primary, fontSize: 14, fontWeight: 700, padding: '8px 0',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            Add Another Issue
          </button>
        </div>
      )}

      {/* ─── Inspections Toggle ─── */}
      <div style={{ background: C.surfaceContainer, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, margin: 0 }}>Any inspections today?</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle value={draft.has_inspections} onChange={(v) => update({ has_inspections: v })} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{draft.has_inspections ? 'YES' : 'NO'}</span>
        </div>
      </div>

      {/* ─── Inspection Cards ─── */}
      {draft.has_inspections && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {draft.inspections.map((insp, idx) => (
            <div key={idx} className="p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid rgba(173,179,174,0.15)` }}>
              {/* Inspection Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', background: C.primaryFixed,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.onPrimaryContainer, fontWeight: 700, fontSize: 11, flexShrink: 0,
                  }}>{String(idx + 1).padStart(2, '0')}</span>
                  <h4 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Inspection #{idx + 1}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => update({ inspections: draft.inspections.filter((_, i) => i !== idx) })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.tertiary)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>

              {/* Type + Result Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6">
                {/* Type Select */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Select Type</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={insp.type}
                      onChange={(e) => updateInspection(idx, { type: e.target.value })}
                      style={{
                        width: '100%', borderRadius: 8, padding: '14px 40px 14px 16px', fontSize: 14,
                        border: 'none', background: C.surfaceContainerHighest, color: C.onSurface,
                        outline: 'none', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
                        transition: 'box-shadow 150ms',
                      }}
                      onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
                      onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <option value="">Select type...</option>
                      {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={C.onSurfaceVariant} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M7 10l5 5 5-5z"/></svg>
                  </div>
                </div>

                {/* Status Result */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Status Result</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([
                      { key: 'PASS' as const, label: 'PASS', bg: C.primary, color: '#fff', icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
                      { key: 'PARTIAL' as const, label: 'PARTIAL', bg: '#fbbf24', color: '#fff', icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg> },
                      { key: 'FAIL' as const, label: 'FAIL', bg: C.tertiary, color: '#fff', icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg> },
                    ]).map(({ key, label, bg, color, icon }) => {
                      const active = insp.result === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateInspection(idx, { result: key })}
                          style={{
                            flex: 1, padding: '12px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: 11, letterSpacing: '0.05em',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: active ? bg : C.surfaceContainerHighest,
                            color: active ? color : C.onSurfaceVariant,
                            boxShadow: active ? `0 4px 12px ${bg}22` : 'none',
                            transition: 'all 150ms',
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = key === 'PASS' ? '#dcfce7' : key === 'PARTIAL' ? '#fef9c3' : '#fee2e2' }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = C.surfaceContainerHighest }}
                        >
                          {icon}
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Notes (optional)</label>
                <textarea
                  value={insp.notes}
                  onChange={(e) => updateInspection(idx, { notes: e.target.value })}
                  placeholder={insp.result === 'FAIL' ? 'Describe failure items and corrective actions needed...' : 'Additional details or corrective actions needed...'}
                  rows={2}
                  style={{
                    width: '100%', borderRadius: 8, padding: 16, fontSize: 14,
                    border: insp.result === 'FAIL' ? '1.5px solid #fca5a5' : 'none',
                    background: insp.result === 'FAIL' ? '#fff5f5' : C.surfaceContainerHighest,
                    color: C.onSurface, resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
                    transition: 'box-shadow 150ms',
                  }}
                  onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
                  onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                />
              </div>
            </div>
          ))}

          {/* Add Inspection Button */}
          <button
            type="button"
            onClick={() => update({ inspections: [...draft.inspections, { type: '', result: 'PASS', notes: '' }] })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.primary, fontSize: 14, fontWeight: 700, padding: '8px 0',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            Add Inspection
          </button>
        </div>
      )}
    </div>
  )
}
