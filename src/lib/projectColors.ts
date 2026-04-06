export const PROJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'TPSJ': { bg: '#FFE4E6', text: '#BE123C', border: '#FDA4AF' }, // TownePlace Suites – Jackson
  'SYBJ': { bg: '#CCFBF1', text: '#0F766E', border: '#5EEAD4' }, // Staybridge Suites – Jackson
  'CWSJ': { bg: '#FCE7F3', text: '#BE185D', border: '#F9A8D4' }, // Candlewood Suites – Jackson
  'HIS':  { bg: '#D1FAE5', text: '#047857', border: '#6EE7B7' }, // Holiday Inn Express – Stephenville
  'HIBR': { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' }, // Hampton Inn – Baton Rouge
  'HWSG': { bg: '#EDE9FE', text: '#6D28D9', border: '#C4B5FD' }, // Homewood Suites – Gonzales
}

export const DEFAULT_PROJECT_COLOR = {
  bg: 'var(--color-bg-secondary)',
  text: 'var(--color-text-secondary)',
  border: 'var(--color-border-default)',
}
