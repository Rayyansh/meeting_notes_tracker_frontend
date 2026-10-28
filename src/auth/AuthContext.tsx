import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authService } from '@/api/services'
import type { LoginInput, RegisterInput, User } from '@/types'
import { onSessionExpired } from './sessionEvents'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
/** Why the last session ended; lets the route guard decide what to tell the login page. */
type EndReason = 'logout' | 'expired' | null

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  endReason: EndReason
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
  const [endReason, setEndReason] = useState<EndReason>(null)
  const statusRef = useRef(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // A service reported an expired session: drop local auth. The route guard
  // then redirects to /login (remembering the page and showing the notice).
  useEffect(
    () =>
      onSessionExpired(() => {
        if (statusRef.current !== 'authenticated') return
        statusRef.current = 'unauthenticated'
        setEndReason('expired')
        setUser(null)
        setStatus('unauthenticated')
        authService.logout().catch(() => undefined) // best-effort server/session cleanup
      }),
    [],
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
    setEndReason(null)
    setUser(u)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const u = await authService.register(input)
    setEndReason(null)
    setUser(u)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      // Always clear local state, even if the server call failed.
      setEndReason('logout')
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, endReason, login, register, logout }),
    [user, status, endReason, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
