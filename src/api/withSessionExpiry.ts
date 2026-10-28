import { notifySessionExpired } from '@/auth/sessionEvents'
import { AppError } from './errors'

/**
 * Wraps every method of a (non-auth) service so a SESSION_EXPIRED failure
 * notifies the auth layer once, then is rethrown unchanged for the caller.
 * Applied centrally in services/index.ts, so the same behaviour covers both
 * mock and HTTP implementations.
 */
export function withSessionExpiry<T extends object>(service: T): T {
  const wrapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(service)) {
    wrapped[key] =
      typeof value === 'function'
        ? async (...args: unknown[]) => {
            try {
              return await (value as (...a: unknown[]) => unknown)(...args)
            } catch (error) {
              if (error instanceof AppError && error.code === 'SESSION_EXPIRED') notifySessionExpired()
              throw error
            }
          }
        : value
  }
  return wrapped as T
}
