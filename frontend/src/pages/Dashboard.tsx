import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import Icon, { type IconName } from '../components/Icon'

type ActionCard = { title: string; description: string; href: string; icon: IconName; tone: string; label: string }

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role
  const root = role === 'admin' ? '/admin' : role === 'clinical_staff' ? '/staff' : '/patient'
  const isPatient = role === 'patient'
  const isAdmin = role === 'admin'

  const cards: ActionCard[] = isPatient ? [
    { title: 'Book an appointment', description: 'View doctors’ working hours and arrange your next visit.', href: '/appointments', icon: 'calendar', tone: 'teal', label: 'Booking' },
    { title: 'Medical history', description: 'Access your dental and medical history in one place.', href: '/history', icon: 'clipboard', tone: 'blue', label: 'Records' },
    { title: 'My profile', description: 'Review and update your personal contact details.', href: '/profile', icon: 'users', tone: 'violet', label: 'Account' },
    { title: 'Billing & treatment', description: 'Billing and treatment modules will connect as they become available.', href: '/billing', icon: 'credit-card', tone: 'orange', label: 'Coming together' },
  ] : [
    { title: 'Appointments', description: 'Schedule patient visits and review dentists’ working hours.', href: '/appointments', icon: 'calendar', tone: 'teal', label: 'Scheduling' },
    { title: 'Patient directory', description: 'Find patient profiles and manage clinic records.', href: '/patients', icon: 'users', tone: 'blue', label: 'Patients' },
    { title: 'Register a patient', description: 'Create a secure login for a new patient.', href: '/patients/new', icon: 'user-plus', tone: 'violet', label: 'Registration' },
    ...(isAdmin ? [
      { title: 'Doctor schedules', description: 'Configure weekly availability, services, and chairs.', href: '/catalog', icon: 'doctor' as IconName, tone: 'orange', label: 'Clinic setup' },
    ] : []),
  ]

  const heading = isPatient ? 'Your care, all in one place.' : isAdmin ? 'Your clinic, clearly organized.' : 'A smoother day starts here.'
  const greeting = isPatient ? 'PATIENT PORTAL' : isAdmin ? 'ADMIN DASHBOARD' : 'STAFF WORKSPACE'
  const supporting = isPatient
    ? 'Find appointments, review your records, and keep your information up to date in your secure patient portal.'
    : 'Everything you need to coordinate appointments, support patients, and keep your clinic moving.'
  const primaryAction = isPatient ? 'Book an appointment' : 'View appointments'

  return <div className="dashboard-page">
    <section className="dashboard-hero">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="hero-kicker-dot"/>{greeting}</div>
        <h1>{heading}</h1>
        <p>{supporting}</p>
        <div className="hero-actions">
          <Link className="hero-button" to={`${root}/appointments`}>{primaryAction}<Icon name="arrow-right" size={18}/></Link>
          {isAdmin && <Link className="hero-quiet-link" to="/admin/catalog">Manage clinic settings <Icon name="arrow-up-right" size={16}/></Link>}
          {isPatient && <Link className="hero-quiet-link" to="/patient/profile">View my profile <Icon name="arrow-up-right" size={16}/></Link>}
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="hero-orbit hero-orbit-outer"/><div className="hero-orbit hero-orbit-inner"/>
        <div className="hero-art-disc"><Icon name="tooth" size={70}/></div>
        <div className="hero-float hero-float-one"><Icon name="heart" size={18}/></div>
        <div className="hero-float hero-float-two"><Icon name="sparkles" size={18}/></div>
      </div>
    </section>

    <div className="workspace-strip" aria-label="Workspace information">
      <div><div className="strip-icon"><Icon name="shield" size={18}/></div><span><strong>Role-based access</strong><small>Your account has dedicated permissions</small></span></div>
      <div><div className="strip-icon"><Icon name="clock" size={18}/></div><span><strong>Weekly availability</strong><small>Doctor schedules in Cairo time</small></span></div>
      <div><div className="strip-icon"><Icon name="heart" size={18}/></div><span><strong>Connected care</strong><small>Patient-focused clinical workspace</small></span></div>
    </div>

    <div className="section-title-row"><div><span className="eyebrow">EXPLORE YOUR WORKSPACE</span><h2>Quick access</h2><p>Choose where you want to go next.</p></div><span className="section-count">{cards.length} sections</span></div>
    <div className="card-grid dashboard-card-grid">
      {cards.map((card) => <Link key={card.href} to={root + card.href} className="feature-card">
        <div className="feature-top"><span className={`feature-icon tone-${card.tone}`}><Icon name={card.icon} size={24}/></span><Icon name="arrow-up-right" size={18} className="feature-external"/></div>
        <small>{card.label}</small><h3>{card.title}</h3><p>{card.description}</p>
        <span className="feature-cta">Open workspace <Icon name="arrow-right" size={16}/></span>
      </Link>)}
    </div>
    <div className="dashboard-bottom"><div><Icon name="shield" size={20}/><span><strong>Secure by design</strong><small>Access to clinical information is controlled by your account role.</small></span></div><Icon name="tooth" size={33} className="dashboard-bottom-mark"/></div>
  </div>
}
