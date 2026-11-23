import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

// Keep access tokens in memory; refresh tokens are HttpOnly cookies.
export const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  withCredentials: true,
})
const refreshClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  withCredentials: true,
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }
let accessToken: string | null = null
const listeners = new Set<(token: string | null) => void>()
let inFlightRefresh: Promise<string> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  listeners.forEach((listener) => listener(token))
}

export function onTokenChange(listener: (token: string | null) => void) {
  listeners.add(listener)
  listener(accessToken)
  return () => { listeners.delete(listener) }
}

export function refreshAccessToken(): Promise<string> {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshClient.post<{ access_token: string }>('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.access_token)
        return data.access_token
      })
      .finally(() => { inFlightRefresh = null })
  }
  return inFlightRefresh
}

const exempt = ['/auth/login', '/auth/refresh', '/auth/logout']
const isExempt = (url?: string) => exempt.some((path) => url === path || url?.startsWith(`${path}?`))

api.interceptors.request.use((request) => {
  if (!isExempt(request.url) && accessToken) {
    request.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return request
})

api.interceptors.response.use((response) => response, async (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error)
  const original = error.config as RetryConfig | undefined
  if (!original || original._retry || error.response?.status !== 401 || isExempt(original.url)) {
    return Promise.reject(error)
  }
  const oldAuth = AxiosHeaders.from(original.headers).get('Authorization')
  if (typeof oldAuth !== 'string' || !oldAuth.startsWith('Bearer ')) return Promise.reject(error)
  original._retry = true
  try {
    const fresh = accessToken && oldAuth !== `Bearer ${accessToken}`
      ? accessToken
      : await refreshAccessToken()
    original.headers.set('Authorization', `Bearer ${fresh}`)
    return api(original)
  } catch (refreshError) {
    setAccessToken(null)
    return Promise.reject(refreshError)
  }
})

export function messageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (error.response?.status === 422) return 'Please check all required fields and values.'
    if (!error.response) return 'Cannot connect to the API. Make sure FastAPI is running.'
  }
  return 'An unexpected error occurred.'
}
