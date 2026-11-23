
import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, token, initializing } = useAuth()

  if (initializing) {
    return <p>Restoring your session...</p>
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'patient') {
    return <Navigate to="/unsupported-role" replace />
  }

  return <Outlet />
}
