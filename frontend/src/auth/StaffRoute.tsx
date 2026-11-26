import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'
import type { StaffType } from '../types'
export default function StaffRoute({ types }: { types: StaffType[] }) {
  const { user } = useAuth()
  return user?.staff_type && types.includes(user.staff_type) ? <Outlet/> : <Navigate to="/staff" replace/>
}
