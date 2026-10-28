import { env } from '@/config/env'
import { AppError, codeFromStatus, defaultMessage } from '../errors'

/**
 * Phase B skeleton. Auth header/token handling, refresh and 401 => session
 * expired are deliberately NOT implemented until the API contract is shared.
 * Every failure is converted to AppError so no raw error reaches the UI.
 */
export async function request<T>(
  path: string,
  init?: RequestInit,
  /** Login/register requests: a 401 there means bad credentials, not an expired session. */
  options: { isAuthRequest?: boolean } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch (cause) {
    throw new AppError('NETWORK', defaultMessage('NETWORK'), { cause })
  }
  if (!response.ok) {
    const code =
      response.status === 401 && !options.isAuthRequest ? 'SESSION_EXPIRED' : codeFromStatus(response.status)
    throw new AppError(code, defaultMessage(code), { cause: response.status })
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}
