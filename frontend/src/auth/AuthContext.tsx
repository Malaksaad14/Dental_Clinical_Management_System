import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react'
import { api, onTokenChange, refreshAccessToken, setAccessToken } from '../api/client'
import type { User } from '../types'

interface AuthState {
  user: User | null
  initializing: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)
let bootPromise: Promise<User> | null = null

function restore(): Promise<User> {
  if (!bootPromise) {
    bootPromise = (async () => {
      await refreshAccessToken()
      return (await api.get<User>('/auth/me')).data
    })().finally(() => { bootPromise = null })
  }
  return bootPromise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => onTokenChange((token) => {
    if (!token) setUser(null)
  }), [])

  useEffect(() => {
    let alive = true
    restore()
      .then((result) => { if (alive) setUser(result) })
      .catch(() => { if (alive) setUser(null) })
      .finally(() => { if (alive) setInitializing(false) })
    return () => { alive = false }
  }, [])

  async function login(email: string, password: string) {
    const form = new URLSearchParams({ username: email.trim(), password })
    const response = await api.post<{ access_token: string }>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    setAccessToken(response.data.access_token)
    try {
      const account = (await api.get<User>('/auth/me')).data
      setUser(account)
      return account
    } catch (error) {
      setAccessToken(null)
      throw error
    }
  }

  async function logout() {
    await api.post('/auth/logout')
    setAccessToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, initializing, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const state = useContext(AuthContext)
  if (!state) throw new Error('AuthProvider is required')
  return state
}
