/**
 * Tiny pub/sub so any service call that discovers the session is no longer
 * valid can tell the auth layer, without services importing React code.
 */
type Listener = () => void
const listeners = new Set<Listener>()

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionExpired(): void {
  listeners.forEach((l) => l())
}
