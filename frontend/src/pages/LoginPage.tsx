
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../context/AuthContext'
import { getApiError } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)

      if (user.role === 'patient') {
        navigate('/portal/dashboard', { replace: true })
      } else {
        navigate('/unsupported-role', { replace: true })
      }
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>DentaCare EMR</h1>
        <h2>Sign In</h2>

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="error" role="alert">{error}</p>}

        <button disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p>
          New patient? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  )
}
