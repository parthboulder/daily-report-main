import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ===== Types =====

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  allowed_projects: string[] | null // null or empty = ALL access
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMicrosoft: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
  sessionExpiresAt: number | null // unix timestamp
  loginAttempts: number
  lockoutUntil: number | null
  isAdmin: boolean
  fetchAllUsers: () => Promise<UserProfile[]>
  adminResetPassword: (targetUserId: string, newPassword: string) => Promise<{ error: string | null }>
  adminCreateUser: (email: string, password: string, fullName: string, role: string) => Promise<{ error: string | null }>
  adminUpdateUser: (userId: string, updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'is_active' | 'allowed_projects'>>) => Promise<{ error: string | null }>
  adminDeleteUser: (userId: string) => Promise<{ error: string | null }>
  adminFetchProjects: () => Promise<FieldProjectAdmin[]>
  adminCreateProject: (project: Omit<FieldProjectAdmin, 'id'>) => Promise<{ error: string | null }>
  adminUpdateProject: (id: string, updates: Partial<Omit<FieldProjectAdmin, 'id'>>) => Promise<{ error: string | null }>
  adminDeleteProject: (id: string) => Promise<{ error: string | null }>
  adminAssignProjects: (userId: string, projectCodes: string[] | null) => Promise<{ error: string | null }>
}

export interface FieldProjectAdmin {
  id: string
  name: string
  code: string
  superintendent?: string
  address?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ===== Rate Limiting Constants =====
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 2 * 60 * 1000 // 2 minutes
const LOCKOUT_STORAGE_KEY = 'auth_lockout'
const ATTEMPTS_STORAGE_KEY = 'auth_attempts'

function getLockoutState(): { attempts: number; lockoutUntil: number | null } {
  try {
    const attempts = parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10)
    const lockoutUntil = localStorage.getItem(LOCKOUT_STORAGE_KEY)
    const lockoutTs = lockoutUntil ? parseInt(lockoutUntil, 10) : null

    // Clear expired lockout
    if (lockoutTs && Date.now() > lockoutTs) {
      localStorage.removeItem(LOCKOUT_STORAGE_KEY)
      localStorage.removeItem(ATTEMPTS_STORAGE_KEY)
      return { attempts: 0, lockoutUntil: null }
    }

    return { attempts, lockoutUntil: lockoutTs }
  } catch {
    return { attempts: 0, lockoutUntil: null }
  }
}

function recordFailedAttempt(): { attempts: number; lockoutUntil: number | null } {
  try {
    const current = parseInt(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0', 10) + 1
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, String(current))

    if (current >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS
      localStorage.setItem(LOCKOUT_STORAGE_KEY, String(lockoutUntil))
      return { attempts: current, lockoutUntil }
    }

    return { attempts: current, lockoutUntil: null }
  } catch {
    return { attempts: 0, lockoutUntil: null }
  }
}

function clearLoginAttempts() {
  try {
    localStorage.removeItem(ATTEMPTS_STORAGE_KEY)
    localStorage.removeItem(LOCKOUT_STORAGE_KEY)
  } catch { /* ignore */ }
}

// ===== Provider =====

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize lockout state
  useEffect(() => {
    const state = getLockoutState()
    setLoginAttempts(state.attempts)
    setLockoutUntil(state.lockoutUntil)
  }, [])

  // Fetch user profile from user_profiles table
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const p = data as UserProfile | null
    setProfile(p)
    return p
  }, [])

  // Refresh profile (callable from outside)
  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  // Schedule token refresh before expiry
  const scheduleTokenRefresh = useCallback((sess: Session) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)

    const expiresAt = sess.expires_at
    if (!expiresAt) return

    setSessionExpiresAt(expiresAt)

    // Refresh 60 seconds before expiry
    const msUntilRefresh = (expiresAt * 1000) - Date.now() - 60_000
    if (msUntilRefresh <= 0) {
      // Token already near expiry, refresh now
      supabase.auth.refreshSession()
      return
    }

    refreshTimerRef.current = setTimeout(() => {
      supabase.auth.refreshSession()
    }, msUntilRefresh)
  }, [])

  // Handle session changes
  const handleSession = useCallback(async (s: Session | null) => {
    setSession(s)
    setUser(s?.user ?? null)

    if (s?.user) {
      const p = await fetchProfile(s.user.id)
      scheduleTokenRefresh(s)

      // Check if user account is deactivated
      if (p && !p.is_active) {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
        setSessionExpiresAt(null)
        return
      }
    } else {
      setProfile(null)
      setSessionExpiresAt(null)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [fetchProfile, scheduleTokenRefresh])

  // Initialize auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s).then(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s)
    })

    return () => {
      subscription.unsubscribe()
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [handleSession])

  // ===== Sign In with rate limiting + active check =====
  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    // Check lockout
    const lockState = getLockoutState()
    if (lockState.lockoutUntil && Date.now() < lockState.lockoutUntil) {
      const secsLeft = Math.ceil((lockState.lockoutUntil - Date.now()) / 1000)
      setLockoutUntil(lockState.lockoutUntil)
      return { error: `Too many failed attempts. Try again in ${secsLeft} seconds.` }
    }

    // Step 1: Verify password against user_passwords table via edge function
    let useDirectAuth = false
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const verifyResp = await fetch(`${supabaseUrl}/functions/v1/manage-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action: 'verify', email, password }),
      })
      const verifyJson = await verifyResp.json()

      if (!verifyResp.ok) {
        // Edge function returned an explicit error (wrong password, deactivated, etc.)
        const state = recordFailedAttempt()
        setLoginAttempts(state.attempts)
        setLockoutUntil(state.lockoutUntil)

        if (state.lockoutUntil) {
          return { error: 'Too many failed attempts. Account locked for 2 minutes.' }
        }
        const remaining = MAX_LOGIN_ATTEMPTS - state.attempts
        if (remaining <= 2 && remaining > 0) {
          return { error: `${verifyJson.error || 'Invalid credentials'} (${remaining} attempt${remaining > 1 ? 's' : ''} remaining)` }
        }
        return { error: verifyJson.error || 'Invalid login credentials' }
      }

      // If user_passwords has no entry yet, fall back to direct Supabase Auth
      if (verifyJson.fallback) {
        useDirectAuth = true
      }
    } catch {
      // Edge function unreachable — fall back to direct Supabase Auth
      useDirectAuth = true
    }

    // Step 2: Sign in via Supabase Auth to get JWT session
    // (manage-password already synced the password to auth.users if needed)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (!useDirectAuth) {
        // Password was verified by our table but Supabase Auth sync failed — unusual
        // Still record as failure for rate limiting
      }
      const state = recordFailedAttempt()
      setLoginAttempts(state.attempts)
      setLockoutUntil(state.lockoutUntil)

      if (state.lockoutUntil) {
        return { error: 'Too many failed attempts. Account locked for 2 minutes.' }
      }
      const remaining = MAX_LOGIN_ATTEMPTS - state.attempts
      if (remaining <= 2 && remaining > 0) {
        return { error: `${error.message} (${remaining} attempt${remaining > 1 ? 's' : ''} remaining)` }
      }
      return { error: error.message }
    }

    // Success — check if user is active
    if (data.user) {
      const p = await fetchProfile(data.user.id)

      if (p && !p.is_active) {
        await supabase.auth.signOut()
        return { error: 'Your account has been deactivated. Contact your administrator.' }
      }
    }

    // Clear rate limiting on successful login
    clearLoginAttempts()
    setLoginAttempts(0)
    setLockoutUntil(null)

    return { error: null }
  }

  // ===== Sign In with Microsoft (Boulder Construction tenant only) =====
  async function signInWithMicrosoft(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'openid email profile',
        queryParams: {
          tenant: import.meta.env.VITE_AZURE_TENANT_ID || '',
        },
        redirectTo: window.location.origin + '/login',
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  // ===== Sign Out =====
  async function signOut() {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    await supabase.auth.signOut()
    setProfile(null)
    setSessionExpiresAt(null)
  }

  // ===== Update Password (self-service via user_passwords table) =====
  async function updatePassword(newPassword: string) {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session?.access_token) return { error: 'Not authenticated' }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const resp = await fetch(`${supabaseUrl}/functions/v1/manage-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ action: 'update-own', newPassword }),
      })

      const json = await resp.json()
      if (!resp.ok) {
        return { error: json.error || `HTTP ${resp.status}` }
      }
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Failed to update password' }
    }
  }

  // ===== Admin: Check if current user is admin =====
  const isAdmin = profile?.role === 'admin'

  // ===== Admin: Fetch all users from user_profiles =====
  async function fetchAllUsers(): Promise<UserProfile[]> {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name')
    return (data as UserProfile[]) || []
  }

  // ===== Admin: Reset another user's password via Edge Function =====
  async function adminResetPassword(targetUserId: string, newPassword: string): Promise<{ error: string | null }> {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session?.access_token) return { error: 'Not authenticated' }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const resp = await fetch(`${supabaseUrl}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ targetUserId, newPassword }),
      })

      const json = await resp.json()
      if (!resp.ok) {
        return { error: json.error || `HTTP ${resp.status}` }
      }
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Failed to reset password' }
    }
  }

  // ===== Admin: Create a new user (via Edge Function) =====
  async function adminCreateUser(email: string, password: string, fullName: string, role: string): Promise<{ error: string | null }> {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session?.access_token) return { error: 'Not authenticated' }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const resp = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const json = await resp.json()
      if (!resp.ok) {
        return { error: json.error || `HTTP ${resp.status}` }
      }
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Failed to create user' }
    }
  }

  // ===== Admin: Update user profile =====
  async function adminUpdateUser(userId: string, updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'is_active' | 'allowed_projects'>>): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
    if (error) return { error: error.message }
    return { error: null }
  }

  // ===== Admin: Delete user (deactivate) =====
  async function adminDeleteUser(userId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: false })
      .eq('id', userId)
    if (error) return { error: error.message }
    return { error: null }
  }

  // ===== Admin: Fetch all projects =====
  // DB schema: name = code, project_name = display name
  async function adminFetchProjects(): Promise<FieldProjectAdmin[]> {
    const { data } = await supabase.from('projects').select('*').order('name')
    if (!data) return []
    return data.map((p: any) => ({
      id: p.id,
      code: p.name,
      name: p.project_name || p.name,
      superintendent: p.superintendent,
      address: p.address,
    }))
  }

  // ===== Admin: Create project =====
  async function adminCreateProject(project: Omit<FieldProjectAdmin, 'id'>): Promise<{ error: string | null }> {
    // Map app fields to DB columns: code→name, name→project_name
    const { error } = await supabase.from('projects').insert({
      name: project.code,
      project_name: project.name,
      superintendent: project.superintendent || null,
      address: project.address || null,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  // ===== Admin: Update project =====
  async function adminUpdateProject(id: string, updates: Partial<Omit<FieldProjectAdmin, 'id'>>): Promise<{ error: string | null }> {
    // Map app fields to DB columns
    const dbUpdates: Record<string, unknown> = {}
    if (updates.code !== undefined) dbUpdates.name = updates.code
    if (updates.name !== undefined) dbUpdates.project_name = updates.name
    if (updates.superintendent !== undefined) dbUpdates.superintendent = updates.superintendent
    if (updates.address !== undefined) dbUpdates.address = updates.address
    const { error } = await supabase.from('projects').update(dbUpdates).eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  }

  // ===== Admin: Delete project =====
  async function adminDeleteProject(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  }

  // ===== Admin: Assign projects to user =====
  async function adminAssignProjects(userId: string, projectCodes: string[] | null): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_profiles')
      .update({ allowed_projects: projectCodes })
      .eq('id', userId)
    if (error) return { error: error.message }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signIn, signInWithMicrosoft, signOut, updatePassword, refreshProfile,
      sessionExpiresAt, loginAttempts, lockoutUntil,
      isAdmin, fetchAllUsers, adminResetPassword,
      adminCreateUser, adminUpdateUser, adminDeleteUser,
      adminFetchProjects, adminCreateProject, adminUpdateProject, adminDeleteProject,
      adminAssignProjects,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ===== Hook =====

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ===== Access Control Helpers =====

export function hasAccessToProject(profile: UserProfile | null, projectCode: string): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (!profile.allowed_projects || profile.allowed_projects.length === 0) return true
  return profile.allowed_projects.includes(projectCode)
}

export function filterByAccess<T extends { code?: string; projects?: string[] | null; project_id?: number | null }>(items: T[], profile: UserProfile | null): T[] {
  if (!profile) return []
  if (profile.role === 'admin') return items
  if (!profile.allowed_projects || profile.allowed_projects.length === 0) return items
  return items.filter(item => {
    // Support both old (code/projects) and new (project_id) formats
    if (item.code) return profile.allowed_projects!.includes(item.code)
    if (item.projects) return item.projects.some(p => profile.allowed_projects!.includes(p))
    // For project_id, we need to match against allowed project codes
    // This requires looking up the project to get its code, so we check if ANY code is in allowed_projects
    // For now, if using project_id without code, allow it (admin can set what they need)
    return true
  })
}
