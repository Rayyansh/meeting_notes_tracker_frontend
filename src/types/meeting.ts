import type { AIResult, AIStatus } from './ai'

export const MEETING_TYPES = [
  'Client Meeting',
  'Sales Meeting',
  'Project Meeting',
  'Internal Meeting',
  'Requirement Discussion',
  'Retrospective',
  'Other',
] as const
export type MeetingType = (typeof MEETING_TYPES)[number]

export interface Meeting {
  id: string
  title: string
  /** Calendar date, ISO `YYYY-MM-DD`. */
  date: string
  type: MeetingType
  participants: string[]
  transcript: string
  /** Rich-text (HTML) notes/summary edited by the user. Empty string if none. */
  notes: string
  aiStatus: AIStatus
  aiResult: AIResult | null
  /** True when the transcript changed after the AI result was generated. */
  aiStale: boolean
  /** True when the user edited notes after AI generation (regenerate must confirm). */
  notesEdited: boolean
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

export interface MeetingInput {
  title: string
  date: string
  type: MeetingType
  participants: string[]
  transcript: string
}

export type MeetingUpdate = Partial<MeetingInput> & { notes?: string }

export interface MeetingListParams {
  /** Matches title or participants, case-insensitive. */
  search?: string
}
