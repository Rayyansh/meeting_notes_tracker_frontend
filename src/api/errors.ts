import { ZodError } from 'zod'

export type AppErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK'
  | 'SERVER'
  | 'AI_FAILED'
  | 'NOT_IMPLEMENTED'
  | 'UNKNOWN'

/**
 * The only error type services should throw. `message` is always safe to show
 * to users; technical detail goes in `cause` and is never rendered.
 */
export class AppError extends Error {
  readonly code: AppErrorCode
  /** Field-level messages (e.g. from a 400 response), keyed by field name. */
  readonly fieldErrors?: Record<string, string>

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { cause?: unknown; fieldErrors?: Record<string, string> },
  ) {
    super(message, { cause: options?.cause })
    this.name = 'AppError'
    this.code = code
    this.fieldErrors = options?.fieldErrors
  }
}

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION: 'Some of the details are not valid. Please check the form and try again.',
  UNAUTHORIZED: 'Incorrect email or password.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to do that.',
  NOT_FOUND: 'We could not find what you were looking for.',
  CONFLICT: 'That conflicts with existing data. Please review and try again.',
  NETWORK: 'Could not reach the server. Check your connection and try again.',
  SERVER: 'Something went wrong on our side. Please try again in a moment.',
  AI_FAILED: 'The AI could not process this meeting. Please try again.',
  NOT_IMPLEMENTED: 'This feature is not available yet.',
  UNKNOWN: 'Something went wrong. Please try again.',
}

export interface FriendlyError {
  code: AppErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

/** Map an HTTP status to an error code (used by the Phase B HTTP client). */
export function codeFromStatus(status: number): AppErrorCode {
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

/**
 * Convert ANY thrown value into a friendly, displayable error. UI code must
 * use this in every catch block and never render `error.message` directly.
 */
export function normalizeError(error: unknown): FriendlyError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message || DEFAULT_MESSAGES[error.code],
      fieldErrors: error.fieldErrors,
    }
  }
  if (error instanceof ZodError) {
    return { code: 'VALIDATION', message: DEFAULT_MESSAGES.VALIDATION }
  }
  if (error instanceof TypeError) {
    // fetch() rejects with TypeError on network failure.
    return { code: 'NETWORK', message: DEFAULT_MESSAGES.NETWORK }
  }
  return { code: 'UNKNOWN', message: DEFAULT_MESSAGES.UNKNOWN }
}

export function defaultMessage(code: AppErrorCode): string {
  return DEFAULT_MESSAGES[code]
}
