import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CloseIcon, DashboardIcon, MeetingsIcon, MenuIcon, TrackerIcon } from '@/components/ui/icons'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

interface NavItem {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/meetings', label: 'Meetings', Icon: MeetingsIcon },
  { to: '/tracker', label: 'Action Tracker', Icon: TrackerIcon },
]

function NavLinks() {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-500 ${
              isActive
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
            }`
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

const BRAND = 'Meeting Notes'

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Close the drawer after navigating.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Drawer: Escape closes, page scroll locks, focus moves in and returns on close.
  useEffect(() => {
    if (!drawerOpen) return
    const menuButton = menuButtonRef.current
    closeButtonRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      menuButton?.focus()
    }
  }, [drawerOpen])

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-14 items-center border-b border-slate-200 px-5 font-semibold dark:border-slate-800">
          {BRAND}
        </div>
        <NavLinks />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 w-64 max-w-[80vw] overflow-y-auto bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 pl-5 pr-2 dark:border-slate-800">
              <span className="font-semibold">{BRAND}</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-2 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-800"
              >
                <CloseIcon />
              </button>
            </div>
            <NavLinks />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-4 dark:border-slate-800 dark:bg-slate-900/90">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="rounded-md p-2 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500 lg:hidden dark:hover:bg-slate-800"
          >
            <MenuIcon />
          </button>
          <span className="font-semibold lg:hidden">{BRAND}</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
