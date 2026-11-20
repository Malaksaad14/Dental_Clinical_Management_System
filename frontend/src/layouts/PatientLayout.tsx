
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'

import { useAuth } from '../context/AuthContext'

export default function PatientLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="portal">
      <aside className="sidebar">
        <h2>DentaCare</h2>
        <p>Patient Portal</p>

        <nav aria-label="Patient navigation">
          <NavLink to="/portal/dashboard">Dashboard</NavLink>
          <NavLink to="/portal/profile">My Profile</NavLink>
          <NavLink to="/portal/appointments">Appointments</NavLink>
          <NavLink to="/portal/medical-history">Medical History</NavLink>
          <NavLink to="/portal/treatment-plans">Treatment Plans</NavLink>
          <NavLink to="/portal/prescriptions">Prescriptions</NavLink>
          <NavLink to="/portal/billing">Billing & Payments</NavLink>
        </nav>

        <button onClick={handleLogout} type="button">
          Logout
        </button>
      </aside>

      <main className="portal-content">
        <header className="portal-header">
          <span>Patient Portal</span>
          <span>{user?.email}</span>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
