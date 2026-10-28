import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { ChevronDownIcon, LogoutIcon } from '@/components/ui/icons'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout() // the route guard redirects to /login once signed out
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-800"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{user.name}</span>
        <ChevronDownIcon className="size-4 text-slate-500" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-60 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            className="mt-1 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-slate-800"
          >
            <LogoutIcon className="size-4" />
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  )
}
