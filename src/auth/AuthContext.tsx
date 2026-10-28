import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/api/services'
import type { LoginInput, RegisterInput, User } from '@/types'
import { onSessionExpired } from './sessionEvents'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Client-side session state only, for UX. It is NOT access control: the
 * backend must authorise every request once connected.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const navigate = useNavigate()
  const statusRef = useRef(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // A service reported an expired session: drop local auth and go to login,
  // remembering where the user was so login can bring them back.
  useEffect(
    () =>
      onSessionExpired(() => {
        if (statusRef.current !== 'authenticated') return
        const from = window.location.pathname + window.location.search
        statusRef.current = 'unauthenticated'
        setUser(null)
        setStatus('unauthenticated')
        authService.logout().catch(() => undefined) // best-effort server/session cleanup
        navigate('/login', { replace: true, state: { expired: true, from } })
      }),
    [navigate],
  )

  useEffect(() => {
    let cancelled = false
    authService
      .getCurrentUser()
      .then((u) => {
        if (cancelled) return
        setUser(u)
        setStatus(u ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setStatus('unauthenticated')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const u = await authService.login(input)
    setUser(u)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const u = await authService.register(input)
    setUser(u)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      // Always clear local state, even if the server call failed.
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
