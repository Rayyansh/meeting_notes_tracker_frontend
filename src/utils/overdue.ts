import type { ActionStatus } from '@/types'
import { todayISO } from './date'

/**
 * The ONE overdue rule: due date is before today AND status is not Completed.
 * Items without a due date are never overdue. Reuse everywhere (dashboard,
 * tracker, meeting panel, mock filters) so it can be matched to the backend.
 */
export function isOverdue(
  item: { dueDate: string | null; status: ActionStatus },
  today: string = todayISO(),
): boolean {
  return item.dueDate !== null && item.dueDate < today && item.status !== 'Completed'
}
