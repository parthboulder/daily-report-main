import { type DSRDraft } from '../../lib/fieldOps'
import { draftToReportData, generateReportPdf } from '../../lib/generateReportPdf'
import { C, StepHeader } from './shared'

function SectionIcon({ icon }: { icon: string }) {
  const paths: Record<string, string> = {
    groups: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    assignment: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    local_shipping: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    photo_camera: 'M12 15.2c1.77 0 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8 8.8 10.23 8.8 12s1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
    cloud: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
    check_circle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    build: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
    shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d={paths[icon] || paths.assignment} />
    </svg>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.08em',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
      }}
    >Edit</button>
  )
}

function SectionHeader({ icon, title, badge, onEdit }: { icon: string; title: string; badge?: React.ReactNode; onEdit: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: C.primary }}><SectionIcon icon={icon} /></span>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>{title}</h2>
        {badge}
      </div>
      <EditButton onClick={onEdit} />
    </div>
  )
}

const sectionCard: React.CSSProperties = {
  background: C.surfaceContainerLowest,
  borderRadius: 12,
  padding: 24,
  border: '1px solid rgba(173,179,174,0.1)',
}

export default function StepReview({ draft, goToStep, projects, superintendentName, stepNumber, totalSteps }: { draft: DSRDraft; goToStep: (s: number) => void; projects?: { id: number; name: string; code: string }[]; superintendentName?: string; stepNumber: number; totalSteps: number }) {
  const totalHeadcount = draft.manpower.reduce((s, m) => s + m.headcount, 0)
  const insufficientTrades = draft.manpower.filter(m => !m.is_sufficient)
  const issueCount = draft.has_issues ? draft.issues.length : 0
  const passedCount = draft.has_inspections ? draft.inspections.filter(i => i.result === 'PASS').length : 0
  const partialCount = draft.has_inspections ? draft.inspections.filter(i => i.result === 'PARTIAL').length : 0
  const failCount = draft.has_inspections ? draft.inspections.filter(i => i.result === 'FAIL').length : 0

  const projectCode = draft.project_code || 'Unknown'
  const currentProject = projects?.find(p => p.code === draft.project_code)
  const formattedDate = draft.date
    ? new Date(draft.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  const handleDownloadPdf = () => {
    const reportData = draftToReportData(draft, currentProject?.name || projectCode)
    generateReportPdf(reportData)
  }

  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StepHeader title="Final Review" description="Review all sections before submitting your report." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* ── Header Card ── */}
      <section style={{ ...sectionCard, padding: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -48, right: -48, width: 128, height: 128, borderRadius: '50%', background: 'rgba(232,120,58,0.05)' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ background: C.primary, color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>{projectCode}</span>
              <h1 className="text-xl md:text-2xl" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, color: C.onSurface, margin: 0, letterSpacing: '-0.5px' }}>Daily Site Report</h1>
            </div>
            <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '4px 0 0', fontWeight: 500 }}>{formattedDate}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.primaryFixed, color: C.onPrimaryContainer,
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              Ready to Submit
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#cfe6f2', color: '#2d424c',
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Grid: Left + Right columns ── */}
      <style>{`.review-grid { display: grid; gap: 24px; grid-template-columns: 1fr; } @media (min-width: 768px) { .review-grid { grid-template-columns: 2fr 1fr; } }`}</style>
      <div className="review-grid">

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Manpower Table */}
          <section style={sectionCard}>
            <SectionHeader
              icon="groups" title="Manpower Summary"
              badge={insufficientTrades.length > 0 ? (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: '#fef9c3', color: '#92400e' }}>
                  {insufficientTrades.length} shortage{insufficientTrades.length !== 1 ? 's' : ''}
                </span>
              ) : undefined}
              onEdit={() => goToStep(1)}
            />
            {draft.manpower.length > 0 ? (
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.surfaceContainerLow }}>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.onSurfaceVariant }}>Trade</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.onSurfaceVariant }}>Count</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.onSurfaceVariant }}>Sufficient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.manpower.map((m, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.surfaceContainerHigh}` }}>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: C.onSurface }}>
                          {m.trade}
                          {!m.is_sufficient && m.notes && (
                            <p style={{ fontSize: 11, color: '#92400e', margin: '2px 0 0' }}>{m.notes}</p>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: 14, fontWeight: 600, color: C.onSurface }}>{m.headcount}</td>
                        <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                          {m.is_sufficient ? (
                            <span style={{ color: C.primary, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                              Yes
                            </span>
                          ) : (
                            <span style={{ color: C.tertiary, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: `${C.surfaceContainerHigh}50` }}>
                      <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, color: C.onSurface }}>Total Personnel</td>
                      <td style={{ textAlign: 'center', padding: '10px 16px', fontSize: 14, fontWeight: 700, color: C.onSurface }}>{totalHeadcount}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: C.onSurfaceVariant, fontStyle: 'italic', margin: 0 }}>No trades logged</p>
            )}
          </section>

          {/* Work Summary — dark panel */}
          <section style={sectionCard}>
            <SectionHeader icon="assignment" title="Work Summary" onEdit={() => goToStep(2)} />
            <div style={{
              background: C.surfaceContainerLow, color: C.onSurface, padding: 24, borderRadius: 10,
              fontSize: 13, lineHeight: 1.8, minHeight: 100,
              borderLeft: `4px solid ${C.primary}`,
            }}>
              {draft.work_completed && (
                <>
                  <div style={{ color: C.primary, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11, marginBottom: 8 }}>COMPLETED TODAY</div>
                  <p style={{ margin: '0 0 16px', whiteSpace: 'pre-line' }}>{draft.work_completed}</p>
                </>
              )}
              {draft.work_in_progress && (
                <>
                  <div style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11, marginBottom: 8 }}>IN PROGRESS</div>
                  <p style={{ margin: '0 0 16px', whiteSpace: 'pre-line' }}>{draft.work_in_progress}</p>
                </>
              )}
              {draft.work_planned_tomorrow && (
                <>
                  <div style={{ color: '#92400e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 11, marginBottom: 8 }}>PLANNED TOMORROW</div>
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{draft.work_planned_tomorrow}</p>
                </>
              )}
              {!draft.work_completed && !draft.work_in_progress && !draft.work_planned_tomorrow && (
                <p style={{ color: C.onSurfaceVariant, fontStyle: 'italic', margin: 0 }}>No work summary recorded</p>
              )}
            </div>
          </section>

          {/* Deliveries */}
          {(draft.has_deliveries && draft.deliveries.length > 0) && (
            <section style={sectionCard}>
              <SectionHeader icon="local_shipping" title="Deliveries" onEdit={() => goToStep(3)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {draft.deliveries.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, background: C.surfaceContainerLow }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.surfaceContainerHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.onSurfaceVariant }}>
                      <SectionIcon icon="local_shipping" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurface, margin: 0 }}>{d.vendor || 'Delivery'}</p>
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 0' }}>
                        {d.description || '—'}
                        {d.has_damages && <span style={{ color: C.tertiary, fontWeight: 600 }}> — Damages reported</span>}
                      </p>
                    </div>
                    {d.attachments.length > 0 && (
                      <span style={{ fontSize: 11, color: C.onSurfaceVariant, padding: '2px 8px', background: C.surfaceContainerHigh, borderRadius: 10 }}>
                        {d.attachments.length} file{d.attachments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Issues & Inspections */}
          {(issueCount > 0 || passedCount > 0 || partialCount > 0 || failCount > 0) && (
            <section style={sectionCard}>
              <SectionHeader icon="shield" title="Issues & Inspections" onEdit={() => goToStep(4)} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, textAlign: 'center', padding: 16, background: C.surfaceContainerLow, borderRadius: 8 }}>
                  <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issues</p>
                  <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: C.onSurface, margin: 0 }}>{issueCount}</p>
                </div>
                {passedCount > 0 && (
                  <div style={{ flex: 1, textAlign: 'center', padding: 16, background: 'rgba(163,246,156,0.3)', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Passed</p>
                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: C.primary, margin: 0 }}>{passedCount}</p>
                  </div>
                )}
                {partialCount > 0 && (
                  <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#fef9c3', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Partial</p>
                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: '#92400e', margin: 0 }}>{partialCount}</p>
                  </div>
                )}
                {failCount > 0 && (
                  <div style={{ flex: 1, textAlign: 'center', padding: 16, background: '#fee2e2', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Failed</p>
                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: C.tertiary, margin: 0 }}>{failCount}</p>
                  </div>
                )}
              </div>
              {/* Issue detail list */}
              {draft.has_issues && draft.issues.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {draft.issues.map((issue, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: C.surfaceContainerLow }}>
                      <span style={{ color: '#92400e' }}><SectionIcon icon="warning" /></span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.onSurface }}>{issue.category}</span>
                        <span style={{ fontSize: 12, color: C.onSurfaceVariant }}> — {issue.description || 'No description'}</span>
                      </div>
                      {issue.schedule_impact && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fee2e2', color: C.tertiary }}>
                          -{issue.schedule_impact_days}d
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Site Photos */}
          <section style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Site Progress</h3>
              <EditButton onClick={() => goToStep(5)} />
            </div>
            {draft.photos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {draft.photos.slice(0, 3).map((p) => (
                  <div key={p.id} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: C.surfaceContainerHigh }}>
                    <img
                      src={p.dataUrl}
                      alt={p.caption || 'Site photo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', transition: 'filter 300ms' }}
                      onMouseEnter={e => (e.currentTarget.style.filter = 'grayscale(0%)')}
                      onMouseLeave={e => (e.currentTarget.style.filter = 'grayscale(100%)')}
                    />
                  </div>
                ))}
                {draft.photos.length > 3 ? (
                  <div
                    onClick={() => goToStep(5)}
                    style={{
                      aspectRatio: '1', borderRadius: 8, background: C.surfaceContainer,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, cursor: 'pointer', color: C.onSurfaceVariant,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" /></svg>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>+{draft.photos.length - 3} More</span>
                  </div>
                ) : (
                  <div
                    onClick={() => goToStep(5)}
                    style={{
                      aspectRatio: '1', borderRadius: 8, background: C.surfaceContainer,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, cursor: 'pointer', color: C.onSurfaceVariant,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" /></svg>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Add More</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => goToStep(5)}
                style={{
                  padding: 32, borderRadius: 8, background: C.surfaceContainerLow,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer', color: C.onSurfaceVariant,
                }}
              >
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Add Site Photos</span>
              </div>
            )}
          </section>

          {/* Conditions */}
          <section style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Conditions</h3>
              <EditButton onClick={() => goToStep(0)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#d97706' }}><SectionIcon icon="cloud" /></span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.onSurface }}>Weather</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>
                  {draft.weather_conditions || '—'}{draft.weather_temp !== '' ? `, ${draft.weather_temp}°F` : ''}
                </span>
              </div>
              {draft.rain_inches !== '' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#2563eb"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" /></svg>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.onSurface }}>Rainfall</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>{draft.rain_inches}″</span>
                </div>
              )}
              {draft.wind_speed_mph !== '' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#2563eb"><path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zM18.5 11H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5H15c0 1.93 1.57 3.5 3.5 3.5S22 16.43 22 14.5 20.43 11 18.5 11z" /></svg>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.onSurface }}>Wind Speed</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>{draft.wind_speed_mph} mph</span>
                </div>
              )}
              {draft.weather_impact && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fef9c3', fontSize: 12, color: '#92400e', fontWeight: 500 }}>
                  Impact: {draft.weather_impact_notes || 'Weather impacted schedule'}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={C.primary}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-3.5 9.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" /></svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.onSurface }}>Safety Incident</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>None</span>
              </div>
            </div>
          </section>

          {/* Equipment */}
          {draft.has_equipment_changes && (
            <section style={sectionCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Equipment</h3>
                <EditButton onClick={() => goToStep(3)} />
              </div>
              {draft.equipment_notes && (
                <p style={{ fontSize: 13, color: C.onSurface, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{draft.equipment_notes}</p>
              )}
              {draft.equipment_attachments.length > 0 && (
                <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '8px 0 0' }}>
                  {draft.equipment_attachments.length} attachment{draft.equipment_attachments.length !== 1 ? 's' : ''}
                </p>
              )}
            </section>
          )}

          {/* Sign-off */}
          <section style={{ ...sectionCard, borderTop: `4px solid ${C.primary}` }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Submitted By</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{(superintendentName || 'S')[0].toUpperCase()}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.onSurface, margin: 0 }}>{superintendentName || 'Superintendent'}</p>
                <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 0' }}>Site Supervisor</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: C.onSurfaceVariant, fontStyle: 'italic', margin: '16px 0 0', paddingTop: 12, borderTop: `1px solid ${C.surfaceContainerHigh}` }}>
              Report will be electronically signed on submission
            </p>
          </section>
        </div>
      </div>

      {/* Confirmation Banner */}
      <div style={{
        padding: 16, borderRadius: 12,
        background: C.primaryFixed, color: C.onPrimaryContainer,
        display: 'flex', alignItems: 'flex-start', gap: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: '50%',
          background: C.onPrimaryContainer, color: C.primaryFixed, flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
        </span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Submission Confirmation</p>
          <p style={{ fontSize: 14, margin: 0, opacity: 0.9 }}>
            Submitting will: Create manpower records for {draft.manpower.filter(m => m.headcount > 0).length} trades
            {draft.has_deliveries && draft.deliveries.length > 0 ? `, Log ${draft.deliveries.length} deliver${draft.deliveries.length === 1 ? 'y' : 'ies'}` : ''}
            {draft.has_issues && draft.issues.length > 0 ? `, Record ${draft.issues.length} issue${draft.issues.length === 1 ? '' : 's'}` : ''}
            {draft.has_inspections && draft.inspections.length > 0 ? `, Log ${draft.inspections.length} inspection${draft.inspections.length === 1 ? '' : 's'}` : ''}
            {draft.photos.length > 0 ? `, Upload ${draft.photos.length} photo${draft.photos.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
      </div>

      {/* Warning for missing required fields */}
      {(!draft.project_code || !draft.weather_conditions) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 12,
          background: '#fef9c3', border: '1.5px solid #fde68a',
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#92400e"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
          <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
            {!draft.project_code ? 'Project not selected. ' : ''}{!draft.weather_conditions ? 'Weather not set. ' : ''}Go back to complete required fields.
          </p>
        </div>
      )}
    </div>
  )
}
