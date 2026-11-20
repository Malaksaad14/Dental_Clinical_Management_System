
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function PatientDashboard() {
  const { user } = useAuth()

  return (
    <section>
      <h1>Welcome to DentaCare</h1>
      <p>You are logged in as {user?.email}</p>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>My Profile</h3>
          <p>View and update your personal information.</p>
          <Link to="/portal/profile">Open Profile</Link>
        </article>

        <article className="dashboard-card">
          <h3>Appointments</h3>
          <p>View and manage dental appointments.</p>
          <Link to="/portal/appointments">View Section</Link>
        </article>

        <article className="dashboard-card">
          <h3>Medical History</h3>
          <p>Access your dental and medical records.</p>
          <Link to="/portal/medical-history">View Section</Link>
        </article>

        <article className="dashboard-card">
          <h3>Billing & Payments</h3>
          <p>View invoices and payment history.</p>
          <Link to="/portal/billing">View Section</Link>
        </article>
      </div>
    </section>
  )
}
