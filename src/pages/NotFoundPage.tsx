import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function NotFoundPage() {
  const { status } = useAuth()
  const signedIn = status === 'authenticated'
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        {/* Wait for the session check so signed-in users never see the log in link flash. */}
        {status !== 'loading' && (
          <Link
            to={signedIn ? '/' : '/login'}
            className="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            {signedIn ? 'Go to home' : 'Go to log in'}
          </Link>
        )}
      </div>
    </main>
  )
}
