import { aiResultSchema, type ActionItem, type Meeting } from '@/types'
import type { AIService } from '../services/ai'
import { AppError } from '../errors'
import { analyzeTranscript, summaryToHtml } from './mockAi'
import { db } from './db'
import { delay, failIf, newId, shouldFail } from './storage'

const GENERATION_DELAY_MS = 1800

const findMeeting = (id: string): Meeting => {
  const meeting = db.meetings().find((m) => m.id === id)
  if (!meeting) throw new AppError('NOT_FOUND', 'This meeting could not be found. It may have been deleted.')
  return meeting
}

const saveMeeting = (updated: Meeting) => db.saveMeetings(db.meetings().map((m) => (m.id === updated.id ? updated : m)))

/** An AI-created action item the user has not touched since it was generated. */
const isUntouchedAiItem = (item: ActionItem) =>
  item.source === 'ai' && item.status === 'Open' && item.createdAt === item.updatedAt

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Mock of the backend generation endpoint. Policies (the real backend must match):
 *  - Notes: filled from the summary only if empty, or if the notes are still the
 *    untouched previous AI text, or if the caller passes replaceNotes. User-edited
 *    notes are otherwise preserved.
 *  - Action items: untouched AI items are replaced; items the user added, edited
 *    or progressed are kept; a regenerated item that duplicates a kept one is skipped.
 *  - On failure the previous result (if any) is kept and aiStatus becomes 'failed'.
 */
export const aiMock: AIService = {
  async generate(meetingId, options = {}) {
    failIf('save')
    findMeeting(meetingId)
    await delay(GENERATION_DELAY_MS)

    // Re-read after the delay: the meeting may have been edited or deleted meanwhile.
    const meeting = findMeeting(meetingId)

    if (shouldFail('ai')) {
      saveMeeting({ ...meeting, aiStatus: 'failed' })
      throw new AppError('AI_FAILED', '')
    }

    let result
    try {
      result = aiResultSchema.parse(analyzeTranscript(meeting.transcript, meeting.participants))
    } catch (cause) {
      saveMeeting({ ...meeting, aiStatus: 'failed' })
      throw new AppError('AI_FAILED', '', { cause })
    }

    const replaceNotes = options.replaceNotes === true || meeting.notes.trim() === '' || (meeting.aiResult !== null && !meeting.notesEdited)
    const now = new Date().toISOString()
    const updated: Meeting = {
      ...meeting,
      aiStatus: 'completed',
      aiResult: result,
      aiStale: false,
      notes: replaceNotes ? summaryToHtml(result.summary) : meeting.notes,
      notesEdited: replaceNotes ? false : meeting.notesEdited,
      updatedAt: now,
    }
    saveMeeting(updated)

    const existing = db.actionItems()
    const kept = existing.filter((a) => a.meetingId !== meetingId || !isUntouchedAiItem(a))
    const keptHere = kept.filter((a) => a.meetingId === meetingId)
    const created: ActionItem[] = result.actionItems
      .filter((draft) => !keptHere.some((a) => normalise(a.description) === normalise(draft.description)))
      .map((draft) => ({
        id: newId(),
        meetingId,
        meetingTitle: meeting.title,
        description: draft.description,
        owner: draft.owner,
        dueDate: draft.dueDate,
        priority: draft.priority,
        status: 'Open' as const,
        source: 'ai' as const,
        createdAt: now,
        updatedAt: now,
      }))
    db.saveActionItems([...created, ...kept])

    return updated
  },
}
