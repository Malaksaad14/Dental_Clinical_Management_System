import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'
import type { Role } from '../types'

export function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { user, initializing } = useAuth()
  if (initializing) return <main className="center">Restoring your session...</main>
  if (!user) return <Navigate to="/login" replace />
  if (!allowed.includes(user.role)) return <Navigate to={`/${user.role === 'admin' ? 'admin' : user.role === 'patient' ? 'patient' : 'staff'}`} replace />
  return <Outlet />
}
