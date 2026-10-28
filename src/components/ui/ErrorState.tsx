import { Button } from './Button'

/** Friendly load failure with a retry. `message` must already be normalised. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950"
    >
      <p className="font-medium text-red-800 dark:text-red-200">Something went wrong</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
      <Button type="button" onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  )
}
