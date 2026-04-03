import { useRef } from 'react'
import { type DSRDraft } from '../../lib/fieldOps'
import { C, StepHeader } from './shared'

export default function StepPhotos({ draft, photoInputRef, onCapture, onRemove, onCaption, stepNumber, totalSteps }: {
  draft: DSRDraft; photoInputRef: React.RefObject<HTMLInputElement | null>
  onCapture: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (id: string) => void; onCaption: (id: string, caption: string) => void
  stepNumber: number; totalSteps: number
}) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <StepHeader title="Site Photos" description="Attach visual documentation for today's progress." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={onCapture} style={{ display: 'none' }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onCapture} style={{ display: 'none' }} />

      {/* Upload Zone */}
      <div style={{ background: C.surfaceContainerLow, borderRadius: 12, padding: 4 }}>
        <div
          style={{
            border: `2px dashed rgba(173,179,174,0.4)`, borderRadius: 8,
            background: C.surfaceContainerLowest,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '64px 24px', cursor: 'pointer', transition: 'background 200ms',
          }}
          onClick={() => photoInputRef.current?.click()}
          onMouseEnter={e => (e.currentTarget.style.background = C.surfaceContainerLow)}
          onMouseLeave={e => (e.currentTarget.style.background = C.surfaceContainerLowest)}
        >
          {/* Camera Icon Circle */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(163,246,156,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24, transition: 'transform 200ms',
          }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill={C.primary}>
              <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z"/>
            </svg>
          </div>

          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 20, color: C.onSurface, margin: '0 0 8px' }}>Take Photo</h3>
          <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: '0 0 32px' }}>Add site photos for documentation</p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 8,
                background: C.primary, color: '#fff', border: 'none',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
              Browse Files
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 8,
                background: C.surfaceContainerHighest, color: C.onSurfaceVariant, border: 'none',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.surfaceContainerHigh)}
              onMouseLeave={e => (e.currentTarget.style.background = C.surfaceContainerHighest)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 15.2c1.77 0 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8 8.8 10.23 8.8 12s1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
              Open Camera
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {draft.photos.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: C.onSurface, margin: 0 }}>Recent Attachments</h4>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.onSurfaceVariant }}>{draft.photos.length} photo{draft.photos.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {draft.photos.map((photo, idx) => (
              <div key={photo.id} style={{ background: C.surfaceContainerLowest, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 200ms' }}>
                {/* Image */}
                <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: C.surfaceContainer }}>
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption || `Site photo ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 400ms' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => onRemove(photo.id)}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(187,27,33,0.85)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
                {/* Caption */}
                <div style={{ padding: 12 }}>
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => onCaption(photo.id, e.target.value)}
                    placeholder="Add a caption..."
                    style={{
                      width: '100%', border: 'none', background: 'transparent',
                      fontSize: 13, fontWeight: 600, color: C.onSurface,
                      outline: 'none', padding: 0, boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ fontSize: 10, color: C.onSurfaceVariant, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    Just now
                  </p>
                </div>
              </div>
            ))}

            {/* Empty slot placeholder */}
            <div style={{
              border: `1px dashed rgba(173,179,174,0.3)`, borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 224, background: 'rgba(243,244,240,0.3)', cursor: 'pointer',
            }}
              onClick={() => photoInputRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill={C.outlineVariant} style={{ marginBottom: 8 }}><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.onSurfaceVariant, margin: 0 }}>Add more...</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
