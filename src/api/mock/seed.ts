import type { ActionItem, Meeting } from '@/types'
import { SAMPLE_TRANSCRIPT } from './sampleTranscript'

/**
 * One seeded meeting from the provided sample transcript. No AI output or
 * action items are seeded: those come from running the (mock) AI, so nothing
 * is invented here.
 * Type: the sample says "Client Requirement Discussion", which is not one of
 * the allowed types; mapped to "Requirement Discussion" (assumption).
 * Stored participants are names only (the transcript also lists roles).
 */
export function seedMeetings(): Meeting[] {
  return [
    {
      id: 'sample-meeting-1',
      title: 'Project Discovery and MVP Planning Meeting',
      date: '2026-07-28',
      type: 'Requirement Discussion',
      participants: ['Maria', 'James', 'Neha', 'Arjun', 'Riya'],
      transcript: SAMPLE_TRANSCRIPT,
      notes: '',
      aiStatus: 'none',
      aiResult: null,
      aiStale: false,
      notesEdited: false,
      createdAt: '2026-07-28T16:00:00.000Z',
      updatedAt: '2026-07-28T16:00:00.000Z',
    },
  ]
}

export function seedActionItems(): ActionItem[] {
  return []
}
