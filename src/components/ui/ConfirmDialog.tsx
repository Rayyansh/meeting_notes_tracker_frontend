import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  /** Friendly error from the last attempt; the dialog stays open so the user can retry. */
  error?: string | null
  busy?: boolean
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Modal confirmation. Cancel is focused first (safe default); Escape/backdrop cancel; Tab is trapped. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  error,
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) {
        onCancel()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
    // onCancel is intentionally not a dependency: re-running would steal focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden="true" onClick={() => !busy && onCancel()} />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900"
      >
        <h2 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div id="confirm-body" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {children}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <Button
            type="button"
            loading={busy}
            onClick={onConfirm}
            className={destructive ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-500' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
