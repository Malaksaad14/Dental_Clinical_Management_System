
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import {
  loginUser,
  type CurrentUser,
} from '../services/authService'

interface AuthContextType {
  user: CurrentUser | null
  token: string | null
  login: (
    email: string,
    password: string
  ) => Promise<CurrentUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  async function login(
    email: string,
    password: string
  ): Promise<CurrentUser> {
    const result = await loginUser(email, password)

    setUser(result.user)
    setToken(result.token)

    return result.user
  }

  function logout() {
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout }}
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
