const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

/** Returns a normalised URL string if it is http(s) or mailto, otherwise null (blocks javascript:, data:, etc.). */
export function toSafeUrl(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}
