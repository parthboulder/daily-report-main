import { useRef } from 'react'
import { type DSRDraft, type DeliveryDraft, type AttachmentDraft } from '../../lib/fieldOps'
import { C, Toggle, StepHeader } from './shared'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fileToAttachment(file: File): Promise<AttachmentDraft> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  })
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
  )
  if (type === 'application/pdf') return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
  )
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
  )
}

function AttachmentZone({ attachments, onAdd, onRemove }: {
  attachments: AttachmentDraft[]
  onAdd: (files: AttachmentDraft[]) => void
  onRemove: (id: string) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const results = await Promise.all(Array.from(files).map(fileToAttachment))
    onAdd(results)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={handleFiles} style={{ display: 'none' }} />

      {/* Attached files list */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map((att) => (
            <div key={att.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: C.surfaceContainerLow, border: `1px solid ${C.surfaceContainerHigh}`,
            }}>
              <span style={{ color: C.primary, display: 'flex', flexShrink: 0 }}>{getFileIcon(att.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.onSurface, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</p>
                <p style={{ fontSize: 10, color: C.onSurfaceVariant, margin: 0 }}>{formatFileSize(att.size)}</p>
              </div>
              {att.type.startsWith('image/') && (
                <img src={att.dataUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <button type="button" onClick={() => onRemove(att.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, display: 'flex', padding: 2, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = C.tertiary)}
                onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add attachment button */}
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 8,
          border: `1.5px dashed ${C.outlineVariant}`, background: 'transparent',
          color: C.onSurfaceVariant, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,120,58,0.4)'; e.currentTarget.style.color = C.primary }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.outlineVariant; e.currentTarget.style.color = C.onSurfaceVariant }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
        Attach Documents
      </button>
    </div>
  )
}

export default function StepDeliveries({ draft, update, stepNumber, totalSteps }: { draft: DSRDraft; update: (u: Partial<DSRDraft>) => void; stepNumber: number; totalSteps: number }) {
  const updateDelivery = (idx: number, changes: Partial<DeliveryDraft>) => {
    update({ deliveries: draft.deliveries.map((d, i) => (i === idx ? { ...d, ...changes } : d)) })
  }
  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StepHeader title="Deliveries & Equipment" description="Log material deliveries and equipment movements." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* ─── Deliveries Toggle ─── */}
      <div style={{ background: C.surfaceContainer, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, margin: 0 }}>Any deliveries today?</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle value={draft.has_deliveries} onChange={(v) => update({ has_deliveries: v })} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{draft.has_deliveries ? 'YES' : 'NO'}</span>
        </div>
      </div>

      {/* ─── Delivery Cards ─── */}
      {draft.has_deliveries && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {draft.deliveries.map((del, idx) => (
            <div key={idx} style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, border: '1px solid rgba(173,179,174,0.15)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', background: C.primaryFixed,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: C.onPrimaryContainer, fontWeight: 700, fontSize: 11, flexShrink: 0,
                  }}>{String(idx + 1).padStart(2, '0')}</span>
                  <h4 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Delivery #{idx + 1}</h4>
                </div>
                <button type="button" onClick={() => update({ deliveries: draft.deliveries.filter((_, i) => i !== idx) })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4, display: 'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.tertiary)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {([
                  { key: 'vendor' as const, label: 'Vendor / Supplier' },
                  { key: 'received_by' as const, label: 'Received By' },
                ]).map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</label>
                    <input type="text" value={del[key]} onChange={(e) => updateDelivery(idx, { [key]: e.target.value })}
                      style={{
                        width: '100%', borderRadius: 8, padding: '12px 16px', fontSize: 14,
                        border: 'none', background: C.surfaceContainerHighest, color: C.onSurface,
                        outline: 'none', boxSizing: 'border-box', transition: 'box-shadow 150ms',
                      }}
                      onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
                      onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Description</label>
                <textarea value={del.description} onChange={(e) => updateDelivery(idx, { description: e.target.value })}
                  placeholder="Describe the delivery items..."
                  rows={2}
                  style={{
                    width: '100%', borderRadius: 8, padding: '12px 16px', fontSize: 14,
                    border: 'none', background: C.surfaceContainerHighest, color: C.onSurface,
                    resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
                    transition: 'box-shadow 150ms',
                  }}
                  onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
                  onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
                />
              </div>

              {/* Damages */}
              <div style={{ padding: '16px 0', borderTop: '1px solid rgba(173,179,174,0.1)', borderBottom: '1px solid rgba(173,179,174,0.1)', marginBottom: 20 }}>
                <Toggle value={del.has_damages} onChange={(v) => updateDelivery(idx, { has_damages: v })} label="Any damages?" />
                {del.has_damages && (
                  <textarea value={del.damage_notes} onChange={(e) => updateDelivery(idx, { damage_notes: e.target.value })}
                    placeholder="Describe the damage..."
                    rows={2}
                    style={{
                      width: '100%', marginTop: 12, borderRadius: 8, padding: '12px 16px', fontSize: 14,
                      border: '1.5px solid #fca5a5', background: '#fee2e2', color: C.onSurface,
                      resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>

              {/* Attachments */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Attachments
                  <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', marginLeft: 8, fontSize: 10, opacity: 0.7 }}>BOL, packing slips, photos</span>
                </label>
                <AttachmentZone
                  attachments={del.attachments || []}
                  onAdd={(files) => updateDelivery(idx, { attachments: [...(del.attachments || []), ...files] })}
                  onRemove={(id) => updateDelivery(idx, { attachments: (del.attachments || []).filter(a => a.id !== id) })}
                />
              </div>
            </div>
          ))}

          {/* Add Delivery Button */}
          <button type="button"
            onClick={() => update({ deliveries: [...draft.deliveries, { vendor: '', description: '', received_by: '', has_damages: false, damage_notes: '', attachments: [] }] })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.primary, fontSize: 14, fontWeight: 700, padding: '8px 0',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            Add Another Delivery
          </button>
        </div>
      )}

      {/* ─── Equipment Toggle ─── */}
      <div style={{ background: C.surfaceContainer, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, margin: 0 }}>Any equipment changes?</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle value={draft.has_equipment_changes} onChange={(v) => update({ has_equipment_changes: v })} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{draft.has_equipment_changes ? 'YES' : 'NO'}</span>
        </div>
      </div>

      {/* ─── Equipment Details ─── */}
      {draft.has_equipment_changes && (
        <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, border: '1px solid rgba(173,179,174,0.15)' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Equipment Notes</label>
          <textarea value={draft.equipment_notes} onChange={(e) => update({ equipment_notes: e.target.value })}
            placeholder="Equipment on/off rent, pickups, swaps..."
            rows={3}
            style={{
              width: '100%', borderRadius: 8, padding: '12px 16px', fontSize: 14,
              border: 'none', background: C.surfaceContainerHighest, color: C.onSurface,
              resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
              transition: 'box-shadow 150ms',
            }}
            onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(232,120,58,0.4)')}
            onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
          />

          {/* Equipment Attachments */}
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Attachments
              <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', marginLeft: 8, fontSize: 10, opacity: 0.7 }}>Rental agreements, delivery tickets</span>
            </label>
            <AttachmentZone
              attachments={draft.equipment_attachments || []}
              onAdd={(files) => update({ equipment_attachments: [...(draft.equipment_attachments || []), ...files] })}
              onRemove={(id) => update({ equipment_attachments: (draft.equipment_attachments || []).filter(a => a.id !== id) })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
