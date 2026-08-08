import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginRequest, setUnauthorizedHandler } from '../services/backendApi'
import { getJwtExpiryMs } from '../utils/jwt'

const AUTH_KEY = 'madrasa-admin-session'
const AuthContext = createContext(null)

function readStoredSession() {
  const stored = localStorage.getItem(AUTH_KEY)
  if (!stored) return null

  const parsed = JSON.parse(stored)
  if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
    localStorage.removeItem(AUTH_KEY)
    return null
  }
  return parsed
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  const login = useCallback(async (email, password) => {
    const account = await loginRequest(email, password)
    const expiresAt = getJwtExpiryMs(account.token)
    const withExpiry = { ...account, expiresAt }
    setSession(withExpiry)
    localStorage.setItem(AUTH_KEY, JSON.stringify(withExpiry))
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!session?.expiresAt) return undefined

    const remaining = Math.max(session.expiresAt - Date.now(), 0)
    const timer = setTimeout(logout, remaining)
    return () => clearTimeout(timer)
  }, [session, logout])

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
