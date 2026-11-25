import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import Icon, { type IconName } from './Icon'

type NavigationItem = { path: string; label: string; icon: IconName }
type NavigationGroup = { heading: string; items: NavigationItem[] }

function userNavigation(role: string | undefined, staffType: string | null | undefined): NavigationGroup[] {
  if (role === 'patient') {
    return [
      { heading: 'MY WORKSPACE', items: [
        { path: '', label: 'Overview', icon: 'dashboard' },
        { path: '/appointments', label: 'My appointments', icon: 'calendar' },
        { path: '/profile', label: 'My profile', icon: 'users' },
      ] },
      { heading: 'HEALTH RECORDS', items: [
        { path: '/history', label: 'Medical history', icon: 'clipboard' },
        { path: '/treatment-plans', label: 'Treatment plans', icon: 'heart' },
        { path: '/prescriptions', label: 'Prescriptions', icon: 'pill' },
        { path: '/billing', label: 'Billing', icon: 'credit-card' },
        { path: '/imaging', label: 'Imaging', icon: 'scan' },
      ] },
    ]
  }

  const groups: NavigationGroup[] = [
    { heading: 'WORKSPACE', items: [
      { path: '', label: 'Overview', icon: 'dashboard' },
      { path: '/appointments', label: 'Appointments', icon: 'calendar' },
      { path: '/patients', label: 'Patient directory', icon: 'users' },
      { path: '/patients/new', label: 'Add patient', icon: 'user-plus' },
      ...(role === 'admin' || staffType !== 'receptionist' ? [
        { path: '/history', label: 'Clinical history', icon: 'clipboard' as IconName },
      ] : []),
    ] },
  ]
  if (role === 'admin') {
    groups.push({ heading: 'ADMINISTRATION', items: [
      { path: '/staff', label: 'Staff directory', icon: 'doctor' },
      { path: '/staff/new', label: 'Add staff member', icon: 'user-plus' },
      { path: '/accounts', label: 'Manage accounts', icon: 'shield' },
      { path: '/reports', label: 'Reports', icon: 'dashboard' },
      { path: '/catalog', label: 'Clinic settings', icon: 'settings' },
    ] })
  }
  return groups
}

function userRole(role: string | undefined, staffType: string | null | undefined): string {
  if (role === 'admin') return 'Administrator'
  if (role === 'patient') return 'Patient'
  return staffType ? staffType.charAt(0).toUpperCase() + staffType.slice(1) : 'Clinical staff'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const root = user?.role === 'admin' ? '/admin' : user?.role === 'clinical_staff' ? '/staff' : '/patient'
  const groups = userNavigation(user?.role, user?.staff_type)
  const current = groups.flatMap((group) => group.items)
    .find((item) => `${root}${item.path}` === location.pathname)
  const title = current?.label ?? 'Workspace'
  const roleText = userRole(user?.role, user?.staff_type)
  const displayName = (user?.first_name && user?.last_name)
    ? `${user.first_name} ${user.last_name}`
    : user?.email ?? ''
  const initial = (user?.first_name?.[0] || user?.email?.[0] || 'D').toUpperCase()

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

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
    {menuOpen && <button type="button" className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar${menuOpen ? ' sidebar-open' : ''}`} aria-label="Sidebar">
      <div className="sidebar-heading">
        <div className="identity">
          <div className="logo"><Icon name="tooth" size={26} /></div>
          <div className="brand-copy"><b>DentaCare<span className="brand-dot">.</span></b><small>CLINIC MANAGEMENT</small></div>
        </div>
        <button type="button" className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
      </div>

      <div className="sidebar-status"><span className="status-signal" /> <span>Secure clinical workspace</span></div>

      <nav aria-label="Main navigation" className="sidebar-nav">
        {groups.map((group) => <div className="nav-group" key={group.heading}>
          <div className="nav-group-title">{group.heading}</div>
          {group.items.map((item) => <NavLink
            key={`${group.heading}${item.path}`}
            to={root + item.path}
            end={!item.path}
            className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            <Icon name="arrow-right" size={14} className="nav-arrow" />
          </NavLink>)}
        </div>)}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="user-avatar">{initial}</div>
          <div className="user-details"><strong title={user?.email}>{displayName}</strong><span>{roleText}</span></div>
        </div>
        <button className="logout" type="button" disabled={loggingOut} onClick={handleLogout}>
          <Icon name="logout" size={18} />{loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
        {error && <p className="error sidebar-error" role="alert">{error}</p>}
      </div>
    </aside>

    <div className="main-pane">
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle" type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Icon name="menu" size={23}/></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{title}</strong></div>
        </div>
        <div className="topbar-right"><div className="topbar-secure"><Icon name="shield" size={16}/> Secure portal</div><span className="topbar-divider"/><div className="topbar-avatar" aria-label={`${roleText} account`}>{initial}</div></div>
      </header>
      <main className="content" id="main-content"><Outlet /></main>
      <footer className="app-footer"><span>© DentaCare EMR</span><span>Designed for connected dental care</span></footer>
    </div>
  </div>
}
