import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { messageFromError } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin' : user.role === 'clinical_staff' ? '/staff' : '/patient', { replace: true })
    } catch (err) {
      setError(messageFromError(err))
    } finally { setBusy(false) }
  }

  return <div className="login-screen"><form className="login-card" onSubmit={submit}>
    <div className="login-mark">✦</div>
    <h1>DentaCare EMR</h1><p>Secure sign in for patients and clinic staff</p>
    <label htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
    <label htmlFor="password">Password</label><input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
    {error && <p className="error" role="alert">{error}</p>}
    <button className="primary" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    <p className="hint">Patient accounts are created by authorized clinic staff. Ask reception for your login credentials.</p>
  </form></div>
}
