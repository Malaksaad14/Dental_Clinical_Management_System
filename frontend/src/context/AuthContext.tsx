
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  loginUser,
  logoutUser,
  restoreSession,
  type CurrentUser,
} from '../services/authService'

import {
  setAccessToken,
  subscribeToAccessToken,
} from '../services/api'

interface AuthContextType {
  user: CurrentUser | null
  token: string | null
  initializing: boolean
  login: (
    email: string,
    password: string
  ) => Promise<CurrentUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<CurrentUser | null>(
    null
  )

  const [token, setToken] = useState<string | null>(
    null
  )

  const [initializing, setInitializing] = useState(true)

  // Keep React state synchronized with Axios
  useEffect(() => {
    return subscribeToAccessToken((nextToken) => {
      setToken(nextToken)

      if (nextToken === null) {
        setUser(null)
      }
    })
  }, [])

  // Restore an existing session when the app starts
  useEffect(() => {
    let active = true

    restoreSession()
      .then((result) => {
        if (!active) return

        setUser(result.user)
        setToken(result.token)
      })
      .catch(() => {
        // No valid refresh session
      })
      .finally(() => {
        if (active) {
          setInitializing(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function login(
    email: string,
    password: string
  ): Promise<CurrentUser> {
    const result = await loginUser(email, password)

    setUser(result.user)
    setToken(result.token)

    return result.user
  }

  async function logout(): Promise<void> {
    await logoutUser()

    // Clear local authentication after server confirmation
    setAccessToken(null)
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        initializing,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}
