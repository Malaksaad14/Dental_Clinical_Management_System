
import { useState } from 'react'
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'

import { useAuth } from '../context/AuthContext'


export default function PatientLayout() {
  const navigate = useNavigate()

  const { user, logout } = useAuth()

  const [logoutError, setLogoutError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)


  async function handleLogout() {
    setLogoutError('')
    setIsLoggingOut(true)

    try {
      // Revoke the session on the backend
      await logout()

      // Redirect to the login page
      navigate('/login', { replace: true })

    } catch {
      setLogoutError(
        'Unable to confirm logout. Please try again.'
      )

    } finally {
      setIsLoggingOut(false)
    }
  }


  return (
    <div className="portal">

      {/* Patient sidebar */}
      <aside className="sidebar">

        <h2>DentaCare</h2>
        <p>Patient Portal</p>

        {/* Patient navigation */}
        <nav aria-label="Patient navigation">

          <NavLink to="/portal/dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/portal/profile">
            My Profile
          </NavLink>

          <NavLink to="/portal/appointments">
            Appointments
          </NavLink>

          <NavLink to="/portal/medical-history">
            Medical History
          </NavLink>

          <NavLink to="/portal/treatment-plans">
            Treatment Plans
          </NavLink>

          <NavLink to="/portal/prescriptions">
            Prescriptions
          </NavLink>

          <NavLink to="/portal/billing">
            Billing & Payments
          </NavLink>

        </nav>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>

        {/* Logout error message */}
        {logoutError && (
          <p className="error" role="alert">
            {logoutError}
          </p>
        )}

      </aside>

      {/* Patient main content */}
      <main className="portal-content">

        <header className="portal-header">
          <span>Patient Portal</span>
          <span>{user?.email}</span>
        </header>

        {/* Render the selected patient page */}
        <Outlet />

      </main>

    </div>
  )
}
