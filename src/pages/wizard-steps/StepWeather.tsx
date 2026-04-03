import { type DSRDraft, type WeatherCondition } from '../../lib/fieldOps'
import { C, FieldLabel, Toggle, StepHeader } from './shared'

const CLOUD_PATH = "M501.675,311.617c0-62.804-46.1-114.845-106.307-124.133c-16.384-64.772-75.051-112.711-144.913-112.711c-70.714,0-129.958,49.114-145.493,115.088c-54.393,13.796-94.638,63.076-94.638,121.757c0,69.37,56.24,125.611,125.61,125.611h241.689v-0.021C446.275,436.373,501.675,380.465,501.675,311.617z"

const WEATHER_OPTIONS: { value: WeatherCondition; label: string; icon: React.ReactNode }[] = [
  {
    value: 'Clear', label: 'Clear',
    icon: (
      <svg viewBox="0 0 64 64" width="36" height="36">
        <circle cx="32" cy="32" r="11" fill="#FFBE0B" />
        <rect x="30" y="6" width="4" height="10" rx="2" fill="#FB5607" />
        <rect x="30" y="48" width="4" height="10" rx="2" fill="#FB5607" />
        <rect x="6" y="30" width="10" height="4" rx="2" fill="#FB5607" />
        <rect x="48" y="30" width="10" height="4" rx="2" fill="#FB5607" />
        <rect x="11.4" y="11.4" width="4" height="10" rx="2" transform="rotate(-45 13.4 16.4)" fill="#FB5607" />
        <rect x="42.6" y="42.6" width="4" height="10" rx="2" transform="rotate(-45 44.6 47.6)" fill="#FB5607" />
        <rect x="42.6" y="11.4" width="4" height="10" rx="2" transform="rotate(45 44.6 16.4)" fill="#FB5607" />
        <rect x="11.4" y="42.6" width="4" height="10" rx="2" transform="rotate(45 13.4 47.6)" fill="#FB5607" />
      </svg>
    ),
  },
  {
    value: 'Partly Cloudy', label: 'Partly Cloudy',
    icon: (
      <svg viewBox="0 0 64 64" width="36" height="36">
        <circle cx="22" cy="18" r="8" fill="#FFBE0B" />
        <rect x="20" y="2" width="4" height="7" rx="2" fill="#FB5607" />
        <rect x="6" y="16" width="7" height="4" rx="2" fill="#FB5607" />
        <rect x="33" y="8" width="4" height="7" rx="2" transform="rotate(45 35 11.5)" fill="#FB5607" />
        <rect x="9" y="4" width="4" height="7" rx="2" transform="rotate(-45 11 7.5)" fill="#FB5607" />
        <rect x="9" y="27" width="4" height="7" rx="2" transform="rotate(45 11 30.5)" fill="#FB5607" />
        <g transform="translate(2,10) scale(0.115)"><path d={CLOUD_PATH} fill="#5AB8FF"/></g>
      </svg>
    ),
  },
  {
    value: 'Overcast', label: 'Overcast',
    icon: (
      <svg viewBox="0 0 512 512" width="36" height="36">
        <path d={CLOUD_PATH} fill="#5AB8FF"/>
      </svg>
    ),
  },
  {
    value: 'Rain', label: 'Rain',
    icon: (
      <svg viewBox="0 0 64 64" width="36" height="36">
        <g transform="translate(2,2) scale(0.115)"><path d={CLOUD_PATH} fill="#5AB8FF"/></g>
        <rect x="12" y="45" width="3" height="9" rx="1.5" transform="rotate(-15 13.5 49.5)" fill="#48CAE4" />
        <rect x="20" y="47" width="3" height="11" rx="1.5" transform="rotate(-15 21.5 52.5)" fill="#00B4D8" />
        <rect x="28" y="45" width="3" height="9" rx="1.5" transform="rotate(-15 29.5 49.5)" fill="#48CAE4" />
        <rect x="36" y="47" width="3" height="11" rx="1.5" transform="rotate(-15 37.5 52.5)" fill="#00B4D8" />
        <rect x="44" y="45" width="3" height="9" rx="1.5" transform="rotate(-15 45.5 49.5)" fill="#48CAE4" />
        <rect x="16" y="53" width="3" height="8" rx="1.5" transform="rotate(-15 17.5 57)" fill="#00B4D8" />
        <rect x="24" y="55" width="3" height="7" rx="1.5" transform="rotate(-15 25.5 58.5)" fill="#48CAE4" />
        <rect x="32" y="53" width="3" height="8" rx="1.5" transform="rotate(-15 33.5 57)" fill="#00B4D8" />
        <rect x="40" y="55" width="3" height="7" rx="1.5" transform="rotate(-15 41.5 58.5)" fill="#48CAE4" />
      </svg>
    ),
  },
  {
    value: 'Storm', label: 'Storm',
    icon: (
      <svg viewBox="0 0 64 64" width="36" height="36">
        <g transform="translate(2,0) scale(0.115)"><path d={CLOUD_PATH} fill="#5AB8FF"/></g>
        <rect x="10" y="40" width="3" height="8" rx="1.5" transform="rotate(-15 11.5 44)" fill="#48CAE4" />
        <rect x="18" y="42" width="3" height="9" rx="1.5" transform="rotate(-15 19.5 46.5)" fill="#00B4D8" />
        <rect x="42" y="40" width="3" height="8" rx="1.5" transform="rotate(-15 43.5 44)" fill="#48CAE4" />
        <rect x="50" y="42" width="3" height="9" rx="1.5" transform="rotate(-15 51.5 46.5)" fill="#00B4D8" />
        <rect x="14" y="49" width="3" height="7" rx="1.5" transform="rotate(-15 15.5 52.5)" fill="#00B4D8" />
        <rect x="44" y="49" width="3" height="7" rx="1.5" transform="rotate(-15 45.5 52.5)" fill="#48CAE4" />
        <polygon points="33,36 26,50 30,50 27,62 39,46 34,46 38,36" fill="#FFD60A" />
      </svg>
    ),
  },
  {
    value: 'Snow/Ice', label: 'Snow/Ice',
    icon: <svg viewBox="0 0 24 24" width="36" height="36"><g transform="translate(0 -1028.4)"><g fill="#2980b9"><path d="m20.751 1032.1c-0.123-0.3-0.49-0.4-1.22-0.4-1.274 0.1-3.533 4.6-3.42 1.8-1.928-1.1-0.173 3.2-2.238 3.6-1.302 1.4-0.701-0.9-0.836-1.6-0.21-1 0.262-1.7 1.003-2.2l2.061-2.1c-1.033-2.7-3.586 3-2.971-0.3 0.49-1-0.321-2.4-1.087-2.5h0.012c-0.202 0-0.394 0.1-0.576 0.3-0.165 0.1-0.322 0.3-0.433 0.6h-0.012c-0.056 0.1-0.114 0.3-0.148 0.4h-0.011c-0.025 0.1-0.058 0.2-0.066 0.4h0.016c-0.006 0.1-0.012 0.2 0.01 0.4h0.016c0.024 0.1 0.051 0.3 0.107 0.4h0.016c0.071 0.4 0.091 0.7 0.079 0.8-0.001 0 0.016 0.1 0.015 0.1-0.007 0-0.039 0.1-0.062 0.1-0.025 0-0.067 0.1-0.109 0.1-0.043 0-0.089-0.1-0.146-0.1-0.171-0.1-0.387-0.4-0.647-0.6-0.3388-0.3-0.7419-0.7-1.1107-0.8-0.1957 0-0.3753 0-0.5496 0.1-0.0838 0-0.1514 0.1-0.2267 0.2-0.0826 0.1-0.1598 0.3-0.2298 0.4l2.0508 2.1c0.371 0.2 0.674 0.6 0.853 0.9 0.044 0.1 0.087 0.2 0.115 0.3 0.029 0.1 0.048 0.2 0.06 0.3 0.028 0.2 0.011 0.4-0.044 0.7-0.034 0.1-0.015 0.4 0.004 0.7 0.009 0.2-0.01 0.3-0.002 0.4 0.006 0.2 0.032 0.4 0.025 0.5-0.005 0.1-0.007 0.2-0.038 0.3-0.045 0.1-0.135 0.1-0.262 0.1-0.123 0-0.305-0.2-0.536-0.4h-0.016c-0.248-0.1-0.4482-0.2-0.5984-0.3-0.0767-0.1-0.1293-0.2-0.1857-0.3-0.0602-0.1-0.1223-0.2-0.1625-0.3-0.0738-0.2-0.1099-0.5-0.1406-0.7h-0.0158c-0.0144-0.2-0.0122-0.3-0.0212-0.4-0.0098-0.1-0.0023-0.2-0.0096-0.4-0.007-0.1-0.0128-0.2-0.0212-0.3-0.0085-0.1-0.0347-0.3-0.0486-0.4-0.0065 0-0.0276 0-0.036-0.1-0.0934-0.5-0.3118-0.8-0.9758-0.4h0.0159c0.0055 0.2-0.0079 0.3-0.0178 0.4-0.0006 0 0.0164 0 0.0158 0.1-0.0111 0.1-0.045 0.1-0.0695 0.2-0.0268 0.1-0.0485 0.1-0.0897 0.2h-0.1529c-0.1079 0-0.2485-0.1-0.3977-0.2-0.4423-0.4-1.033-1.2-1.6102-1.8-0.3883-0.4-0.7751-0.7-1.0951-0.7-0.0067 0-0.0092-0.1-0.0159-0.1-0.7482 0-1.09 0.2-1.2033 0.5-0.0309 0.1-0.056 0.2-0.058 0.3-0.0017 0 0.0209 0.1 0.0444 0.2 0.044 0.2 0.1339 0.4 0.266 0.7 0.2471 0.4 0.6241 0.8 1.0109 1.2 0.3954 0.4 0.798 0.7 1.1036 0.9 0.4277 0.3 0.6254 0.5 0.6468 0.6 0.0056 0-0.0107 0.1-0.0232 0.1-0.114 0.2-0.8859 0.1-1.2709 0.3-0.0853 0.1-0.1492 0.2-0.1834 0.3 0.0324 0.1 0.077 0.1 0.1266 0.2 0.1491 0.2 0.3546 0.3 0.6182 0.4 0.5283 0.1 1.227 0 1.8544 0.1 0.2058 0.1 0.398 0.1 0.5781 0.2 0.2702 0.1 0.5007 0.3 0.6626 0.6 0.054 0.2 0.0977 0.3 0.1352 0.4 0.2038 0.1 0.3496 0.2 0.4452 0.3s0.1348 0.2 0.1425 0.3h-0.0116c-0.0149 0-0.0242 0-0.0549 0.1-0.3061 0.1-1.3457-0.1-1.8142 0-0.3788 0.1-0.7288 0.1-1.0485 0-0.3196-0.1-0.6141-0.2-0.8893-0.4-0.1297-0.1-0.2638-0.2-0.3861-0.3-0.1292-0.1-0.2677-0.2-0.3904-0.3-0.2385-0.3-0.475-0.6-0.6985-0.8-0.0316-0.1-0.0561-0.2-0.1035-0.3-0.0501-0.1-0.1208-0.2-0.1857-0.3-0.0547 0-0.1196-0.1-0.1815-0.2-0.0689 0-0.1458 0-0.2205-0.1h-0.2437c-0.2285-0.1-0.4694 0-0.6634 0-0.1447 0.1-0.2399 0.2-0.3248 0.3-0.0424 0-0.0801 0.1-0.1055 0.1-0.0248 0.1-0.0417 0.1-0.0463 0.2h0.0158c-0.0011 0.1 0.0083 0.1 0.0243 0.2 0.043 0.2 0.1778 0.5 0.5255 0.7 0.5853 0.3 0.8616 0.6 0.9264 0.8 0.0162 0 0.0014 0.1-0.0073 0.1-0.011 0 0.0005 0.1-0.0232 0.1h-0.0274c-0.1326 0.1-0.3912 0.2-0.7257 0.2h-0.0274-0.5379-0.0275-1.1117c-0.3097 0-0.53565 0.1-0.70561 0.3h-0.05484c-0.13882 0.1-0.23114 0.2-0.2773 0.3-0.005109 0-0.007255 0.1-0.011588 0.1-0.016489 0-0.046 0.1-0.046356 0.1-0.00037193 0 0.015841 0.1 0.015831 0.1 0.00236 0 0.02076 0.1 0.040145 0.2 0.077328 0.3 0.33768 0.5 0.68693 0.8 0.17292 0.1 0.35029 0.2 0.55489 0.2 0.4175 0.2 0.8726 0.2 1.2879 0 0.7878-0.2 1.0665-0.1 1.0801 0-0.011 0.1-0.0827 0.2-0.2066 0.3-0.1307 0.2-0.3029 0.4-0.4808 0.5-0.1594 0.2-0.3289 0.4-0.465 0.6h-0.0116c-0.1383 0.2-0.263 0.4-0.3078 0.5-0.0207 0.1-0.0358 0.2-0.0263 0.3h0.0158c0.0019 0.1 0.0133 0.1 0.0158 0.1 0.0432 0.2 0.2321 0.5 0.7217 0.6l2.0605-2c0.0083 0 0.0032 0 0.0115-0.1 0.1385-0.1 0.2693-0.3 0.426-0.4 0.4698-0.4 1.0347-0.6 1.7456-0.5 0.5365 0.1 1.7368-0.2 2.0305 0.1h0.0475c0.004 0.1 0.0138 0.1 0.0158 0.1 0.0008 0-0.012 0-0.0232 0.1-0.0437 0.1-0.1799 0.3-0.4491 0.5h0.0158c-0.0218 0.2-0.0613 0.3-0.1086 0.3-0.6165 1.3-3.2287 0.5-3.6038 1.2-0.024 0-0.0577 0.1-0.0622 0.2h0.0158c-0.0015 0-0.0138 0.1 0.0127 0.2 0.0264 0.1 0.0777 0.2 0.1468 0.3h0.0158c0.3539 0 0.5796 0 0.7268 0.1 0.1259 0 0.2104 0.1 0.1973 0.2-0.0779 0.6-2.2764 1.9-2.7205 2.9-0.0367 0-0.0749 0.1-0.0853 0.2h0.0158c-0.0013 0.2-0.0056 0.4 0.0139 0.5h0.0158c0.0205 0.1 0.0383 0.2 0.076 0.3 0.0034 0 0.0124 0.1 0.0159 0.1 0.0819 0.1 0.2066 0.3 0.3471 0.3 0.8793 0.4 2.7715-1.4 3.3198-2.3 0.3514-0.5 0.5468-0.7 0.6569-0.7 0.0421 0.1 0.0728 0.1 0.095 0.2h0.0158c0.0226 0.1 0.0326 0.2 0.0486 0.4 0.0426 0.3 0.1058 0.7 0.3104 0.9h0.1456c0.1193 0.1 0.2582 0.1 0.463 0 0.0002-0.1 0.0115-0.1 0.0116-0.1 0.0018-0.2-0.0084-0.4 0.0051-0.6 0.001 0 0.0105 0 0.0116-0.1 0.0145-0.2 0.0461-0.4 0.0757-0.6h0.0116c0.0317-0.2 0.0677-0.4 0.119-0.6 0.0539-0.2 0.1107-0.5 0.1897-0.6 0.1352-0.4 0.3291-0.7 0.5535-1 0.0436 0 0.0695-0.1 0.117-0.2 0.1409-0.1 0.2749-0.3 0.4529-0.4 0.178-0.2 0.381-0.3 0.599-0.5l-0.004 3.5c-0.427 0.7-1.2623 1.3-1.8523 2-0.2386 0.1-0.4074 0.2-0.5442 0.4-0.054 0-0.1206 0.1-0.1602 0.1-0.0075 0-0.0046 0-0.0116 0.1-0.0438 0-0.0764 0.1-0.1012 0.2h-0.0116c-0.0327 0.1-0.073 0.2-0.0653 0.3 0.0066 0.2 0.055 0.3 0.1235 0.4 0.097 0.2 0.2515 0.3 0.4294 0.3 0.0692 0.1 0.1219 0.1 0.2004 0.1 0.14 0 0.2982-0.1 0.4588-0.2 0.1607-0.1 0.3266-0.2 0.4967-0.5 0.1346-0.1 0.2536-0.3 0.3556-0.4 0.203-0.2 0.361-0.3 0.462-0.4 0.036 0 0.077 0.1 0.102 0.1 0.062 0.1 0.086 0.2 0.096 0.4s0.021 0.5 0.015 0.7c-0.007 0.3-0.031 0.6-0.02 0.9h0.016c0.012 0.3 0.029 0.5 0.09 0.8 0.061 0.2 0.176 0.4 0.321 0.6 0.075 0.1 0.148 0.1 0.252 0.2 0.11 0 0.224 0.1 0.373 0.1 2.182 0-0.082-5.8 2.065-3 1.36 1.7 2.594-0.5 0.819-1.2-0.59-0.7-1.451-1.2-1.878-2l-0.012-3.4c1.75 1 2.15 2.7 2.165 4.6 1.518 0.7 0.334-2.8 1.74-0.8 0.725 1.2 3.859 4 3.815 1.1-0.183-1.2-4.696-3.5-1.865-3.4 1.134-1.9-3.239-0.1-3.58-2.2-1.436-1.3 0.813-0.6 1.611-0.8 0.947-0.2 1.618 0.3 2.172 1l2.067 2c2.718-1-3.002-3.5 0.359-2.9 1.627 0.7 3.941-1.6 1.464-2.1-1.313 0.1-3.917 0.1-1.576-1.2 1.739-1.3-0.978-2.4-1.484-0.6-0.92 1-1.893 2.2-3.408 1.8-0.75-0.1-2.949 0.4-1.319-0.7 0.6-2.1 3.478-0.5 3.997-1.9-0.274-0.8-2.553 0-0.842-1.3 0.917-0.5 2.764-2.4 2.397-3.3z" fill="#3498db"/></g></g></svg>,
  },
]

export default function StepWeather({ draft, update, projects, stepNumber, totalSteps }: { draft: DSRDraft; update: (u: Partial<DSRDraft>) => void; projects: { id: number; name: string; code: string }[]; stepNumber: number; totalSteps: number }) {
  return (
    <div className="px-4 md:px-8 lg:px-12" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <StepHeader title="Weather & Basics" description="Record site conditions, temperature, and schedule impact." stepNumber={stepNumber} totalSteps={totalSteps} />

      {/* Project + Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.surfaceContainerHigh}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>Active Project</FieldLabel>
          <div style={{ position: 'relative' }}>
            <select
              value={draft.project_code}
              onChange={(e) => update({ project_code: e.target.value, manpower: [] })}
              style={{ width: '100%', background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}`, padding: '14px 40px 14px 16px', borderRadius: 8, fontSize: 14, color: C.onSurface, fontWeight: 500, appearance: 'none', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">Select project...</option>
              {projects.map((p) => <option key={p.code} value={p.code}>{p.code} - {p.name}</option>)}
            </select>
            <svg viewBox="0 0 24 24" width="18" height="18" fill={C.onSurfaceVariant} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel>Reporting Date</FieldLabel>
          <input
            type="date"
            value={draft.date}
            onChange={(e) => update({ date: e.target.value })}
            style={{ width: '100%', background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}`, padding: '14px 16px', borderRadius: 8, fontSize: 14, color: C.onSurface, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Atmospheric Conditions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(173,179,174,0.15)' }}>
          <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: C.onSurface, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Atmospheric Conditions</h3>
          <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontStyle: 'italic' }}>Select most frequent condition</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {WEATHER_OPTIONS.map((opt) => {
            const active = draft.weather_conditions === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ weather_conditions: opt.value })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 8px', borderRadius: 12,
                  background: active ? C.primary : C.surfaceContainerLowest,
                  border: `1px solid ${active ? C.primary : C.surfaceContainerHigh}`,
                  color: active ? '#fff' : C.onSurfaceVariant,
                  cursor: 'pointer', transition: 'all 150ms',
                  boxShadow: active ? '0 8px 16px rgba(232,120,58,0.3)' : 'none',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(232,120,58,0.3)'; e.currentTarget.style.background = C.surfaceContainer } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.surfaceContainerHigh; e.currentTarget.style.background = C.surfaceContainerLowest } }}
              >
                <span style={{ marginBottom: 12, display: 'flex' }}>{opt.icon}</span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: active ? 700 : 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Rain & Storm Measurements */}
      {(draft.weather_conditions === 'Rain' || draft.weather_conditions === 'Storm') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FieldLabel>Rainfall</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={draft.rain_inches === '' ? '' : draft.rain_inches}
                onChange={(e) => update({ rain_inches: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="0.0"
                style={{ flex: 1, fontSize: 40, fontFamily: 'Manrope, sans-serif', fontWeight: 800, background: 'transparent', border: 'none', outline: 'none', color: C.onSurface, padding: 0, width: '100%' }}
              />
              <span style={{ fontSize: 20, fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: C.onSurfaceVariant, marginLeft: 8 }}>inches</span>
            </div>
            <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: 0 }}>Total precipitation accumulated today</p>
          </div>

          <div className="p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FieldLabel>Wind Speed</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                step="1"
                min="0"
                value={draft.wind_speed_mph === '' ? '' : draft.wind_speed_mph}
                onChange={(e) => update({ wind_speed_mph: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="0"
                style={{ flex: 1, fontSize: 40, fontFamily: 'Manrope, sans-serif', fontWeight: 800, background: 'transparent', border: 'none', outline: 'none', color: C.onSurface, padding: 0, width: '100%' }}
              />
              <span style={{ fontSize: 20, fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: C.onSurfaceVariant, marginLeft: 8 }}>mph</span>
            </div>
            <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: 0 }}>Peak sustained wind gusts</p>
          </div>
        </div>
      )}

      {/* Temperature + Work Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FieldLabel>Average Temperature</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              value={draft.weather_temp === '' ? '' : draft.weather_temp}
              onChange={(e) => update({ weather_temp: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder="72"
              style={{ flex: 1, fontSize: 40, fontFamily: 'Manrope, sans-serif', fontWeight: 800, background: 'transparent', border: 'none', outline: 'none', color: C.onSurface, padding: 0, width: '100%' }}
            />
            <span style={{ fontSize: 24, fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: C.onSurfaceVariant, marginLeft: 8 }}>°F</span>
          </div>
          <p style={{ fontSize: 11, color: C.onSurfaceVariant, margin: 0 }}>Peak recorded at 2:00 PM CST</p>
        </div>

        <div className="p-4 md:p-8" style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.surfaceContainerHigh}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
          <Toggle
            value={draft.weather_impact}
            onChange={(v) => update({ weather_impact: v })}
            label="Work Impact"
            sublabel="Did weather affect today's schedule?"
          />
          {draft.weather_impact && (
            <textarea
              value={draft.weather_impact_notes}
              onChange={(e) => update({ weather_impact_notes: e.target.value })}
              placeholder="Describe the impact on work..."
              rows={3}
              style={{ width: '100%', borderRadius: 8, padding: 12, fontSize: 13, border: '1.5px solid #fde68a', background: '#fef9c3', color: C.onSurface, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          )}
        </div>
      </div>

      {/* Auto-save info bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', borderTop: `1px solid ${C.surfaceContainerHigh}` }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill={C.primary}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>Information is automatically saved as you progress through each section of the report.</span>
      </div>
    </div>
  )
}
