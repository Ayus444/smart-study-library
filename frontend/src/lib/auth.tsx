'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { authAPI } from './api'

interface User { id: string; name: string; email: string; role: string }
interface AuthCtx { user: User | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean }

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (token) {
      authAPI.me().then(r => setUser(r.data.user)).catch(() => Cookies.remove('token')).finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password })
    Cookies.set('token', data.token, { expires: 7 })
    setUser(data.user)
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    window.location.href = '/login'
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
