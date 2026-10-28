import type { ActionItem, ActionItemFilters } from '@/types'
import { OWNER_FILTER_UNASSIGNED } from '@/types'
import type { ActionItemsService } from '../services/actionItems'
import { AppError } from '../errors'
import { addDaysISO, todayISO } from '@/utils/date'
import { isOverdue } from '@/utils/overdue'
import { db } from './db'
import { delay, failIf, newId } from './storage'

function matches(item: ActionItem, f: ActionItemFilters): boolean {
  const q = f.search?.trim().toLowerCase()
  if (q && !`${item.description} ${item.owner} ${item.meetingTitle}`.toLowerCase().includes(q)) return false
  if (f.status && f.status !== 'all' && item.status !== f.status) return false
  if (f.priority && f.priority !== 'all' && item.priority !== f.priority) return false
  if (f.meetingId && item.meetingId !== f.meetingId) return false
  if (f.owner && f.owner !== 'all') {
    if (f.owner === OWNER_FILTER_UNASSIGNED ? item.owner !== '' : item.owner !== f.owner) return false
  }
  const today = todayISO()
  switch (f.due) {
    case 'overdue':
      return isOverdue(item, today)
    case 'today':
      return item.dueDate === today
    case 'next7days':
      return item.dueDate !== null && item.dueDate >= today && item.dueDate <= addDaysISO(today, 7)
    case 'none':
      return item.dueDate === null
    default:
      return true
  }
}

export const actionItemsMock: ActionItemsService = {
  async list(filters = {}) {
    await delay()
    failIf('load')
    return db.actionItems().filter((item) => matches(item, filters))
  },

  async create(meetingId, input) {
    await delay()
    failIf('save')
    const meeting = db.meetings().find((m) => m.id === meetingId)
    if (!meeting) throw new AppError('NOT_FOUND', 'The meeting for this action item no longer exists.')
    const now = new Date().toISOString()
    const item: ActionItem = {
      ...input,
      id: newId(),
      meetingId,
      meetingTitle: meeting.title,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    }
    db.saveActionItems([item, ...db.actionItems()])
    return item
  },

  async update(id, input) {
    await delay(250)
    failIf('save')
    const current = db.actionItems().find((a) => a.id === id)
    if (!current) throw new AppError('NOT_FOUND', 'This action item could not be found. It may have been deleted.')
    const updated: ActionItem = { ...current, ...input, updatedAt: new Date().toISOString() }
    db.saveActionItems(db.actionItems().map((a) => (a.id === id ? updated : a)))
    return updated
  },

  async remove(id) {
    await delay(250)
    failIf('save')
    db.saveActionItems(db.actionItems().filter((a) => a.id !== id))
  },
}
