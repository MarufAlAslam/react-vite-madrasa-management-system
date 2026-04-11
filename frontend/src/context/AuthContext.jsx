import { createContext, useContext, useMemo, useState } from 'react'
import { loginAdmin } from '../services/mockApi'

const AUTH_KEY = 'madrasa-admin-user'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    return stored ? JSON.parse(stored) : null
  })

  async function login(email, password) {
    const account = await loginAdmin(email, password)
    setUser(account)
    localStorage.setItem(AUTH_KEY, JSON.stringify(account))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
