import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const root = user?.role === 'admin' ? '/admin' : user?.role === 'clinical_staff' ? '/staff' : '/patient'

  const items: [string, string][] = user?.role === 'patient' ? [
    ['', 'Dashboard'], ['/profile', 'My Profile'], ['/appointments', 'Book & View Appointments'],
    ['/history', 'Medical & Dental History'], ['/treatment-plans', 'Treatment Plans'],
    ['/prescriptions', 'Prescriptions'], ['/billing', 'Billing'], ['/imaging', 'Imaging'],
  ] : [
    ['', 'Dashboard'], ['/patients/new', 'Create Patient Account'], ['/patients', 'Patient Directory'],
    ['/appointments', 'Appointments'],
    ...(user?.role === 'admin' || user?.staff_type !== 'receptionist'
      ? [['/history', 'Clinical History'] as [string, string]] : []),
    ...(user?.role === 'admin' ? [
      ['/staff/new', 'Create Staff Account'], ['/staff', 'Staff Accounts'], ['/accounts', 'Manage Accounts'], ['/catalog', 'Clinic Setup'],
    ] as [string, string][] : []),
  ]

  async function handleLogout() {
    setError('')
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setError('Unable to confirm logout. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="identity"><div className="logo">✦</div><div><b>DentaCare</b><small>Dental EMR</small></div></div>
      <div className="user-card"><span className="role-tag">{user?.role === 'clinical_staff' ? user.staff_type : user?.role}</span><span>{user?.email}</span></div>
      <nav aria-label="Main navigation">{items.map(([path, label]) =>
        <NavLink key={path || '/'} to={root + path} end={!path} className={({ isActive }) => isActive ? 'nav active' : 'nav'}>{label}</NavLink>
      )}</nav>
      <button className="logout" disabled={loggingOut} onClick={handleLogout}>{loggingOut ? 'Logging out...' : 'Log out'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </aside>
    <div className="main-pane"><header className="topbar"><b>DentaCare Portal</b><span>{user?.email}</span></header><main className="content"><Outlet /></main></div>
  </div>
}
