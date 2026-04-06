import { type DSRDraft, type DelayDraft } from '../../lib/fieldOps'
import { C, StepHeader, Toggle } from './shared'

const EMPTY_DELAY: DelayDraft = {
  activity: '',
  delay_days: 1,
  reason: '',
  responsibility: '',
  mitigation: '',
}

export default function StepDelays({ draft, update, stepNumber, totalSteps }: { draft: DSRDraft; update: (u: Partial<DSRDraft>) => void; stepNumber: number; totalSteps: number }) {
  const updateDelay = (index: number, changes: Partial<DelayDraft>) => {
    update({ delays: draft.delays.map((item, idx) => (idx === index ? { ...item, ...changes } : item)) })
  }

  const validateDelay = (delay: DelayDraft) => ({
    activity: !!delay.activity.trim(),
    delay_days: delay.delay_days >= 0,
    reason: !!delay.reason.trim(),
    responsibility: !!delay.responsibility.trim(),
    mitigation: !!delay.mitigation.trim(),
  })

  const isDelaysValid = !draft.has_delays || (draft.delays.length > 0 && draft.delays.every((delay) => Object.values(validateDelay(delay)).every(Boolean)))

  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StepHeader title="Delays" description="Record delays, causes, impacted parties, and mitigation actions." stepNumber={stepNumber} totalSteps={totalSteps} />

      <div style={{ marginBottom: 10, color: C.onSurfaceVariant, fontSize: 12 }}>
        {draft.has_delays
          ? 'Please add at least one delay record and complete all fields before continuing.'
          : 'Toggle to Yes if delays are present; details are required when yes.'}
      </div>

      <div style={{ background: C.surfaceContainer, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontWeight: 600, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>Any delays to report today?</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle value={draft.has_delays} onChange={(v) => update({ has_delays: v })} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurface }}>{draft.has_delays ? 'YES' : 'NO'}</span>
        </div>
      </div>

      {draft.has_delays && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {draft.delays.map((delay, idx) => {
            const delayValidation = validateDelay(delay)
            const invalid = !Object.values(delayValidation).every(Boolean)

            return (
              <div key={idx} style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${invalid ? '#ef4444' : 'rgba(173,179,174,0.2)'}`, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface }}>Delay {idx + 1}</h4>
                  <button type="button" onClick={() => update({ delays: draft.delays.filter((_, i) => i !== idx) })} style={{ background: 'none', border: 'none', color: C.tertiary, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>
                    Activity
                    <input type="text" value={delay.activity} onChange={(e) => updateDelay(idx, { activity: e.target.value })} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${delayValidation.activity ? C.outlineVariant : '#dc2626'}`, background: C.surfaceContainer, outline: 'none' }} />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>
                    Delay (days)
                    <input type="number" min={0} value={delay.delay_days} onChange={(e) => updateDelay(idx, { delay_days: Number(e.target.value) })} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${delayValidation.delay_days ? C.outlineVariant : '#dc2626'}`, background: C.surfaceContainer, outline: 'none' }} />
                  </label>

                  <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>
                    Reason
                    <textarea rows={2} value={delay.reason} onChange={(e) => updateDelay(idx, { reason: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${delayValidation.reason ? C.outlineVariant : '#dc2626'}`, background: C.surfaceContainer, outline: 'none', resize: 'vertical' }} />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>
                    Responsibility
                    <input type="text" value={delay.responsibility} onChange={(e) => updateDelay(idx, { responsibility: e.target.value })} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${delayValidation.responsibility ? C.outlineVariant : '#dc2626'}`, background: C.surfaceContainer, outline: 'none' }} />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>
                    Mitigation / Action
                    <input type="text" value={delay.mitigation} onChange={(e) => updateDelay(idx, { mitigation: e.target.value })} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${delayValidation.mitigation ? C.outlineVariant : '#dc2626'}`, background: C.surfaceContainer, outline: 'none' }} />
                  </label>
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={() => update({ delays: [...draft.delays, EMPTY_DELAY], has_delays: true })} style={{ border: '1px solid rgba(232,120,58,0.5)', background: 'transparent', color: C.primary, padding: '10px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              + Add another delay
            </button>
            <span style={{ color: isDelaysValid ? '#16a34a' : '#dc2626', fontSize: 12, fontWeight: 600 }}>
              {isDelaysValid ? 'All delay fields look good.' : 'Please complete all fields in each delay entry.'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
