
import {
  api,
  renewAccessToken,
  setAccessToken,
} from './api'

export interface CurrentUser {
  id: number
  email: string
  role: 'admin' | 'clinical_staff' | 'patient'
  is_active: boolean
}

interface TokenResponse {
  access_token: string
  token_type: string
}

export interface PatientRegistration {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string | null
}

interface AuthResult {
  token: string
  user: CurrentUser
}

// Register a new patient account
export async function registerPatient(
  data: PatientRegistration
): Promise<void> {
  await api.post('/auth/register', data)
}

// Login using OAuth2 form fields
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const form = new URLSearchParams()

  form.set('username', email)
  form.set('password', password)

  const response = await api.post<TokenResponse>(
    '/auth/login',
    form,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  const token = response.data.access_token
  setAccessToken(token)

  try {
    const userResponse = await api.get<CurrentUser>(
      '/auth/me'
    )

    return {
      token,
      user: userResponse.data,
    }
  } catch (error) {
    setAccessToken(null)
    throw error
  }
}

// Reuse one session-restoration operation
let restorePromise: Promise<AuthResult> | null = null

export function restoreSession(): Promise<AuthResult> {
  if (!restorePromise) {
    restorePromise = (async () => {
      const token = await renewAccessToken()

      const userResponse = await api.get<CurrentUser>(
        '/auth/me'
      )

      return {
        token,
        user: userResponse.data,
      }
    })()
      .catch((error) => {
        setAccessToken(null)
        throw error
      })
      .finally(() => {
        restorePromise = null
      })
  }

  return restorePromise
}

// Revoke the server-side session
export async function logoutUser(): Promise<void> {
  await api.post('/auth/logout')
}
