import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/database'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children?: React.ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to the correct dashboard based on role
    const redirectPath = role === 'scrapper' ? '/scrapper/dashboard' : '/user/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export function PublicOnlyRoute({ children }: { children?: React.ReactNode }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    const effectiveRole = role || (user.user_metadata?.role as UserRole) || 'user'
    const redirectPath = effectiveRole === 'scrapper' ? '/scrapper/dashboard' : '/user/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
