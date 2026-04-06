// ===== Project Code ↔ Full Name Mapping =====
// Centralized mapping between short codes (TPSJ, HIBR, etc.) and full project/hotel names

export const PROJECT_NAME_MAP: Record<string, string> = {
  'TPSJ': 'TownePlace Suites – Jackson',
  'SYBJ': 'Staybridge Suites – Jackson',
  'CWSJ': 'Candlewood Suites – Jackson',
  'HIS':  'Holiday Inn Express – Stephenville',
  'HIBR': 'Hampton Inn – Baton Rouge',
  'HWSG': 'Homewood Suites – Gonzales',
}

/**
 * Convert project code to full project/hotel name
 * @param code Short project code (e.g., "TPSJ")
 * @returns Full project name (e.g., "TownePlace Suites – Jackson")
 */
export function getProjectFullName(code: string): string {
  return PROJECT_NAME_MAP[code] || code
}

/**
 * Convert project codes array to full project names array
 * @param codes Array of short codes
 * @returns Array of full project names
 */
export function getProjectFullNames(codes: string[] | null | undefined): string[] {
  if (!codes || codes.length === 0) return []
  return codes.map(code => getProjectFullName(code))
}

/**
 * Format projects for display (handles both codes and full names)
 * @param projects Array of project codes or mixed codes/names
 * @returns Formatted display string
 */
export function formatProjectsForDisplay(projects: string[] | null | undefined): string {
  if (!projects || projects.length === 0) return '—'
  return getProjectFullNames(projects).join(', ')
}
