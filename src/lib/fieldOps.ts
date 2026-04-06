// ===== Field Operations — types, data fetching, draft persistence =====
// Column names match the actual Supabase schema (migrated from Airtable).
import { supabase, invokeEdgeFunction } from './supabase'
import { uploadPhoto, uploadAttachment } from './storage'

// ===== Types =====

export type WeatherCondition = 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Rain' | 'Storm' | 'Snow/Ice'
export type IssueCategory = 'Weather' | 'Permits' | 'Labor' | 'Supply Chain' | 'Quality' | 'Other'
export type InspectionResultDraft = 'PASS' | 'FAIL' | 'PARTIAL'

export interface ManpowerEntryDraft {
  trade: string
  headcount: number
  is_sufficient: boolean
  notes: string
}

export interface AttachmentDraft {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  storageUrl?: string
}

export interface DeliveryDraft {
  vendor: string
  description: string
  received_by: string
  has_damages: boolean
  damage_notes: string
  attachments: AttachmentDraft[]
}

export interface IssueDraft {
  category: IssueCategory
  description: string
  schedule_impact: boolean
  schedule_impact_days: number
  trade: string
}

export interface DelayDraft {
  activity: string
  delay_days: number
  reason: string
  responsibility: string
  mitigation: string
}

export interface InspectionDraftItem {
  type: string
  result: InspectionResultDraft
  notes: string
}

export interface PhotoDraft {
  dataUrl: string
  caption: string
  id: string
  storageUrl?: string
}

export interface DSRDraft {
  step: number
  project_id: number
  project_name: string
  date: string
  weather_conditions: WeatherCondition | ''
  weather_temp: number | ''
  weather_impact: boolean
  weather_impact_notes: string
  rain_inches: number | ''
  wind_speed_mph: number | ''
  manpower: ManpowerEntryDraft[]
  work_completed: string
  work_in_progress: string
  work_planned_tomorrow: string
  has_deliveries: boolean
  deliveries: DeliveryDraft[]
  has_equipment_changes: boolean
  equipment_notes: string
  equipment_attachments: AttachmentDraft[]
  has_issues: boolean
  issues: IssueDraft[]
  has_delays: boolean
  delays: DelayDraft[]
  has_inspections: boolean
  inspections: InspectionDraftItem[]
  photos: PhotoDraft[]
}

export function emptyDraft(today: string): DSRDraft {
  return {
    step: 0,
    project_id: 0,
    project_name: '',
    date: today,
    weather_conditions: '',
    weather_temp: '',
    weather_impact: false,
    weather_impact_notes: '',
    rain_inches: '',
    wind_speed_mph: '',
    manpower: [],
    work_completed: '',
    work_in_progress: '',
    work_planned_tomorrow: '',
    has_deliveries: false,
    deliveries: [],
    has_equipment_changes: false,
    equipment_notes: '',
    equipment_attachments: [],
    has_issues: false,
    issues: [],
    has_delays: false,
    delays: [],
    has_inspections: false,
    inspections: [],
    photos: [],
  }
}

// ===== Draft persistence =====

const DSR_DRAFT_KEY = 'boulder_dsr_draft'
const OFFLINE_QUEUE_KEY = 'boulder_offline_dsr_queue'

export function saveDraft(draft: DSRDraft): void {
  try {
    const json = JSON.stringify(draft)
    if (json.length > 4_000_000) {
      console.warn('Draft size approaching localStorage limit:', (json.length / 1024 / 1024).toFixed(1), 'MB')
    }
    localStorage.setItem(DSR_DRAFT_KEY, json)
  } catch (e) {
    console.error('Failed to save draft — storage may be full:', e)
  }
}

export function loadDraft(): DSRDraft | null {
  try {
    const raw = localStorage.getItem(DSR_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Migrate older drafts missing new fields
    if (!parsed.equipment_attachments) parsed.equipment_attachments = []
    if (!parsed.delays) parsed.delays = []
    if (parsed.deliveries) {
      parsed.deliveries = parsed.deliveries.map((d: any) => ({
        ...d,
        attachments: d.attachments || [],
      }))
    }
    return parsed as DSRDraft
  } catch { return null }
}

export function clearDraft(): void {
  localStorage.removeItem(DSR_DRAFT_KEY)
}

// ===== Offline queue =====

export function enqueueOfflineSubmission(draft: DSRDraft): void {
  try {
    const queue: { draft: DSRDraft; timestamp: string }[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
    queue.push({ draft, timestamp: new Date().toISOString() })
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch { /* ignore */ }
}

export function getOfflineQueueLength(): number {
  try { return (JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') as unknown[]).length } catch { return 0 }
}

export async function processOfflineQueue(userId: string | null): Promise<void> {
  try {
    const queue: { draft: DSRDraft; timestamp: string }[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
    if (queue.length === 0) return
    const remaining: typeof queue = []
    for (const item of queue) {
      const result = await submitDSR(item.draft, userId)
      if (!result.success) remaining.push(item)
    }
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining))
  } catch { /* ignore */ }
}

// ===== createTodo helper =====
// Real schema: to_do table has: name, projects (text[]), status, urgent (bool),
// comments (text), deadline (date), assignee (text[]), completed (bool)

async function createTodo(params: {
  name: string
  project_code?: string
  urgent?: boolean
  comments?: string
  deadline?: string
}): Promise<void> {
  try {
    await supabase.from('to_do').insert({
      name: params.name,
      projects: params.project_code ? [params.project_code] : [],
      status: 'Open',
      urgent: params.urgent || false,
      comments: params.comments || null,
      deadline: params.deadline || null,
    })
  } catch { /* ignore */ }
}

// ===== Projects =====

export interface FieldProject {
  id: number
  name: string
  code: string
  superintendent?: string | null
  address?: string | null
}

export async function fetchProjects(): Promise<FieldProject[]> {
  // DB schema: name = project code (e.g. "TPSJ"), project_name = display name
  const { data } = await supabase.from('projects').select('id, name, project_name, superintendent, address').order('name')
  if (data && data.length > 0) {
    return data.map(p => ({
      id: p.id,
      code: p.name,                        // DB "name" column holds the code
      name: p.project_name || p.name,       // DB "project_name" holds display name
      superintendent: p.superintendent,
      address: p.address,
    }))
  }
  // Fallback projects with full names
  return [
    { id: 1, name: 'TownePlace Suites – Jackson', code: 'TPSJ', superintendent: undefined, address: undefined },
    { id: 2, name: 'Staybridge Suites – Jackson', code: 'SYBJ', superintendent: undefined, address: undefined },
    { id: 3, name: 'Candlewood Suites – Jackson', code: 'CWSJ', superintendent: undefined, address: undefined },
    { id: 4, name: 'Holiday Inn Express – Stephenville', code: 'HIS', superintendent: undefined, address: undefined },
    { id: 5, name: 'Hampton Inn – Baton Rouge', code: 'HIBR', superintendent: undefined, address: undefined },
    { id: 6, name: 'Homewood Suites – Gonzales', code: 'HWSG', superintendent: undefined, address: undefined },
  ]
}

// ===== Add new project/site =====

export async function addProject(project: {
  name: string
  code: string
  superintendent?: string
  address?: string
}): Promise<{ success: boolean; data?: FieldProject; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.code.toUpperCase(),        // DB "name" = code
        project_name: project.name,               // DB "project_name" = display name
        superintendent: project.superintendent || null,
        address: project.address || null,
      })
      .select('id, name, project_name, superintendent, address')
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, data: { id: data.id, code: data.name, name: data.project_name || data.name, superintendent: data.superintendent, address: data.address } as FieldProject }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// buyouts table: id, name, trades (text[]), buyouts_join_table (text[])
// buyouts_join_table: id, name, buyouts (text[]), projects (text[]), status (text), trades_join_table (text[])
// We join through buyouts_join_table to get trades per project.
export async function fetchActiveTradesForProject(projectCode: string): Promise<string[]> {
  // buyouts_join_table links buyouts to projects with a status field
  const { data } = await supabase
    .from('buyouts_join_table')
    .select('name')
    .contains('projects', [projectCode])
    .in('status', ['Scheduled', 'In Progress', 'Active'])
  if (data && data.length > 0) {
    const trades = [...new Set(data.map((r: { name: string }) => r.name).filter(Boolean))]
    if (trades.length > 0) return trades
  }
  return []
}

// ===== Helper: build manpower text from draft entries =====

function buildManpowerText(entries: ManpowerEntryDraft[]): string {
  return entries
    .map((m) => {
      let line = `${m.trade}: ${m.headcount}`
      if (!m.is_sufficient) line += ' (SHORT)'
      if (m.notes) line += ` — ${m.notes}`
      return line
    })
    .join('\n')
}

// ===== Helper: build deliveries text from draft entries =====

function buildDeliveriesText(entries: DeliveryDraft[]): string {
  return entries
    .map((d) => {
      let line = `${d.vendor}: ${d.description}`
      if (d.received_by) line += ` (received by ${d.received_by})`
      if (d.has_damages) line += ` — DAMAGES: ${d.damage_notes}`
      return line
    })
    .join('\n')
}

// ===== Helper: build issues/delays text from draft entries =====

function buildIssuesText(entries: IssueDraft[]): string {
  return entries
    .map((issue) => {
      const lines = [
        `[${issue.category}] ${issue.description || 'No description'}`,
      ]
      if (issue.trade) lines.push(`Trade: ${issue.trade}`)
      if (issue.schedule_impact) lines.push(`Schedule impact: ${issue.schedule_impact_days} day${issue.schedule_impact_days === 1 ? '' : 's'}`)
      return lines.join('\n')
    })
    .join('\n\n')
}

// ===== Helper: build delays text from draft entries =====

function buildDelaysText(entries: DelayDraft[]): string {
  return entries
    .map((delay) => {
      const lines = [
        `Delay - ${delay.activity || 'No activity provided'}`,
        `  Duration: ${delay.delay_days ?? 0} day${delay.delay_days === 1 ? '' : 's'}`,
        `  Reason: ${delay.reason || 'N/A'}`,
        `  Responsibility: ${delay.responsibility || 'N/A'}`,
        `  Mitigation: ${delay.mitigation || 'N/A'}`,
      ]
      return lines.join('\n')
    })
    .join('\n\n')
}

function buildInspectionsText(entries: InspectionDraftItem[]): string {
  return entries
    .map((insp) => {
      let line = `${insp.type}: ${insp.result}`
      if (insp.notes) line += ` — ${insp.notes}`
      return line
    })
    .join('\n')
}

// ===== Submit DSR =====
// Real schema columns: id, date, submitted_by (text[]), projects (text[]),
// photos (jsonb), manpower (text), work_in_progress (text),
// work_completed_today (text), work_planned_tomorrow (text), deliveries (text),
// issues_delays (text), inspection_today_upcoming_with_status (text),
// weather (text), notes (text), rfis (text), change_orders (text),
// requests_notices (text), receipts (jsonb), receipts_context (text),
// include_in_weekly_report (bool), generate_daily_report (bool),
// report_status (text), report_sent_at (timestamptz)

export async function submitDSR(
  draft: DSRDraft,
  userId: string | null
): Promise<{ success: boolean; reportId?: number; error?: string }> {
  try {
    // Build weather text (single text column includes temp, rain/wind, and impact info)
    let weatherText = draft.weather_conditions || ''
    if (draft.weather_temp !== '') weatherText += ` ${draft.weather_temp}°F`
    if (draft.rain_inches !== '') weatherText += ` | Rain: ${draft.rain_inches}″`
    if (draft.wind_speed_mph !== '') weatherText += ` | Wind: ${draft.wind_speed_mph} mph`
    if (draft.weather_impact && draft.weather_impact_notes) {
      weatherText += ` — Impact: ${draft.weather_impact_notes}`
    }

    // Build notes from equipment changes
    let notesText = ''
    if (draft.has_equipment_changes && draft.equipment_notes) {
      notesText = `Equipment Changes: ${draft.equipment_notes}`
    }

    const { data: reportData, error: reportError } = await supabase
      .from('daily_site_report')
      .insert({
        project_id: draft.project_id || null,
        date: draft.date,
        submitted_by: userId ? [userId] : [],
        weather: weatherText || null,
        manpower: draft.manpower.length > 0 ? buildManpowerText(draft.manpower) : null,
        work_completed_today: draft.work_completed || null,
        work_in_progress: draft.work_in_progress || null,
        work_planned_tomorrow: draft.work_planned_tomorrow || null,
        deliveries: draft.has_deliveries && draft.deliveries.length > 0
          ? buildDeliveriesText(draft.deliveries)
          : null,
        issues_delays: (() => {
          const issuesText = draft.has_issues && draft.issues.length > 0 ? buildIssuesText(draft.issues) : ''
          const delaysText = draft.has_delays && draft.delays.length > 0 ? buildDelaysText(draft.delays) : ''
          const combined = [issuesText, delaysText].filter(Boolean).join('\n\n')
          return combined || null
        })(),
        inspection_today_upcoming_with_status: draft.has_inspections && draft.inspections.length > 0
          ? buildInspectionsText(draft.inspections)
          : null,
        notes: notesText || null,
        report_status: 'Submitted',
        report_sent_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (reportError || !reportData) {
      return { success: false, error: reportError?.message || 'Failed to create report' }
    }

    const reportId = (reportData as { id: number }).id

    // ── Upload photos to Supabase Storage ──
    if (draft.photos.length > 0) {
      const photoUrls = await Promise.all(
        draft.photos.map(async (p) => {
          try {
            const url = await uploadPhoto({
              projectCode: draft.project_name,
              date: draft.date,
              reportId,
              photoId: p.id,
              dataUrl: p.dataUrl,
            })
            return { url, filename: `${p.id}.jpg`, caption: p.caption }
          } catch {
            console.warn(`Failed to upload photo ${p.id}`)
            return { url: null, filename: `${p.id}.jpg`, caption: p.caption }
          }
        })
      )
      // Update report row with photo URLs (photos column is jsonb)
      try {
        await supabase
          .from('daily_site_report')
          .update({ photos: photoUrls.filter((p) => p.url) })
          .eq('id', reportId)
      } catch {
        console.warn('Failed to save photo URLs to report')
      }
    }

    // ── Upload equipment attachments to Supabase Storage ──
    if (draft.has_equipment_changes && draft.equipment_attachments.length > 0) {
      const eqAttUrls = await Promise.all(
        draft.equipment_attachments.map(async (att) => {
          try {
            const url = await uploadAttachment({
              projectCode: draft.project_name,
              date: draft.date,
              reportId,
              attachmentId: att.id,
              fileName: att.name,
              dataUrl: att.dataUrl,
              mimeType: att.type,
            })
            return { url, filename: att.name, size: att.size, type: att.type }
          } catch {
            console.warn(`Failed to upload equipment attachment ${att.id}`)
            return null
          }
        })
      )
      const uploaded = eqAttUrls.filter(Boolean)
      if (uploaded.length > 0) {
        try {
          await supabase
            .from('daily_site_report')
            .update({ equipment_attachments: uploaded })
            .eq('id', reportId)
        } catch {
          console.warn('Failed to save equipment attachment URLs to report')
        }
      }
    }

    // ── Insert manpower rows into separate manpower table ──
    if (draft.manpower.length > 0) {
      // Aggregate manpower by trade to avoid duplicates
      const manpowerMap = draft.manpower.reduce((acc, m) => {
        const trade = m.trade.trim()
        if (!acc[trade]) {
          acc[trade] = { headcount: 0, is_sufficient: true, notes: [] }
        }
        acc[trade].headcount += m.headcount
        acc[trade].is_sufficient = acc[trade].is_sufficient && m.is_sufficient
        if (m.notes) acc[trade].notes.push(m.notes)
        return acc
      }, {} as Record<string, { headcount: number; is_sufficient: boolean; notes: string[] }>)

      const aggregatedManpower = Object.entries(manpowerMap).map(([trade, data]) => ({
        name: trade,
        date: draft.date,
        people: data.headcount,
        sufficient_amt_of_manpower: data.is_sufficient ? 'Yes' : 'No',
        notes: data.notes.join('; ') || null,
        project_id: draft.project_id || null,
        daily_site_report: String(reportId),
      }))

      await supabase.from('manpower').insert(aggregatedManpower)
    }

    // ── Insert delivery rows ──
    if (draft.has_deliveries && draft.deliveries.length > 0) {
      const { data: deliveryData } = await supabase
        .from('deliveries')
        .insert(
          draft.deliveries.map((d) => ({
            name: `${d.vendor} — ${d.description}`,
            project_id: draft.project_id || null,
            on_site_receiver: d.received_by || null,
            missing_items_damages_everything_received: d.has_damages
              ? `Damages: ${d.damage_notes}`
              : 'Everything received',
            delivery_date: draft.date,
            notes: d.has_damages ? d.damage_notes : null,
            daily_site_report: String(reportId),
          }))
        )
        .select('id')

      // Upload delivery attachments
      if (deliveryData) {
        for (let i = 0; i < draft.deliveries.length; i++) {
          const del = draft.deliveries[i]
          const deliveryId = deliveryData[i]?.id
          if (!deliveryId || del.attachments.length === 0) continue
          try {
            const attUrls = await Promise.all(
              del.attachments.map(async (att) => {
                try {
                  const url = await uploadAttachment({
                    projectCode: draft.project_name,
                    date: draft.date,
                    reportId,
                    attachmentId: att.id,
                    fileName: att.name,
                    dataUrl: att.dataUrl,
                    mimeType: att.type,
                  })
                  return { url, filename: att.name, size: att.size, type: att.type }
                } catch {
                  return { url: null, filename: att.name, size: att.size, type: att.type }
                }
              })
            )
            await supabase
              .from('deliveries')
              .update({ attachments: attUrls.filter((a) => a.url) })
              .eq('id', deliveryId)
          } catch {
            console.warn(`Failed to upload attachments for delivery ${deliveryId}`)
          }
        }
      }
    }

    // ── Insert delay rows ──
    if (draft.has_issues && draft.issues.length > 0) {
      await supabase.from('delays').insert(
        draft.issues.map((issue) => ({
          delay: issue.description,
          cause_category: issue.category,
          days_impacted: issue.schedule_impact ? issue.schedule_impact_days : 0,
          trade: issue.trade ? [issue.trade] : [],
          project_id: draft.project_id || null,
          status: 'Active',
          daily_site_report: String(reportId),
        }))
      )
    }

    // ── Insert inspection rows ──
    if (draft.has_inspections && draft.inspections.length > 0) {
      await supabase.from('actual_inspections').insert(
        draft.inspections.map((insp) => ({
          name: insp.type,
          project_id: draft.project_id || null,
          result: insp.result === 'PASS' ? 'Pass' : insp.result === 'FAIL' ? 'Fail' : 'Partial Pass',
          details: insp.notes || null,
          actual_date: draft.date,
          status: insp.result === 'PASS' ? 'Passed' : insp.result === 'FAIL' ? 'Failed' : 'Partial',
        }))
      )
    }

    // ── TODO generation (client-side, Edge Function not yet deployed) ──
    try {
      for (const m of draft.manpower.filter((e) => !e.is_sufficient)) {
        await createTodo({
          name: `Manpower shortage — ${m.trade} on ${draft.project_name} (${draft.date}): ${m.notes || 'Check staffing levels'}`,
          project_code: draft.project_name,
          urgent: true,
        })
      }
      if (draft.has_inspections) {
        for (const insp of draft.inspections.filter((i) => i.result === 'FAIL')) {
          await createTodo({
            name: `Inspection FAILED — ${insp.type} on ${draft.project_name}: ${insp.notes || 'Corrective action required'}`,
            project_code: draft.project_name,
            urgent: true,
          })
        }
      }
    } catch { /* TODOs are non-critical */ }

    // ── Fire-and-forget: email notification (when Edge Function is deployed) ──
    invokeEdgeFunction('send-notification', {
      reportId,
      projectId: draft.project_id,
      projectName: draft.project_name,
      date: draft.date,
      superintendentId: userId,
      summary: {
        totalHeadcount: draft.manpower.reduce((s, m) => s + m.headcount, 0),
        deliveryCount: draft.has_deliveries ? draft.deliveries.length : 0,
        issueCount: draft.has_issues ? draft.issues.length : 0,
        inspectionCount: draft.has_inspections ? draft.inspections.length : 0,
        failedInspections: draft.has_inspections ? draft.inspections.filter((i) => i.result === 'FAIL').length : 0,
      },
    }).catch(() => {}) // non-critical

    return { success: true, reportId }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ===== DSR fetching =====
// Maps the real DB columns to a frontend-friendly interface

export interface DSRRow {
  id: number
  project_id: number | null
  date: string | null
  submitted_by: string[] | null
  weather: string | null
  manpower: string | null
  work_completed_today: string | null
  work_in_progress: string | null
  work_planned_tomorrow: string | null
  deliveries: string | null
  issues_delays: string | null
  inspection_today_upcoming_with_status: string | null
  notes: string | null
  photos: any[] | null
  receipts: any[] | null
  report_status: string | null
  report_sent_at: string | null
  created_at: string
}

export async function fetchDSRList(params?: { projectId?: number; projectCode?: string; limit?: number }): Promise<DSRRow[]> {
  let query = supabase
    .from('daily_site_report')
    .select('*')
    .order('date', { ascending: false })
    .limit(params?.limit || 200)
  // Support both new project_id and legacy projects code filtering
  if (params?.projectId) query = query.eq('project_id', params.projectId)
  else if (params?.projectCode) query = query.contains('projects', [params.projectCode])
  const { data } = await query
  return (data || []) as DSRRow[]
}

export async function fetchDSRById(id: number): Promise<DSRRow | null> {
  const { data } = await supabase.from('daily_site_report').select('*').eq('id', id).single()
  return (data as DSRRow) || null
}

// ===== Manpower =====
// Real schema: id, date, name (trade), people (headcount), projects (text[]),
// sufficient_amt_of_manpower (text), notes, daily_site_report (text)

export interface ManpowerRow {
  id: number
  date: string | null
  name: string | null
  people: number | null
  project_id: number | null
  sufficient_amt_of_manpower: string | null
  notes: string | null
}

export async function fetchManpower(params?: { projectId?: number; projectCode?: string; days?: number }): Promise<ManpowerRow[]> {
  const daysAgo = new Date()
  daysAgo.setDate(daysAgo.getDate() - (params?.days || 14))
  let query = supabase
    .from('manpower')
    .select('*')
    .gte('date', daysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(1000)
  // Support both new project_id and legacy projects code filtering
  if (params?.projectId) query = query.eq('project_id', params.projectId)
  else if (params?.projectCode) query = query.contains('projects', [params.projectCode])
  const { data } = await query
  return (data || []) as ManpowerRow[]
}

// ===== Date-scoped DSR fetch =====

export async function fetchDSRsForDate(date: string, projectId?: number, projectCode?: string): Promise<DSRRow[]> {
  let query = supabase
    .from('daily_site_report')
    .select('*')
    .eq('date', date)
    .order('report_sent_at', { ascending: false })
  // Support both new project_id and legacy projects code filtering
  if (projectId) query = query.eq('project_id', projectId)
  else if (projectCode) query = query.contains('projects', [projectCode])
  const { data } = await query
  return (data || []) as DSRRow[]
}

// ===== Date-scoped Manpower fetch =====

export async function fetchManpowerForDate(date: string, projectId?: number, dailySiteReportId?: number): Promise<ManpowerRow[]> {
  let query = supabase
    .from('manpower')
    .select('*')
    .eq('date', date)
    .order('name')

  if (projectId) query = query.eq('project_id', projectId)
  if (dailySiteReportId !== undefined && dailySiteReportId !== null) {
    query = query.eq('daily_site_report', String(dailySiteReportId))
  }

  const { data } = await query
  return (data || []) as ManpowerRow[]
}

// ===== Deliveries =====

export interface DeliveryRow {
  id: number
  name: string | null
  project_id: number | null
  delivery_date: string | null
  on_site_receiver: string | null
  missing_items_damages_everything_received: string | null
  notes: string | null
  daily_site_report: string | null
}

export async function fetchDeliveriesForDate(date: string, projectId?: number, projectCode?: string): Promise<DeliveryRow[]> {
  let query = supabase
    .from('deliveries')
    .select('*')
    .eq('delivery_date', date)
  // Support both new project_id and legacy projects code filtering
  if (projectId) query = query.eq('project_id', projectId)
  else if (projectCode) query = query.contains('projects', [projectCode])
  const { data } = await query
  return (data || []) as DeliveryRow[]
}

// ===== Delays =====

export interface DelayRow {
  id: number
  delay: string | null
  cause_category: string | null
  days_impacted: number | null
  trade: string[] | null
  project_id: number | null
  status: string | null
  daily_site_report: string | null
}

export async function fetchDelaysForDate(date: string, projectId?: number, projectCode?: string): Promise<DelayRow[]> {
  // Delays link to DSRs via daily_site_report (string ID). Fetch DSR IDs for the date, then query delays.
  const dsrs = await fetchDSRsForDate(date, projectId, projectCode)
  const dsrIds = dsrs.map((r) => String(r.id))
  if (dsrIds.length === 0) return []
  const { data } = await supabase
    .from('delays')
    .select('*')
    .in('daily_site_report', dsrIds)
  return (data || []) as DelayRow[]
}

// ===== Inspections =====

export interface InspectionRow {
  id: number
  name: string | null
  project_id: number | null
  result: string | null
  details: string | null
  actual_date: string | null
  status: string | null
}

export async function fetchInspectionsForDate(date: string, projectId?: number, projectCode?: string): Promise<InspectionRow[]> {
  let query = supabase
    .from('actual_inspections')
    .select('*')
    .eq('actual_date', date)
  // Support both new project_id and legacy projects code filtering
  if (projectId) query = query.eq('project_id', projectId)
  else if (projectCode) query = query.contains('projects', [projectCode])
  const { data } = await query
  return (data || []) as InspectionRow[]
}
