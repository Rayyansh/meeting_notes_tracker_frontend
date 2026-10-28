import { AppError } from '../errors'

const PREFIX = 'mnt.mock.'
const memory = new Map<string, string>()

/** localStorage with an in-memory fallback (private mode / blocked storage). */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key) ?? memory.get(key) ?? null
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    localStorage.setItem(PREFIX + key, raw)
  } catch {
    // Keep the in-memory copy only.
  }
}

export function newId(): string {
  return crypto.randomUUID()
}

/** Simulated network latency so loading states are exercised. */
export function delay(ms = 400): Promise<void> {
  const jitter = Math.random() * 200
  return new Promise((resolve) => setTimeout(resolve, ms + jitter))
}

/**
 * Failure simulation for testing error UI. Set in the browser console, e.g.
 *   localStorage.setItem('mnt.mock.fail', JSON.stringify({ ai: true }))
 * Keys: ai (AI runs fail), save (writes fail), load (reads fail), network (everything fails),
 * expired (meetings/action-item/dashboard calls fail as an expired session).
 * Flags persist until cleared; there is no UI for them (dev/demo tooling only).
 */
export type FailureKind = 'ai' | 'save' | 'load' | 'network'

type FailureFlags = Partial<Record<FailureKind | 'expired', boolean>>

export function shouldFail(kind: FailureKind): boolean {
  const flags = readJSON<FailureFlags>('fail', {})
  return Boolean(flags.network || flags[kind])
}

export function failIf(kind: FailureKind): void {
  // Only data calls (load/save) see an expired session; login/register never do.
  if ((kind === 'load' || kind === 'save') && readJSON<FailureFlags>('fail', {}).expired) {
    throw new AppError('SESSION_EXPIRED', '')
  }
  if (shouldFail(kind)) {
    throw new AppError(kind === 'network' ? 'NETWORK' : 'SERVER', '', {
      cause: new Error(`simulated ${kind} failure`),
    })
  }
}
