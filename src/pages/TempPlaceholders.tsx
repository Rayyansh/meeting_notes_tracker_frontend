// TEMPORARY stand-in so auth screens can be exercised end to end. Replaced by
// S4/S6 (layout and real home). Delete this file then.
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { normalizeError } from '@/api/errors'
import { meetingsService } from '@/api/services'

export function TempHome() {
  const { user, logout } = useAuth()
  const [result, setResult] = useState<string | null>(null)

  // Temporary probe of a data service (lets S3 session-expiry be exercised).
  const probe = async () => {
    setResult(null)
    try {
      const meetings = await meetingsService.list()
      setResult(`Loaded ${meetings.length} meetings.`)
    } catch (error) {
      setResult(normalizeError(error).message)
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">Signed in</h1>
      <p className="mt-2 text-sm">Welcome, {user?.name}. (Temporary page until S4/S6.)</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => void probe()} className="rounded-md border px-3 py-1.5 text-sm">
          Load meetings (temp)
        </button>
        <button onClick={() => void logout()} className="rounded-md border px-3 py-1.5 text-sm">
          Log out
        </button>
      </div>
      {result && <p className="mt-3 text-sm">{result}</p>}
    </main>
  )
}
