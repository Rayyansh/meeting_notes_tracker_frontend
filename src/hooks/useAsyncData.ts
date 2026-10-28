import { useCallback, useEffect, useState } from 'react'
import { normalizeError, type AppErrorCode } from '@/api/errors'

interface AsyncState<T> {
  data: T | null
  error: string | null
  /** Machine-readable code for branching (e.g. NOT_FOUND); never display it. */
  errorCode: AppErrorCode | null
  loading: boolean
}

/**
 * Loads data through a service call. `load` MUST be referentially stable
 * (module-level function or useCallback); a new `load` triggers a refetch.
 * Previous data is kept while refetching, stale responses are ignored, and
 * errors are always converted to a friendly message.
 */
export function useAsyncData<T>(load: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, errorCode: null, loading: true })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, error: null, errorCode: null, loading: true }))
    load().then(
      (data) => !cancelled && setState({ data, error: null, errorCode: null, loading: false }),
      (error: unknown) => {
        if (cancelled) return
        const friendly = normalizeError(error)
        setState((s) => ({ ...s, error: friendly.message, errorCode: friendly.code, loading: false }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [load, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}
