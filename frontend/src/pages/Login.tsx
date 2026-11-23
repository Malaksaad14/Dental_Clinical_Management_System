import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { messageFromError } from '../api/client'
import Icon from '../components/Icon'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const account = await login(email, password)
      navigate(account.role === 'admin' ? '/admin' : account.role === 'clinical_staff' ? '/staff' : '/patient', { replace: true })
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setBusy(false)
    }
  }

  return <div className="login-screen">
    <div className="login-layout">
      <section className="login-brand-panel" aria-label="DentaCare introduction">
        <div className="login-brand"><div className="login-brand-symbol"><Icon name="tooth" size={27}/></div><div><b>DentaCare<span>.</span></b><small>DENTAL CLINIC MANAGEMENT</small></div></div>
        <div className="login-brand-content">
          <div className="login-kicker"><Icon name="sparkles" size={16}/> A BETTER WAY TO MANAGE CARE</div>
          <h1>Better care<br/>starts with <em>clarity.</em></h1>
          <p>A single, secure workspace connecting patients, clinic teams, and everyday dental care.</p>
          <div className="login-illustration" aria-hidden="true">
            <div className="login-illustration-ring ring-a"/><div className="login-illustration-ring ring-b"/>
            <div className="login-tooth-circle"><Icon name="tooth" size={98}/></div>
            <div className="login-float-icon icon-calendar"><Icon name="calendar" size={23}/></div>
            <div className="login-float-icon icon-heart"><Icon name="heart" size={23}/></div>
            <div className="login-float-icon icon-shield"><Icon name="shield" size={21}/></div>
          </div>
        </div>
        <div className="login-brand-footer"><Icon name="shield" size={17}/> Private by design. Built for better workflows.</div>
      </section>

      <section className="login-form-panel">
        <div className="login-mobile-brand"><div className="logo"><Icon name="tooth" size={22}/></div><b>DentaCare<span>.</span></b></div>
        <form className="login-card" onSubmit={submit}>
          <span className="login-welcome">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="login-intro">Enter your credentials to access your DentaCare workspace.</p>
          <label htmlFor="email">Email address</label>
          <div className="input-with-icon"><Icon name="mail" size={19}/><input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
          <label htmlFor="password">Password</label>
          <div className="input-with-icon"><Icon name="lock" size={19}/><input id="password" type={passwordVisible ? 'text' : 'password'} placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'}>{passwordVisible ? 'Hide' : 'Show'}</button></div>
          {error && <p className="error login-error" role="alert">{error}</p>}
          <button className="primary login-submit" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in securely'} <Icon name="arrow-right" size={19}/></button>
          <div className="login-help"><div className="login-help-icon"><Icon name="shield" size={19}/></div><p>Patient accounts are created by authorized clinic staff. Contact reception if you need login credentials.</p></div>
        </form>
        <footer className="login-right-footer">© DentaCare EMR · Secure clinic portal</footer>
      </section>
    </div>
  </div>
}
