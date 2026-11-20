
import { useState } from 'react'

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router'

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext'

import ProtectedRoute from './routes/ProtectedRoute'
import PatientLayout from './layouts/PatientLayout'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PatientDashboard from './pages/PatientDashboard'
import PatientProfile from './pages/PatientProfile'

import './App.css'


// Sections managed by other project modules
const sectionTitles: Record<string, string> = {
  appointments: 'Appointments',
  'medical-history': 'Medical History',
  'treatment-plans': 'Treatment Plans',
  prescriptions: 'Prescriptions',
  billing: 'Billing & Payments',
}


// Temporary pages until team integration
function ModulePlaceholder() {
  const { section } = useParams()

  if (!section || !sectionTitles[section]) {
    return (
      <Navigate
        to="/portal/dashboard"
        replace
      />
    )
  }

  return (
    <section className="profile-card">

      <h1>{sectionTitles[section]}</h1>

      <p>
        This module will be connected during
        team integration.
      </p>

    </section>
  )
}


// Page for roles without an implemented dashboard
function UnsupportedRole() {
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

      // Redirect after successful logout
      navigate('/login', { replace: true })

    } catch {
      setLogoutError(
        'Unable to confirm logout. Please try again.'
      )

    } finally {
      setIsLoggingOut(false)
    }
  }


  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />
  }


  return (
    <main className="auth-page">

      <div className="auth-card">

        <h1>DentaCare EMR</h1>

        <h2>Welcome, {user.role}</h2>

        <p>
          Your dashboard is not implemented yet.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>

        {logoutError && (
          <p className="error" role="alert">
            {logoutError}
          </p>
        )}

      </div>

    </main>
  )
}


// Main application routing
function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* Default route */}
          <Route
            path="/"
            element={
              <Navigate to="/login" replace />
            }
          />

          {/* Public authentication routes */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          {/* Other user roles */}
          <Route
            path="/unsupported-role"
            element={<UnsupportedRole />}
          />

          {/* Protected patient routes */}
          <Route element={<ProtectedRoute />}>

            <Route element={<PatientLayout />}>

              <Route
                path="/portal"
                element={
                  <Navigate
                    to="/portal/dashboard"
                    replace
                  />
                }
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

          {/* Unknown routes */}
          <Route
            path="*"
            element={
              <Navigate to="/" replace />
            }
          />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  )
}

export default App
