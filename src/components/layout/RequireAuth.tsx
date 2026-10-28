import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

/**
 * UX-level route guard only: the backend must enforce access on every request.
 * While the session is being checked we show a loader (never redirect), so a
 * signed-in user is not bounced to login on reload.
 */
export function RequireAuth() {
  const { status, endReason } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    const from = location.pathname + location.search
    // After an explicit log out, do not send the user back to the page they left.
    const state = endReason === 'logout' ? undefined : { from, expired: endReason === 'expired' }
    return <Navigate to="/login" replace state={state} />
  }

  return <Outlet />
}
