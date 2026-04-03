import { Loader2 } from 'lucide-react'
import { type DSRDraft, type ManpowerEntryDraft } from '../../lib/fieldOps'
import { C, StepHeader } from './shared'


const TRADE_ICON = <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>

export default function StepManpower({ draft, update, loadingTrades, availableTrades, setAvailableTrades, addTradeInput, setAddTradeInput, setAddTradeFocused, stepNumber, totalSteps }: {
  draft: DSRDraft; update: (u: Partial<DSRDraft>) => void; loadingTrades: boolean
  availableTrades: string[]; setAvailableTrades: (v: string[]) => void
  addTradeInput: string; setAddTradeInput: (v: string) => void; setAddTradeFocused: (v: boolean) => void
  stepNumber: number; totalSteps: number
}) {
  const updateEntry = (idx: number, changes: Partial<ManpowerEntryDraft>) => {
    update({ manpower: draft.manpower.map((m, i) => (i === idx ? { ...m, ...changes } : m)) })
  }
  const addTrade = () => {
    const name = addTradeInput.trim()
    if (!name || draft.manpower.some(m => m.trade === name)) return
    update({ manpower: [...draft.manpower, { trade: name, headcount: 0, is_sufficient: true, notes: '' }] })
    if (!availableTrades.includes(name)) {
      setAvailableTrades([...availableTrades, name])
    }
    setAddTradeInput('')
  }
  const addTradeFromDropdown = (trade: string) => {
    if (!trade || draft.manpower.some(m => m.trade === trade)) return
    update({ manpower: [...draft.manpower, { trade, headcount: 0, is_sufficient: true, notes: '' }] })
  }
  const totalHeadcount = draft.manpower.reduce((sum, m) => sum + m.headcount, 0)
  const shortTrades = draft.manpower.filter(m => !m.is_sufficient)

  // Trades not yet added
  const remainingTrades = availableTrades.filter(t => !draft.manpower.some(m => m.trade === t))

  function tradeBg(sufficient: boolean) {
    return sufficient ? C.surfaceContainer : 'rgba(254,139,112,0.1)'
  }
  function tradeIconColor(sufficient: boolean) {
    return sufficient ? C.primary : '#9e422c'
  }

  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto' }}>

      <StepHeader title="Manpower Attendance" description="Log headcount and staffing sufficiency for active trades on site." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* Bento grid: trades left, stats right */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 md:gap-8" style={{ alignItems: 'start' }}>

        {/* ===== Left: Active Trades ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 20, color: C.onSurface, margin: 0 }}>Active Trades</h3>
            <span style={{ padding: '4px 12px', background: C.surfaceContainerHighest, borderRadius: 99, fontSize: 10, fontWeight: 700, color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Live Count</span>
          </div>

          {/* Trade Dropdown Selector */}
          <div style={{
            background: C.surfaceContainerLowest, padding: 20, borderRadius: 12,
            border: `2px dashed rgba(173,179,174,0.3)`,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill={C.primary} style={{ flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            <div style={{ flex: 1, position: 'relative' }}>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) addTradeFromDropdown(e.target.value)
                }}
                style={{
                  width: '100%', borderRadius: 8, padding: '12px 40px 12px 16px', fontSize: 14,
                  border: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLowest,
                  color: C.onSurface, outline: 'none', appearance: 'none', cursor: 'pointer',
                  fontWeight: 500, boxSizing: 'border-box',
                }}
              >
                <option value="">Select a trade to add...</option>
                {remainingTrades.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <svg viewBox="0 0 24 24" width="18" height="18" fill={C.onSurfaceVariant} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>

          {/* Custom trade input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="text" value={addTradeInput}
              onChange={(e) => setAddTradeInput(e.target.value)}
              onFocus={() => setAddTradeFocused(true)}
              onBlur={() => setTimeout(() => setAddTradeFocused(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && addTrade()}
              placeholder="Or type a custom trade name..."
              style={{
                flex: 1, background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}`,
                borderRadius: 8, padding: '10px 16px', fontSize: 13, color: C.onSurface,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button type="button" onClick={addTrade}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: C.primary, color: '#fff', fontWeight: 700, fontSize: 13,
                opacity: addTradeInput.trim() ? 1 : 0.5,
                transition: 'opacity 150ms',
              }}
            >Add</button>
          </div>

          {loadingTrades ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 size={24} color={C.onSurfaceVariant} className="animate-spin" />
            </div>
          ) : draft.manpower.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 24px',
              background: C.surfaceContainerLow, borderRadius: 12,
              color: C.onSurfaceVariant,
            }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill={C.outlineVariant} style={{ marginBottom: 12 }}>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No trades added yet</p>
              <p style={{ fontSize: 12, margin: 0 }}>Select from the dropdown above to start logging</p>
            </div>
          ) : (
            <>
              {draft.manpower.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 p-3 md:p-5"
                  style={{
                    background: C.surfaceContainerLowest, borderRadius: 12,
                    border: !entry.is_sufficient ? '2px solid rgba(254,139,112,0.2)' : '2px solid transparent',
                  }}
                >
                  {/* Trade identity + delete */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div className="w-9 h-9 md:w-11 md:h-11" style={{ background: tradeBg(entry.is_sufficient), display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0, color: tradeIconColor(entry.is_sufficient) }}>
                        {TRADE_ICON}
                      </div>
                      <h4 className="text-sm md:text-base" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: C.onSurface, margin: 0 }}>{entry.trade}</h4>
                    </div>
                    <button type="button" onClick={() => update({ manpower: draft.manpower.filter((_, i) => i !== idx) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4, display: 'flex', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.tertiary)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.onSurfaceVariant)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                    {/* Headcount stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', background: C.surfaceContainer, borderRadius: 8, padding: 3 }}>
                      <button type="button" onClick={() => updateEntry(idx, { headcount: Math.max(0, entry.headcount - 1) })}
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: C.onSurfaceVariant }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>
                      </button>
                      <input type="number" value={entry.headcount}
                        onChange={(e) => updateEntry(idx, { headcount: Math.max(0, parseInt(e.target.value) || 0) })}
                        style={{ width: 36, textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', fontWeight: 700, fontSize: 13, color: C.onSurface }}
                      />
                      <button type="button" onClick={() => updateEntry(idx, { headcount: entry.headcount + 1 })}
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: C.onSurfaceVariant }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                      </button>
                    </div>

                    {/* Sufficient / Short pill toggle */}
                    <div style={{ display: 'flex', background: C.surfaceContainer, borderRadius: 99, padding: 3 }}>
                      <button type="button" onClick={() => updateEntry(idx, { is_sufficient: true, notes: '' })}
                        className="text-[10px] md:text-[11px] px-3 py-1"
                        style={{ fontWeight: 700, borderRadius: 99, border: 'none', cursor: 'pointer', background: entry.is_sufficient ? C.primary : 'transparent', color: entry.is_sufficient ? C.onPrimary : C.onSurfaceVariant, opacity: entry.is_sufficient ? 1 : 0.5, transition: 'all 150ms' }}
                      >SUFFICIENT</button>
                      <button type="button" onClick={() => updateEntry(idx, { is_sufficient: false })}
                        className="text-[10px] md:text-[11px] px-3 py-1"
                        style={{ fontWeight: 700, borderRadius: 99, border: 'none', cursor: 'pointer', background: !entry.is_sufficient ? '#9e422c' : 'transparent', color: !entry.is_sufficient ? '#fff7f6' : C.onSurfaceVariant, opacity: !entry.is_sufficient ? 1 : 0.5, transition: 'all 150ms' }}
                      >SHORT</button>
                    </div>
                  </div>

                  {!entry.is_sufficient && (
                    <div style={{ width: '100%', marginTop: 4 }}>
                      <textarea value={entry.notes} onChange={(e) => updateEntry(idx, { notes: e.target.value })}
                        placeholder="Describe the shortage..." rows={2}
                        style={{ width: '100%', borderRadius: 8, padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(254,139,112,0.4)', background: 'rgba(254,139,112,0.06)', color: C.onSurface, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* ===== Right: Stats Sidebar ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Total on site — dark green card */}
          <div style={{ background: C.onPrimaryContainer, color: '#FFF3EC', padding: 32, borderRadius: 16, boxShadow: '0 20px 40px rgba(232,120,58,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h4 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.8, margin: '0 0 8px' }}>Total on site today</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 60, fontFamily: 'Manrope, sans-serif', fontWeight: 800, lineHeight: 1 }}>{totalHeadcount}</span>
                <span style={{ fontSize: 18, opacity: 0.7 }}>Personnel</span>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -32, bottom: -32, opacity: 0.1 }}>
              <svg viewBox="0 0 24 24" width="160" height="160" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
          </div>

          {/* Trades added summary */}
          <div style={{ background: C.surfaceContainer, padding: 24, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h5 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 13, color: C.onSurface, margin: 0 }}>Trades Summary</h5>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: C.surfaceContainerLowest, borderRadius: 8 }}>
                <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: C.primary, margin: 0 }}>{draft.manpower.length}</p>
                <p style={{ fontSize: 10, color: C.onSurfaceVariant, margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>Active</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: C.surfaceContainerLowest, borderRadius: 8 }}>
                <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif', color: C.onSurface, margin: 0 }}>{remainingTrades.length}</p>
                <p style={{ fontSize: 10, color: C.onSurfaceVariant, margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>Available</p>
              </div>
            </div>
          </div>


          {/* Alert: shortage */}
          {shortTrades.length > 0 && (
            <div style={{ padding: 24, background: 'rgba(254,139,112,0.1)', border: '1px solid rgba(254,139,112,0.2)', borderRadius: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#9e422c" style={{ flexShrink: 0 }}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#742410', margin: '0 0 4px' }}>
                    {shortTrades.map(t => t.trade).join(', ')} Shortage
                  </p>
                  <p style={{ fontSize: 11, color: '#742410', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                    Personnel count is below target for the current schedule.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>{/* end bento grid */}
    </div>
  )
}
