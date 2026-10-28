import type { Meeting } from '@/types'
import type { MeetingsService } from '../services/meetings'
import { AppError } from '../errors'
import { db } from './db'
import { delay, failIf, newId } from './storage'

function find(id: string): Meeting {
  const meeting = db.meetings().find((m) => m.id === id)
  if (!meeting) throw new AppError('NOT_FOUND', 'This meeting could not be found. It may have been deleted.')
  return meeting
}

export const meetingsMock: MeetingsService = {
  async list(params) {
    await delay()
    failIf('load')
    const q = params?.search?.trim().toLowerCase()
    const all = db.meetings()
    const matches = q
      ? all.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.participants.some((p) => p.toLowerCase().includes(q)),
        )
      : all
    return [...matches].sort((a, b) => b.date.localeCompare(a.date))
  },

  async get(id) {
    await delay()
    failIf('load')
    return find(id)
  },

  async create(input) {
    await delay()
    failIf('save')
    const now = new Date().toISOString()
    const meeting: Meeting = {
      ...input,
      id: newId(),
      notes: '',
      aiStatus: 'none',
      aiResult: null,
      aiStale: false,
      notesEdited: false,
      createdAt: now,
      updatedAt: now,
    }
    db.saveMeetings([meeting, ...db.meetings()])
    return meeting
  },

  async update(id, input) {
    await delay()
    failIf('save')
    const current = find(id)
    const transcriptChanged = input.transcript !== undefined && input.transcript !== current.transcript
    const notesChanged = input.notes !== undefined && input.notes !== current.notes
    const updated: Meeting = {
      ...current,
      ...input,
      aiStale: current.aiStale || (transcriptChanged && current.aiResult !== null),
      notesEdited: current.notesEdited || (notesChanged && current.aiResult !== null),
      updatedAt: new Date().toISOString(),
    }
    db.saveMeetings(db.meetings().map((m) => (m.id === id ? updated : m)))
    return updated
  },

  async remove(id) {
    await delay()
    failIf('save')
    find(id)
    db.saveMeetings(db.meetings().filter((m) => m.id !== id))
    db.saveActionItems(db.actionItems().filter((a) => a.meetingId !== id))
  },
}
