import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9f9f6' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 24, height: 24, border: '2.5px solid #E8783A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12, color: '#5a615c', fontFamily: 'Inter, sans-serif' }}>Authenticating...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // No user session — redirect to login
  if (!user) return <Navigate to="/login" replace />

  // User exists but profile says inactive — force logout
  if (profile && !profile.is_active) return <Navigate to="/login" replace />

  return <Outlet />
}
