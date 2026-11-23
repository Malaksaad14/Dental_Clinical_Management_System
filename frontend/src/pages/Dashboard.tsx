import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const root = user?.role === 'admin' ? '/admin' : user?.role === 'clinical_staff' ? '/staff' : '/patient'
  const cards: [string, string, string][] = user?.role === 'patient' ? [
    ['Book an appointment', 'Select a dentist, service and available time.', '/appointments'],
    ['Medical history', 'Review your medical and dental chart information.', '/history'],
    ['My profile', 'Update contact and emergency information.', '/profile'],
    ['Billing and treatment', 'These modules will be linked to the team APIs.', '/billing'],
  ] : [
    ['Create patient account', 'Register a patient for clinic access.', '/patients/new'],
    ['Patient directory', 'Find and review patient contact information.', '/patients'],
    ['Manage appointments', 'Book and view appointments.', '/appointments'],
    ...(user?.role === 'admin' ? [['Create staff', 'Only admin may create staff accounts.', '/staff/new'] as [string,string,string]] : []),
  ]
  return <><div className="page-heading"><span className="eyebrow">WELCOME</span><h1>{user?.role === 'patient' ? 'Patient Portal' : user?.role === 'admin' ? 'Admin Dashboard' : 'Staff Workspace'}</h1><p>Choose an action to continue.</p></div>
    <div className="card-grid">{cards.map(([title, desc, href]) => <Link className="feature-card" key={href} to={root+href}><h3>{title}</h3><p>{desc}</p><span>Open section →</span></Link>)}</div>
  </>
}
