
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router'

import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import PatientLayout from './layouts/PatientLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PatientDashboard from './pages/PatientDashboard'
import PatientProfile from './pages/PatientProfile'

import './App.css'

const sectionTitles: Record<string, string> = {
  appointments: 'Appointments',
  'medical-history': 'Medical History',
  'treatment-plans': 'Treatment Plans',
  prescriptions: 'Prescriptions',
  billing: 'Billing & Payments',
}

function ModulePlaceholder() {
  const { section } = useParams()

  if (!section || !sectionTitles[section]) {
    return <Navigate to="/portal/dashboard" replace />
  }

  return (
    <section className="profile-card">
      <h1>{sectionTitles[section]}</h1>
      <p>This module will be connected during team integration.</p>
    </section>
  )
}

function UnsupportedRole() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>DentaCare EMR</h1>
        <h2>Welcome, {user?.role}</h2>
        <p>Your dashboard is not implemented yet.</p>
        <button
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Logout
        </button>
      </div>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/unsupported-role"
            element={<UnsupportedRole />}
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<PatientLayout />}>
              <Route
                path="/portal"
                element={<Navigate to="/portal/dashboard" replace />}
              />
              <Route
                path="/portal/dashboard"
                element={<PatientDashboard />}
              />
              <Route
                path="/portal/profile"
                element={<PatientProfile />}
              />
              <Route
                path="/portal/:section"
                element={<ModulePlaceholder />}
              />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
