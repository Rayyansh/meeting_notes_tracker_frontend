import type { Meeting } from '@/types'

const LABELS: Record<Meeting['aiStatus'], string> = {
  none: 'No AI summary',
  processing: 'AI processing',
  completed: 'AI summary ready',
  failed: 'AI failed',
}

const STYLES: Record<Meeting['aiStatus'], string> = {
  none: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
}

export function AiStatusBadge({ meeting }: { meeting: Pick<Meeting, 'aiStatus' | 'aiStale'> }) {
  const stale = meeting.aiStatus === 'completed' && meeting.aiStale
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[meeting.aiStatus]}`}>
      {LABELS[meeting.aiStatus]}
      {stale && ' (outdated)'}
    </span>
  )
}
