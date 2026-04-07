// ===== Admin Dashboard — User, Project & Assignment Management =====
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth, type UserProfile, type FieldProjectAdmin } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

// MD3 color tokens
const C = {
  surface: '#f9f9f6',
  surfaceContainer: '#ecefea',
  surfaceContainerLow: '#f3f4f0',
  surfaceContainerHigh: '#e5e9e4',
  surfaceContainerHighest: '#dee4de',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#2e3430',
  onSurfaceVariant: '#5a615c',
  outlineVariant: '#adb3ae',
  primary: '#E8783A',
  primaryFixed: '#FDDCCC',
  primaryFixedDim: '#F5C4A8',
  onPrimary: '#FFF3EC',
  onPrimaryContainer: '#B84E1D',
  primaryContainer: '#FDDCCC',
  tertiary: '#bb1b21',
  tertiaryContainer: '#fe4e49',
}

type Tab = 'users' | 'projects' | 'assignments' | 'reports'


export default function AdminDashboard() {
  const navigate = useNavigate()
  const {
    profile, isAdmin,
    fetchAllUsers, adminResetPassword,
    adminCreateUser, adminUpdateUser, adminDeleteUser,
    adminFetchProjects, adminCreateProject, adminUpdateProject, adminDeleteProject,
    adminAssignProjects,
  } = useAuth()

  const isAuthorizedAdmin = isAdmin

  const [tab, setTab] = useState<Tab>('users')

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'member' })
  const [createUserMsg, setCreateUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editUserForm, setEditUserForm] = useState({ full_name: '', role: '', is_active: true })
  const [editUserMsg, setEditUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingUser, setSavingUser] = useState(false)
  // Reset password state
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetting, setResetting] = useState(false)

  // Projects state
  const [projects, setProjects] = useState<FieldProjectAdmin[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', code: '', superintendent: '', address: '' })
  const [createProjectMsg, setCreateProjectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [creatingProject, setCreatingProject] = useState(false)
  const [editingProject, setEditingProject] = useState<FieldProjectAdmin | null>(null)
  const [editProjectForm, setEditProjectForm] = useState({ name: '', code: '', superintendent: '', address: '' })
  const [editProjectMsg, setEditProjectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingProject, setSavingProject] = useState(false)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  type ProjectEmailSettings = { to: string[]; cc: string[] }
  const [projectEmailSettings, setProjectEmailSettings] = useState<Record<string, ProjectEmailSettings>>({})
  const [assignProjectUser, setAssignProjectUser] = useState<Record<string, string>>({})

  const [manualTriggerTo, setManualTriggerTo] = useState('vraj@boulderconstruction.com')
  const [manualTriggerCc, setManualTriggerCc] = useState('smit@boulderconstruction.com')

  // Assignments state
  const [assignUser, setAssignUser] = useState<UserProfile | null>(null)
  const [assignedCodes, setAssignedCodes] = useState<string[]>([])
  const [assignAllAccess, setAssignAllAccess] = useState(false)
  const [assignMsg, setAssignMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingAssign, setSavingAssign] = useState(false)

  // Reports / Trigger state
  const [triggerRunning, setTriggerRunning] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<{ cron: string; timezone: string } | null>(null)
  const [showScheduleEditor, setShowScheduleEditor] = useState(false)
  const [scheduleHour, setScheduleHour] = useState('07')
  const [scheduleMinute, setScheduleMinute] = useState('00')
  const [scheduleTimezone, setScheduleTimezone] = useState('America/New_York')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [runStatus, setRunStatus] = useState<{ status: string; durationMs?: number; output?: any; finishedAt?: string } | null>(null)

  // Redirect non-admin or unauthorized admin
  useEffect(() => {
    if (profile && !isAuthorizedAdmin) navigate('/daily-reports')
  }, [profile, isAuthorizedAdmin, navigate])

  // Load users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    const data = await fetchAllUsers()
    setUsers(data)
    setLoadingUsers(false)
  }, [fetchAllUsers])

  // Load projects
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    const data = await adminFetchProjects()
    setProjects(data)
    setLoadingProjects(false)
  }, [adminFetchProjects])

  // Load schedule
  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true)
    try {
      const { data: { session } } = await supabase.auth.refreshSession()
      if (!session?.access_token) { setScheduleLoading(false); return }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-daily-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'get-schedule' }),
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data?.success && data.schedule) {
          setCurrentSchedule({
            cron: data.schedule.cron || data.schedule.generatorExpression || '',
            timezone: data.schedule.timezone || 'America/New_York',
          })
          const parts = (data.schedule.cron || data.schedule.generatorExpression || '').split(' ')
          if (parts.length >= 2) {
            setScheduleMinute(parts[0].padStart(2, '0'))
            setScheduleHour(parts[1].padStart(2, '0'))
          }
          setScheduleTimezone(data.schedule.timezone || 'America/New_York')
        }
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
    }
    setScheduleLoading(false)
  }, [])

  // Load data on tab change
  useEffect(() => {
    if (tab === 'users' || tab === 'assignments' || tab === 'projects') loadUsers()
    if (tab === 'projects' || tab === 'assignments') loadProjects()
    if (tab === 'reports') loadSchedule()
  }, [tab, loadUsers, loadProjects, loadSchedule])

  if (!isAuthorizedAdmin) return null

  // Handlers
  async function handleCreateUser() {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      setCreateUserMsg({ type: 'error', text: 'All fields are required.' })
      return
    }
    if (newUser.password.length < 6) {
      setCreateUserMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setCreatingUser(true)
    setCreateUserMsg(null)
    const { error } = await adminCreateUser(newUser.email, newUser.password, newUser.full_name, newUser.role)
    if (error) {
      setCreateUserMsg({ type: 'error', text: error })
    } else {
      setCreateUserMsg({ type: 'success', text: 'User created successfully!' })
      setNewUser({ email: '', password: '', full_name: '', role: 'member' })
      loadUsers()
      setTimeout(() => setShowCreateUser(false), 1500)
    }
    setCreatingUser(false)
  }

  async function handleEditUser() {
    if (!editingUser) return
    setSavingUser(true)
    setEditUserMsg(null)
    const { error } = await adminUpdateUser(editingUser.id, {
      full_name: editUserForm.full_name,
      role: editUserForm.role,
      is_active: editUserForm.is_active,
    })
    if (error) {
      setEditUserMsg({ type: 'error', text: error })
    } else {
      setEditUserMsg({ type: 'success', text: 'User updated!' })
      loadUsers()
      setTimeout(() => setEditingUser(null), 1000)
    }
    setSavingUser(false)
  }

  async function handleDeleteUser(u: UserProfile) {
    if (!confirm(`Deactivate ${u.full_name || u.email}? They won't be able to log in.`)) return
    const { error } = await adminDeleteUser(u.id)
    if (error) alert('Error: ' + error)
    else loadUsers()
  }

  async function handleResetPassword() {
    if (!resetUserId || resetPassword.length < 6) return
    setResetting(true)
    setResetMsg(null)
    const { error } = await adminResetPassword(resetUserId, resetPassword)
    if (error) {
      setResetMsg({ type: 'error', text: error })
    } else {
      setResetMsg({ type: 'success', text: 'Password reset successfully!' })
      setResetPassword('')
      setTimeout(() => { setResetUserId(null); setResetMsg(null) }, 1500)
    }
    setResetting(false)
  }

  async function handleCreateProject() {
    if (!newProject.name || !newProject.code) {
      setCreateProjectMsg({ type: 'error', text: 'Name and code are required.' })
      return
    }
    setCreatingProject(true)
    setCreateProjectMsg(null)
    const { error } = await adminCreateProject(newProject)
    if (error) {
      setCreateProjectMsg({ type: 'error', text: error })
    } else {
      setCreateProjectMsg({ type: 'success', text: 'Project created!' })
      setNewProject({ name: '', code: '', superintendent: '', address: '' })
      loadProjects()
      setTimeout(() => setShowCreateProject(false), 1500)
    }
    setCreatingProject(false)
  }

  async function handleEditProject() {
    if (!editingProject) return
    setSavingProject(true)
    setEditProjectMsg(null)
    const { error } = await adminUpdateProject(editingProject.id, editProjectForm)
    if (error) {
      setEditProjectMsg({ type: 'error', text: error })
    } else {
      setEditProjectMsg({ type: 'success', text: 'Project updated!' })
      loadProjects()
      setTimeout(() => setEditingProject(null), 1000)
    }
    setSavingProject(false)
  }

  // Canonical project list with full hotel names and codes
  const CANONICAL_PROJECTS = [
    { name: 'TownePlace Suites – Jackson', code: 'TPSJ' },           // TownePlace Suites Jackson
    { name: 'Staybridge Suites – Jackson', code: 'SYBJ' },           // Staybridge Suites Jackson
    { name: 'Candlewood Suites – Jackson', code: 'CWSJ' },           // Candlewood Suites Jackson
    { name: 'Holiday Inn Express – Stephenville', code: 'HIS' },     // Holiday Inn Express Stephenville
    { name: 'Hampton Inn – Baton Rouge', code: 'HIBR' },             // Hampton Inn Baton Rouge
    { name: 'Homewood Suites – Gonzales', code: 'HWSG' },            // Homewood Suites Gonzales
  ]

  async function handleSyncProjects() {
    if (!confirm(`This will:\n• Delete all projects NOT in the official 6 (and their linked data)\n• Update names for the 6 official projects\n• Create any missing ones\n\nProceed?`)) return

    try {
      const validCodes = CANONICAL_PROJECTS.map(p => p.code)
      let deleted = 0

      // Force delete extras (clear linked data first)
      for (const p of projects) {
        if (!validCodes.includes(p.code)) {
          const tables = ['acc_draws', 'email_attachment_labels', 'manpower', 'daily_site_report']
          for (const table of tables) {
            await supabase.from(table).delete().eq('project_id', p.id)
            if (p.code) await supabase.from(table).delete().contains('projects', [p.code])
          }
          const { error } = await adminDeleteProject(p.id)
          if (!error) deleted++
        }
      }

      // Update or create canonical projects
      let created = 0, updated = 0
      for (const cp of CANONICAL_PROJECTS) {
        const existing = projects.find(p => p.code === cp.code)
        if (existing) {
          const { error } = await adminUpdateProject(existing.id, { name: cp.name })
          if (!error) updated++
        } else {
          const { error } = await adminCreateProject(cp)
          if (!error) created++
        }
      }

      await loadProjects()
      alert(`Done! Deleted ${deleted}, updated ${updated}, created ${created} project(s).`)
    } catch (e: any) {
      alert('Sync failed: ' + (e.message || 'Unknown error'))
    }
  }

  async function handleDeleteProject(p: FieldProjectAdmin) {
    const label = p.name || p.code || `ID ${p.id}`
    if (!confirm(`Delete project "${label}" and ALL its linked data? This cannot be undone.`)) return

    // Remove linked records first to avoid foreign key errors
    const tables = ['acc_draws', 'email_attachment_labels', 'manpower', 'daily_site_report']
    for (const table of tables) {
      await supabase.from(table).delete().eq('project_id', p.id)
      // Also try with project code in array columns
      if (p.code) {
        await supabase.from(table).delete().contains('projects', [p.code])
      }
    }

    const { error } = await adminDeleteProject(p.id)
    if (error) {
      alert('Error: ' + error)
    } else {
      loadProjects()
    }
  }

  function handleUseForManualRun(p: FieldProjectAdmin) {
    const settings = projectEmailSettings[p.id]
    const assignedUsers = users.filter(u => !u.allowed_projects || u.allowed_projects.length === 0 || u.allowed_projects.includes(p.code))
    const assignedEmails = assignedUsers.map(u => u.email).filter(Boolean)

    if (settings && (settings.to.length > 0 || settings.cc.length > 0)) {
      setManualTriggerTo(settings.to.join(', '))
      setManualTriggerCc(settings.cc.join(', '))
      setTriggerMsg({ type: 'success', text: `Project ${p.name} email preferences loaded` })
    } else if (assignedEmails.length > 0) {
      setManualTriggerTo(assignedEmails.join(', '))
      setManualTriggerCc('')
      setTriggerMsg({ type: 'success', text: `Project ${p.name} assigned users loaded as TO` })
    } else {
      setManualTriggerTo('')
      setManualTriggerCc('')
      setTriggerMsg({ type: 'error', text: `No TO/CC settings for ${p.name}` })
    }

    setTab('reports')
  }

  async function assignUserToProject(project: FieldProjectAdmin, userId: string) {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const existingCodes = user.allowed_projects || []
    if (existingCodes.includes(project.code)) {
      setTriggerMsg({ type: 'error', text: `${user.full_name} is already assigned to ${project.name}` })
      return
    }

    const nextCodes = [...existingCodes, project.code]
    const { error } = await adminAssignProjects(user.id, nextCodes)
    if (error) {
      setTriggerMsg({ type: 'error', text: `Assign failed: ${error}` })
    } else {
      setTriggerMsg({ type: 'success', text: `${user.full_name} assigned to ${project.name}` })
      await loadUsers()
      setAssignProjectUser(prev => ({ ...prev, [project.id]: '' }))
    }
  }

  async function removeUserFromProject(project: FieldProjectAdmin, userId: string) {
    const user = users.find(u => u.id === userId)
    if (!user) return

    if (!user.allowed_projects || user.allowed_projects.length === 0) {
      setTriggerMsg({ type: 'error', text: `${user.full_name} has global access; remove via user settings` })
      return
    }

    const nextCodes = user.allowed_projects.filter(code => code !== project.code)
    const { error } = await adminAssignProjects(user.id, nextCodes.length > 0 ? nextCodes : null)
    if (error) {
      setTriggerMsg({ type: 'error', text: `Remove failed: ${error}` })
    } else {
      setTriggerMsg({ type: 'success', text: `${user.full_name} removed from ${project.name}` })
      await loadUsers()
    }
  }

  async function handleSaveAssignment() {
    if (!assignUser) return
    setSavingAssign(true)
    setAssignMsg(null)
    const codes = assignAllAccess ? null : assignedCodes
    const { error } = await adminAssignProjects(assignUser.id, codes)
    if (error) {
      setAssignMsg({ type: 'error', text: error })
    } else {
      setAssignMsg({ type: 'success', text: `Projects assigned to ${assignUser.full_name}!` })
      loadUsers()
      setTimeout(() => { setAssignUser(null); setAssignMsg(null) }, 1500)
    }
    setSavingAssign(false)
  }

  // --- Reports / Trigger handlers ---
  async function callEdgeFunction(body: any) {
    const { data: { session } } = await supabase.auth.refreshSession()
    if (!session?.access_token) throw new Error('Not authenticated')
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-daily-report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      }
    )
    return { data: await res.json(), ok: res.ok, status: res.status }
  }

  async function pollRunStatus(runId: string) {
    setActiveRunId(runId)
    setRunStatus({ status: 'QUEUED' })
    const poll = async () => {
      try {
        const { data, ok } = await callEdgeFunction({ action: 'get-run-status', runId })
        if (ok && data.success && data.run) {
          setRunStatus(data.run)
          const s = data.run.status
          if (s === 'COMPLETED' || s === 'FAILED' || s === 'CANCELED' || s === 'SYSTEM_FAILURE' || s === 'CRASHED') {
            setTriggerRunning(false)
            if (s === 'COMPLETED') {
              setTriggerMsg({ type: 'success', text: `Workflow completed! Processed in ${((data.run.durationMs || 0) / 1000).toFixed(1)}s` })
            } else {
              setTriggerMsg({ type: 'error', text: `Workflow ${s.toLowerCase()}` })
            }
            return
          }
          setTimeout(poll, 3000)
        } else {
          setTimeout(poll, 3000)
        }
      } catch {
        setTimeout(poll, 5000)
      }
    }
    poll()
  }

  async function handleManualTrigger() {
    setTriggerRunning(true)
    setTriggerMsg(null)
    setRunStatus(null)
    setActiveRunId(null)
    try {
      const toJson = JSON.stringify(manualTriggerTo.split(',').map(s => s.trim()).filter(Boolean))
      const ccJson = JSON.stringify(manualTriggerCc.split(',').map(s => s.trim()).filter(Boolean))
      const { data, ok, status } = await callEdgeFunction({ action: 'trigger', to: manualTriggerTo, cc: manualTriggerCc, toJson, ccJson })
      if (ok && data.success) {
        const runId = data.run?.id
        if (runId) {
          pollRunStatus(runId)
        } else {
          setTriggerMsg({ type: 'success', text: 'Workflow triggered!' })
          setTriggerRunning(false)
        }
      } else {
        const detail = data?.details ? ` — ${JSON.stringify(data.details)}` : ''
        setTriggerMsg({ type: 'error', text: `[${status}] ${data?.error || 'Failed'}${detail}` })
        setTriggerRunning(false)
      }
    } catch (err: any) {
      setTriggerMsg({ type: 'error', text: err.message || 'Failed to trigger workflow' })
      setTriggerRunning(false)
    }
  }

  async function handleSaveSchedule() {
    setSavingSchedule(true)
    setScheduleMsg(null)
    try {
      const cron = `${parseInt(scheduleMinute, 10)} ${parseInt(scheduleHour, 10)} * * *`
      const { data, ok } = await callEdgeFunction({ action: 'update-schedule', cron, timezone: scheduleTimezone })
      if (ok && data?.success) {
        setCurrentSchedule({ cron, timezone: scheduleTimezone })
        setScheduleMsg({ type: 'success', text: 'Schedule updated successfully!' })
        setShowScheduleEditor(false)
      } else {
        setScheduleMsg({ type: 'error', text: data?.error || 'Failed to update schedule' })
      }
    } catch (err: any) {
      setScheduleMsg({ type: 'error', text: err.message || 'Failed to update schedule' })
    }
    setSavingSchedule(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: `1px solid ${C.outlineVariant}60`, background: C.surfaceContainerLow,
    fontSize: 13, color: C.onSurface, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'Inter, sans-serif',
  }

  const btnPrimary = {
    padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: C.primary, color: '#fff', fontWeight: 700 as const, fontSize: 13,
    fontFamily: 'Manrope, sans-serif', transition: 'all 150ms',
  }

  const btnSecondary = {
    padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.outlineVariant}40`,
    background: C.surfaceContainerLow, color: C.onSurface, fontWeight: 600 as const,
    fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  }

  function renderMsg(msg: { type: 'success' | 'error'; text: string } | null) {
    if (!msg) return null
    return (
      <div style={{
        fontSize: 12, borderRadius: 8, padding: '10px 14px', marginTop: 12,
        background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(187,27,33,0.1)',
        color: msg.type === 'success' ? '#16a34a' : C.tertiary,
        border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(187,27,33,0.2)'}`,
      }}>
        {msg.text}
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'users', label: 'Users',
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
    {
      key: 'projects', label: 'Projects',
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },
    {
      key: 'assignments', label: 'Assignments',
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    },
    {
      key: 'reports', label: 'Reports',
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
  ]

  return (
    <div style={{ background: C.surface, minHeight: '100vh', color: C.onSurface, fontFamily: 'Inter, system-ui, sans-serif' }}>

      <Navbar activePage="admin" showNewReport={false} />

      {/* ===== Tab Bar ===== */}
      <div style={{ background: C.surfaceContainerLowest, borderBottom: `1px solid ${C.outlineVariant}30` }}>
        <style>{`.admin-tabs-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="flex gap-0 max-w-screen-2xl mx-auto px-4 md:px-10 overflow-x-auto admin-tabs-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? C.primary : C.onSurfaceVariant,
                borderBottom: tab === t.key ? `2px solid ${C.primary}` : '2px solid transparent',
                transition: 'all 150ms',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Content ===== */}
      <main className="max-w-screen-2xl mx-auto p-4 md:p-8 lg:p-12">

        {/* ===== USERS TAB ===== */}
        {tab === 'users' && (
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 22, color: C.onSurface, margin: 0 }}>User Management</h2>
                <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0' }}>{users.length} users total</p>
              </div>
              <button onClick={() => { setShowCreateUser(true); setCreateUserMsg(null); setNewUser({ email: '', password: '', full_name: '', role: 'member' }) }} style={btnPrimary}>
                + Add User
              </button>
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.onSurfaceVariant }}>Loading users...</div>
            ) : (
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.outlineVariant}30`, overflow: 'hidden' }}>
                {/* Table header */}
                <div className="hidden md:grid" style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1.5fr', padding: '12px 20px', background: C.surfaceContainer, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant }}>
                  <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Projects</span><span>Actions</span>
                </div>
                {users.map(u => (
                  <div key={u.id} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1.5fr]" style={{ padding: '14px 20px', borderTop: `1px solid ${C.outlineVariant}15`, alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.primaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.onPrimaryContainer, flexShrink: 0 }}>
                        {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.onSurface }}>{u.full_name || '—'}</span>
                    </div>
                    <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>{u.email}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: u.role === 'admin' ? C.primary : C.onSurfaceVariant, textTransform: 'capitalize' }}>{u.role}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.is_active ? '#22c55e' : C.tertiary }} />
                      <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </span>
                    <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>
                      {!u.allowed_projects || u.allowed_projects.length === 0 ? 'All' : u.allowed_projects.length + ' assigned'}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setEditingUser(u); setEditUserForm({ full_name: u.full_name, role: u.role, is_active: u.is_active }); setEditUserMsg(null) }}
                        style={{ ...btnSecondary, padding: '6px 12px', fontSize: 11 }}
                      >Edit</button>
                      <button
                        onClick={() => { setResetUserId(u.id); setResetPassword(''); setResetMsg(null) }}
                        style={{ ...btnSecondary, padding: '6px 12px', fontSize: 11 }}
                      >Reset PW</button>
                      {u.is_active && u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          style={{ ...btnSecondary, padding: '6px 12px', fontSize: 11, color: C.tertiary, borderColor: `${C.tertiary}40` }}
                        >Deactivate</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PROJECTS TAB ===== */}
        {tab === 'projects' && (
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 22, color: C.onSurface, margin: 0 }}>Project Management</h2>
                <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0' }}>{projects.length} projects total</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSyncProjects} style={{ ...btnPrimary, background: '#cfe6f2', color: '#2d424c' }}>
                  Sync 6 Projects
                </button>
                <button onClick={() => { setShowCreateProject(true); setCreateProjectMsg(null); setNewProject({ name: '', code: '', superintendent: '', address: '' }) }} style={btnPrimary}>
                  + Add Project
                </button>
              </div>
            </div>

            {loadingProjects ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.onSurfaceVariant }}>Loading projects...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map(p => (
                  <div key={p.id} style={{ background: C.surfaceContainerLowest, borderRadius: 12, padding: 20, border: `1px solid ${C.outlineVariant}30` }}>
                    <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: `${C.primary}15`, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.code}</span>
                        <h3>
                          <button
                            onClick={() => setSelectedProjectId(selectedProjectId === p.id ? null : p.id)}
                            style={{
                              fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: C.primary, margin: '8px 0 4px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left'
                            }}
                          >
                            {p.name}
                          </button>
                        </h3>
                      </div>
                    </div>
                    {p.superintendent && (
                      <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {p.superintendent}
                      </p>
                    )}
                    {p.address && (
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {p.address}
                      </p>
                    )}

                    {selectedProjectId === p.id && (() => {
                      const assignedUsers = users.filter(u => !u.allowed_projects || u.allowed_projects.length === 0 || u.allowed_projects.includes(p.code))
                      const unassignedUsers = users.filter(u => u.allowed_projects && u.allowed_projects.length > 0 && !u.allowed_projects.includes(p.code))
                      const settings = projectEmailSettings[p.id] || { to: [], cc: [] }

                      return (
                        <div style={{ marginTop: 12, borderTop: `1px solid ${C.outlineVariant}20`, paddingTop: 12 }}>
                          <div style={{ marginBottom: 8 }}>
                            <strong style={{ fontSize: 12, color: C.onSurface }}>Assigned Users ({assignedUsers.length})</strong>
                            <div style={{ marginTop: 8, display: 'grid', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                              {assignedUsers.length === 0 ? (
                                <div style={{ fontSize: 12, color: C.onSurfaceVariant }}>No users assigned</div>
                              ) : assignedUsers.map(u => (
                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceContainer, borderRadius: 8, padding: '6px 8px' }}>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.onSurface }}>{u.full_name || 'Unknown'}</div>
                                    <div style={{ fontSize: 11, color: C.onSurfaceVariant }}>{u.email}</div>
                                  </div>
                                  <button
                                    onClick={() => removeUserFromProject(p, u.id)}
                                    style={{ ...btnSecondary, padding: '4px 10px', fontSize: 10, color: C.tertiary, borderColor: `${C.tertiary}40` }}
                                  >Remove</button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select
                              value={assignProjectUser[p.id] || ''}
                              onChange={(e) => setAssignProjectUser(prev => ({ ...prev, [p.id]: e.target.value }))}
                              style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${C.outlineVariant}30` }}
                            >
                              <option value="">Add user...</option>
                              {unassignedUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.email})</option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const userId = assignProjectUser[p.id]
                                if (userId) assignUserToProject(p, userId)
                              }}
                              disabled={!assignProjectUser[p.id]}
                              style={{ ...btnPrimary, padding: '8px 12px', fontSize: 12 }}
                            >Assign</button>
                          </div>

                          <div style={{ marginBottom: 10 }}>
                            <strong style={{ fontSize: 12, color: C.onSurface }}>TO recipients</strong>
                            <div style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 4px' }}>Use Ctrl + click to pick multiple entries.</div>
                            <select
                              multiple
                              value={settings.to}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions).map(o => o.value)
                                setProjectEmailSettings(prev => ({ ...prev, [p.id]: { ...settings, to: selected } }))
                              }}
                              style={{ width: '100%', minHeight: 84, marginTop: 6, padding: '8px', borderRadius: 8, border: `1px solid ${C.outlineVariant}30` }}
                            >
                              {assignedUsers.map(u => (<option key={u.id} value={u.email}>{u.full_name || u.email} ({u.email})</option>))}
                            </select>
                          </div>

                          <div style={{ marginBottom: 10 }}>
                            <strong style={{ fontSize: 12, color: C.onSurface }}>CC recipients</strong>
                            <div style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 4px' }}>Use Ctrl + click to pick multiple entries.</div>
                            <select
                              multiple
                              value={settings.cc}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions).map(o => o.value)
                                setProjectEmailSettings(prev => ({ ...prev, [p.id]: { ...settings, cc: selected } }))
                              }}
                              style={{ width: '100%', minHeight: 84, marginTop: 6, padding: '8px', borderRadius: 8, border: `1px solid ${C.outlineVariant}30` }}
                            >
                              {assignedUsers.map(u => (<option key={u.id} value={u.email}>{u.full_name || u.email} ({u.email})</option>))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleUseForManualRun(p)}
                              style={{ ...btnSecondary, padding: '6px 12px', fontSize: 11 }}
                            >Use for manual run</button>
                            <small style={{ fontSize: 10, color: C.onSurfaceVariant, alignSelf: 'center' }}>Use selected TO/CC and switch to Reports tab.</small>
                          </div>
                        </div>
                      )
                    })()}

                    <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${C.outlineVariant}20`, paddingTop: 12 }}>
                      <button
                        onClick={() => { setEditingProject(p); setEditProjectForm({ name: p.name, code: p.code, superintendent: p.superintendent || '', address: p.address || '' }); setEditProjectMsg(null) }}
                        style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12, flex: 1 }}
                      >Edit</button>
                      <button
                        onClick={() => handleDeleteProject(p)}
                        style={{ ...btnSecondary, padding: '8px 16px', fontSize: 12, color: C.tertiary, borderColor: `${C.tertiary}40` }}
                      >Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== REPORTS TAB ===== */}
        {tab === 'reports' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 22, color: C.onSurface, margin: 0 }}>Daily Report Workflow</h2>
              <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0' }}>Trigger the daily report generation manually or manage the automated schedule.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Manual Trigger Card */}
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.outlineVariant}30`, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={C.primary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 17, color: C.onSurface, margin: 0 }}>Run Now</h3>
                    <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 0' }}>Manually trigger the daily report workflow</p>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.6, marginBottom: 20 }}>
                  This will fetch yesterday's reports from Supabase, generate AI-polished PDFs, and email them to the team. Use this if the scheduled run was missed or you need to re-process reports.
                </p>

                <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                  <input
                    type="text"
                    value={manualTriggerTo}
                    onChange={(e) => setManualTriggerTo(e.target.value)}
                    placeholder="Trigger email TO (comma-separated)"
                    style={{ padding: '10px', borderRadius: 8, border: `1px solid ${C.outlineVariant}30` }}
                  />
                  <input
                    type="text"
                    value={manualTriggerCc}
                    onChange={(e) => setManualTriggerCc(e.target.value)}
                    placeholder="Trigger email CC (comma-separated)"
                    style={{ padding: '10px', borderRadius: 8, border: `1px solid ${C.outlineVariant}30` }}
                  />
                </div>

                {renderMsg(triggerMsg)}

                <button
                  onClick={handleManualTrigger}
                  disabled={triggerRunning}
                  style={{
                    ...btnPrimary,
                    width: '100%',
                    marginTop: triggerMsg ? 12 : 0,
                    opacity: triggerRunning ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {triggerRunning ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      Running...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                      Run Daily Reports Now
                    </>
                  )}
                </button>

                {/* Run Progress */}
                {runStatus && (
                  <div style={{
                    marginTop: 16, padding: '14px 18px', borderRadius: 8,
                    background: runStatus.status === 'COMPLETED' ? 'rgba(34,197,94,0.08)' :
                                runStatus.status === 'FAILED' || runStatus.status === 'CRASHED' ? 'rgba(187,27,33,0.08)' :
                                `${C.primary}08`,
                    border: `1px solid ${
                      runStatus.status === 'COMPLETED' ? 'rgba(34,197,94,0.2)' :
                      runStatus.status === 'FAILED' || runStatus.status === 'CRASHED' ? 'rgba(187,27,33,0.2)' :
                      `${C.primary}25`
                    }`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {['QUEUED', 'EXECUTING', 'PENDING_VERSION', 'REATTEMPTING'].includes(runStatus.status) ? (
                        <span style={{ width: 14, height: 14, border: `2px solid ${C.primary}40`, borderTopColor: C.primary, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      ) : runStatus.status === 'COMPLETED' ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.tertiary} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: runStatus.status === 'COMPLETED' ? '#16a34a' :
                               runStatus.status === 'FAILED' || runStatus.status === 'CRASHED' ? C.tertiary : C.primary,
                      }}>
                        {runStatus.status === 'QUEUED' ? 'Queued — waiting to start...' :
                         runStatus.status === 'EXECUTING' ? 'Running — generating reports...' :
                         runStatus.status === 'COMPLETED' ? 'Completed' :
                         runStatus.status === 'FAILED' ? 'Failed' :
                         runStatus.status}
                      </span>
                    </div>
                    {activeRunId && (
                      <div style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: 'monospace' }}>
                        Run: {activeRunId}
                        {runStatus.durationMs ? ` · ${(runStatus.durationMs / 1000).toFixed(1)}s` : ''}
                      </div>
                    )}
                    {runStatus.status === 'COMPLETED' && runStatus.output && (
                      <div style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 6 }}>
                        {runStatus.output.message || JSON.stringify(runStatus.output)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.outlineVariant}30`, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={C.primary} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 17, color: C.onSurface, margin: 0 }}>Schedule</h3>
                    <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '2px 0 0' }}>Automated daily report generation</p>
                  </div>
                </div>

                {/* Current schedule display */}
                {scheduleLoading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: C.onSurfaceVariant, fontSize: 13 }}>Loading schedule...</div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      padding: '14px 18px', borderRadius: 8,
                      background: currentSchedule ? `${C.primary}08` : C.surfaceContainerLow,
                      border: currentSchedule ? `1px solid ${C.primary}25` : `1px solid ${C.outlineVariant}30`,
                    }}>
                      {currentSchedule ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.primary, marginBottom: 6 }}>
                            Current Schedule
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                            {(() => {
                              const parts = currentSchedule.cron.split(' ')
                              if (parts.length >= 2) {
                                const h = parseInt(parts[1], 10)
                                const m = parseInt(parts[0], 10)
                                const ampm = h >= 12 ? 'PM' : 'AM'
                                const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
                                return `${h12}:${String(m).padStart(2, '0')} ${ampm} daily`
                              }
                              return currentSchedule.cron
                            })()}
                          </div>
                          <div style={{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 }}>
                            Timezone: {currentSchedule.timezone}
                          </div>
                          <div style={{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 2, fontFamily: 'monospace' }}>
                            Cron: {currentSchedule.cron}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: C.onSurfaceVariant }}>
                          No schedule configured yet. Set one up below.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule editor */}
                {!showScheduleEditor ? (
                  <button
                    onClick={() => setShowScheduleEditor(true)}
                    style={{ ...btnSecondary, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {currentSchedule ? 'Change Schedule' : 'Set Schedule'}
                  </button>
                ) : (
                  <div style={{ padding: '16px 18px', borderRadius: 8, background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}30` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, marginBottom: 12 }}>
                      Set Daily Run Time
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 4 }}>Hour</label>
                        <select
                          value={scheduleHour}
                          onChange={e => setScheduleHour(e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={String(i).padStart(2, '0')}>
                              {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 4 }}>Minute</label>
                        <select
                          value={scheduleMinute}
                          onChange={e => setScheduleMinute(e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          {['00', '15', '30', '45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 4 }}>Timezone</label>
                      <select
                        value={scheduleTimezone}
                        onChange={e => setScheduleTimezone(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="America/New_York">Eastern (ET)</option>
                        <option value="America/Chicago">Central (CT)</option>
                        <option value="America/Denver">Mountain (MT)</option>
                        <option value="America/Los_Angeles">Pacific (PT)</option>
                      </select>
                    </div>

                    {renderMsg(scheduleMsg)}

                    <div style={{ display: 'flex', gap: 8, marginTop: scheduleMsg ? 12 : 0 }}>
                      <button
                        onClick={() => { setShowScheduleEditor(false); setScheduleMsg(null) }}
                        style={{ ...btnSecondary, flex: 1 }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveSchedule}
                        disabled={savingSchedule}
                        style={{ ...btnPrimary, flex: 1, opacity: savingSchedule ? 0.6 : 1 }}
                      >
                        {savingSchedule ? 'Saving...' : 'Save Schedule'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== ASSIGNMENTS TAB ===== */}
        {tab === 'assignments' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 22, color: C.onSurface, margin: 0 }}>Project Assignments</h2>
              <p style={{ fontSize: 13, color: C.onSurfaceVariant, margin: '4px 0 0' }}>Assign projects to users. Click a user to manage their project access.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User list */}
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.outlineVariant}30`, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: C.surfaceContainer, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant }}>
                  Select User
                </div>
                {users.map(u => {
                  const selected = assignUser?.id === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setAssignUser(u)
                        setAssignedCodes(u.allowed_projects || [])
                        setAssignAllAccess(!u.allowed_projects || u.allowed_projects.length === 0)
                        setAssignMsg(null)
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '12px 20px', border: 'none', cursor: 'pointer',
                        background: selected ? `${C.primary}10` : 'transparent',
                        borderLeft: selected ? `3px solid ${C.primary}` : '3px solid transparent',
                        borderBottom: `1px solid ${C.outlineVariant}10`,
                        display: 'flex', alignItems: 'center', gap: 10, transition: 'all 100ms',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: selected ? C.primary : C.primaryFixed, color: selected ? '#fff' : C.onPrimaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{u.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: C.onSurfaceVariant }}>{u.email}</div>
                      </div>
                      <span style={{ fontSize: 10, color: C.onSurfaceVariant, flexShrink: 0 }}>
                        {!u.allowed_projects || u.allowed_projects.length === 0 ? 'All' : u.allowed_projects.length}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Assignment panel */}
              <div style={{ background: C.surfaceContainerLowest, borderRadius: 12, border: `1px solid ${C.outlineVariant}30`, padding: 24 }}>
                {!assignUser ? (
                  <div style={{ textAlign: 'center', padding: 40, color: C.onSurfaceVariant }}>
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke={C.outlineVariant} strokeWidth={1.5} style={{ margin: '0 auto 16px', display: 'block' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>Select a user to manage their project assignments</p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: C.onSurface, margin: '0 0 4px' }}>
                        {assignUser.full_name}
                      </h3>
                      <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: 0 }}>{assignUser.email}</p>
                    </div>

                    {/* All access toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer', padding: '12px 16px', background: assignAllAccess ? `${C.primary}10` : C.surfaceContainerLow, borderRadius: 8, border: assignAllAccess ? `1.5px solid ${C.primary}` : `1px solid ${C.outlineVariant}30` }}>
                      <input
                        type="checkbox"
                        checked={assignAllAccess}
                        onChange={e => {
                          setAssignAllAccess(e.target.checked)
                          if (e.target.checked) setAssignedCodes([])
                        }}
                        style={{ accentColor: C.primary, width: 16, height: 16 }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface }}>All Projects Access</div>
                        <div style={{ fontSize: 11, color: C.onSurfaceVariant }}>User can access every project</div>
                      </div>
                    </label>

                    {/* Project checkboxes */}
                    {!assignAllAccess && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.onSurfaceVariant, marginBottom: 4 }}>
                          Select Projects ({assignedCodes.length} selected)
                        </div>
                        {projects.map(p => {
                          const checked = assignedCodes.includes(p.code)
                          return (
                            <label
                              key={p.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                background: checked ? `${C.primary}08` : C.surfaceContainerLow,
                                borderRadius: 8, cursor: 'pointer',
                                border: checked ? `1.5px solid ${C.primary}40` : `1px solid ${C.outlineVariant}20`,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => {
                                  if (e.target.checked) setAssignedCodes([...assignedCodes, p.code])
                                  else setAssignedCodes(assignedCodes.filter(c => c !== p.code))
                                }}
                                style={{ accentColor: C.primary, width: 15, height: 15 }}
                              />
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, background: `${C.primary}15`, padding: '2px 8px', borderRadius: 4 }}>{p.code}</span>
                              <span style={{ fontSize: 13, color: C.onSurface, fontWeight: 500 }}>{p.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {renderMsg(assignMsg)}

                    <button
                      onClick={handleSaveAssignment}
                      disabled={savingAssign}
                      style={{ ...btnPrimary, width: '100%', marginTop: 12, opacity: savingAssign ? 0.6 : 1 }}
                    >
                      {savingAssign ? 'Saving...' : 'Save Assignments'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== MODALS ===== */}

      {/* Create User Modal */}
      {showCreateUser && (
        <>
          <div onClick={() => setShowCreateUser(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <div style={{ position: 'fixed', zIndex: 70, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 440, background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Create New User</h3>
              <button onClick={() => setShowCreateUser(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                <input value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="John Doe" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Email</label>
                <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@boulderconstruction.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Password</label>
                <input type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {renderMsg(createUserMsg)}
              <button onClick={handleCreateUser} disabled={creatingUser} style={{ ...btnPrimary, width: '100%', marginTop: 4, opacity: creatingUser ? 0.6 : 1 }}>
                {creatingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <>
          <div onClick={() => setEditingUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <div style={{ position: 'fixed', zIndex: 70, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 440, background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Edit User</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '0 0 16px' }}>{editingUser.email}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Full Name</label>
                <input value={editUserForm.full_name} onChange={e => setEditUserForm({ ...editUserForm, full_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Role</label>
                <select value={editUserForm.role} onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={editUserForm.is_active} onChange={e => setEditUserForm({ ...editUserForm, is_active: e.target.checked })} style={{ accentColor: C.primary, width: 16, height: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: C.onSurface }}>Active</span>
              </label>
              {renderMsg(editUserMsg)}
              <button onClick={handleEditUser} disabled={savingUser} style={{ ...btnPrimary, width: '100%', marginTop: 4, opacity: savingUser ? 0.6 : 1 }}>
                {savingUser ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <>
          <div onClick={() => setResetUserId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <div style={{ position: 'fixed', zIndex: 70, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 400, background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: '0 0 8px' }}>Reset Password</h3>
            <p style={{ fontSize: 12, color: C.onSurfaceVariant, margin: '0 0 16px' }}>
              For: {users.find(u => u.id === resetUserId)?.full_name || users.find(u => u.id === resetUserId)?.email}
            </p>
            <input type="text" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New password (min 6 chars)" style={inputStyle} />
            {renderMsg(resetMsg)}
            <div className="flex gap-3" style={{ marginTop: 16 }}>
              <button onClick={() => setResetUserId(null)} style={btnSecondary}>Cancel</button>
              <button onClick={handleResetPassword} disabled={resetting || resetPassword.length < 6} style={{ ...btnPrimary, flex: 1, opacity: (resetting || resetPassword.length < 6) ? 0.5 : 1 }}>
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <>
          <div onClick={() => setShowCreateProject(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <div style={{ position: 'fixed', zIndex: 70, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 440, background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Create New Project</h3>
              <button onClick={() => setShowCreateProject(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Project Name</label>
                <input value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="Highlands West" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Project Code</label>
                <input value={newProject.code} onChange={e => setNewProject({ ...newProject, code: e.target.value.toUpperCase() })} placeholder="HWSG" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Superintendent</label>
                <input value={newProject.superintendent} onChange={e => setNewProject({ ...newProject, superintendent: e.target.value })} placeholder="John Smith" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Address</label>
                <input value={newProject.address} onChange={e => setNewProject({ ...newProject, address: e.target.value })} placeholder="123 Main St, Boulder, CO" style={inputStyle} />
              </div>
              {renderMsg(createProjectMsg)}
              <button onClick={handleCreateProject} disabled={creatingProject} style={{ ...btnPrimary, width: '100%', marginTop: 4, opacity: creatingProject ? 0.6 : 1 }}>
                {creatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <>
          <div onClick={() => setEditingProject(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <div style={{ position: 'fixed', zIndex: 70, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 440, background: C.surfaceContainerLowest, borderRadius: 12, padding: 32, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 18, color: C.onSurface, margin: 0 }}>Edit Project</h3>
              <button onClick={() => setEditingProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onSurfaceVariant, padding: 4 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Project Name</label>
                <input value={editProjectForm.name} onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Project Code</label>
                <input value={editProjectForm.code} onChange={e => setEditProjectForm({ ...editProjectForm, code: e.target.value.toUpperCase() })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Superintendent</label>
                <input value={editProjectForm.superintendent} onChange={e => setEditProjectForm({ ...editProjectForm, superintendent: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: C.onSurfaceVariant, fontWeight: 600, marginBottom: 6 }}>Address</label>
                <input value={editProjectForm.address} onChange={e => setEditProjectForm({ ...editProjectForm, address: e.target.value })} style={inputStyle} />
              </div>
              {renderMsg(editProjectMsg)}
              <button onClick={handleEditProject} disabled={savingProject} style={{ ...btnPrimary, width: '100%', marginTop: 4, opacity: savingProject ? 0.6 : 1 }}>
                {savingProject ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
