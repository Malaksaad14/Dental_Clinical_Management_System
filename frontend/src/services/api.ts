
import axios, {
  type InternalAxiosRequestConfig,
} from 'axios'

// Main API client
export const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true,
})

// Separate client to avoid refresh interceptor loops
const refreshApi = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true,
})

interface TokenResponse {
  access_token: string
  token_type: string
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Keep the access token in memory only
let accessToken: string | null = null

let tokenListener: ((token: string | null) => void) | null =
  null

export function setAccessToken(token: string | null) {
  accessToken = token
  tokenListener?.(token)
}

export function subscribeToAccessToken(
  listener: (token: string | null) => void
): () => void {
  tokenListener = listener
  listener(accessToken)

  return () => {
    if (tokenListener === listener) {
      tokenListener = null
    }
  }
}

// These endpoints should not trigger automatic refresh
const authActions = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
]

function isAuthAction(url?: string): boolean {
  return authActions.some(
    (path) => url === path || url?.startsWith(`${path}?`)
  )
}

// Share a single refresh request between concurrent calls
let refreshPromise: Promise<string> | null = null

export function renewAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshApi
      .post<TokenResponse>('/auth/refresh')
      .then((response) => {
        const newToken = response.data.access_token
        setAccessToken(newToken)
        return newToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

// Attach the latest access token to protected requests
api.interceptors.request.use((config) => {
  if (accessToken && !isAuthAction(config.url)) {
    config.headers.set(
      'Authorization',
      `Bearer ${accessToken}`
    )
  }

  return config
})

// Automatically recover from an expired access token
api.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as
      | RetryConfig
      | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthAction(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    const previousAuthorization =
      originalRequest.headers.get('Authorization')

    // Only refresh previously authenticated requests
    if (
      typeof previousAuthorization !== 'string' ||
      !previousAuthorization.startsWith('Bearer ')
    ) {
      return Promise.reject(error)
    }

    // Never retry the same request more than once
    originalRequest._retry = true

    // Another request may have already refreshed the token
    if (
      accessToken &&
      previousAuthorization !== `Bearer ${accessToken}`
    ) {
      originalRequest.headers.set(
        'Authorization',
        `Bearer ${accessToken}`
      )

      return api(originalRequest)
    }

    const tokenBeforeRefresh = accessToken

    try {
      const newToken = await renewAccessToken()

      originalRequest.headers.set(
        'Authorization',
        `Bearer ${newToken}`
      )

      // Retry the original request with the new token
      return api(originalRequest)

    } catch (refreshError) {
      // Avoid clearing a newer session after a race
      if (accessToken === tokenBeforeRefresh) {
        setAccessToken(null)
      }

      return Promise.reject(refreshError)
    }
  }
)

// Convert API errors into user-friendly messages
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (error.response?.status === 422) {
      return 'Please check the entered information.'
    }

    if (!error.response) {
      return 'Cannot connect to the server.'
    }
  }

  return 'Something went wrong. Please try again.'
}
