
import { api } from './api'

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

export async function registerPatient(
  data: PatientRegistration
): Promise<void> {
  await api.post('/auth/register', data)
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: CurrentUser }> {
  // FastAPI OAuth2 expects form-encoded fields
  const form = new URLSearchParams()
  form.set('username', email)
  form.set('password', password)

  const loginResponse = await api.post<TokenResponse>(
    '/auth/login',
    form,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  const token = loginResponse.data.access_token

  // Retrieve the account associated with the JWT
  const userResponse = await api.get<CurrentUser>(
    '/auth/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return {
    token,
    user: userResponse.data,
  }
}
