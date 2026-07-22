import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { login as loginRequest } from '../services/backendApi'

const AUTH_KEY = 'madrasa-admin-session'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email, password) => {
    const account = await loginRequest(email, password)
    setSession(account)
    localStorage.setItem(AUTH_KEY, JSON.stringify(account))
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  const value = useMemo(
    () => ({
      user: session ? { name: session.name, email: session.email, role: session.role } : null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      isSuperAdmin: session?.role === 'super',
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
