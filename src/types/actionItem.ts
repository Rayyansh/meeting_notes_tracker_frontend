export const ACTION_STATUSES = ['Open', 'In Progress', 'Blocked', 'Completed'] as const
export type ActionStatus = (typeof ACTION_STATUSES)[number]

export const ACTION_PRIORITIES = ['Low', 'Medium', 'High'] as const
export type ActionPriority = (typeof ACTION_PRIORITIES)[number]

export const DEFAULT_PRIORITY: ActionPriority = 'Medium'

/** Display strings for missing data. Never invent values. */
export const UNASSIGNED_LABEL = 'Unassigned'
export const NO_DUE_DATE_LABEL = 'Not specified'

export interface ActionItem {
  id: string
  meetingId: string
  /** Denormalised for linking from the tracker. */
  meetingTitle: string
  description: string
  /** Free-text name. Empty string means Unassigned. Never a user id. */
  owner: string
  /** ISO `YYYY-MM-DD`, or null when not specified. */
  dueDate: string | null
  priority: ActionPriority
  status: ActionStatus
  /** True when created from AI output rather than manually. */
  source: 'manual' | 'ai'
  createdAt: string
  updatedAt: string
}

export interface ActionItemInput {
  description: string
  owner: string
  dueDate: string | null
  priority: ActionPriority
  status: ActionStatus
}

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'next7days' | 'none'

/** Special owner filter value that matches items with no owner. */
export const OWNER_FILTER_UNASSIGNED = '__unassigned__'

export interface ActionItemFilters {
  search?: string
  status?: ActionStatus | 'all'
  priority?: ActionPriority | 'all'
  /** Exact owner name, `OWNER_FILTER_UNASSIGNED`, or 'all'. */
  owner?: string
  due?: DueDateFilter
  meetingId?: string
}
