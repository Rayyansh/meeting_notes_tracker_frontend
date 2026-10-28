import type { ActionItem, ActionItemFilters, ActionItemInput } from '@/types'

export interface ActionItemsService {
  list(filters?: ActionItemFilters): Promise<ActionItem[]>
  create(meetingId: string, input: ActionItemInput): Promise<ActionItem>
  update(id: string, input: Partial<ActionItemInput>): Promise<ActionItem>
  remove(id: string): Promise<void>
}
