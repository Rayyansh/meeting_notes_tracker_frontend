import { useCallback, useEffect, useState } from 'react'
import { normalizeError } from '@/api/errors'

interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * Loads data through a service call. `load` MUST be referentially stable
 * (module-level function or useCallback); a new `load` triggers a refetch.
 * Previous data is kept while refetching, stale responses are ignored, and
 * errors are always converted to a friendly message.
 */
export function useAsyncData<T>(load: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, error: null, loading: true }))
    load().then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (error: unknown) => !cancelled && setState((s) => ({ ...s, error: normalizeError(error).message, loading: false })),
    )
    return () => {
      cancelled = true
    }
  }, [load, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}
