import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  /** Shown under the field (e.g. a character count). */
  footer?: ReactNode
  /** Extra controls rendered on the label row (e.g. an upload button). */
  labelAction?: ReactNode
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, footer, labelAction, className = '', ...props },
  ref,
) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {labelAction}
      </div>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 focus:outline-indigo-500 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {footer}
    </div>
  )
})
