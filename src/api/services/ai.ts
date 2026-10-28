import type { Meeting } from '@/types'

export interface AIService {
  /**
   * Runs (or re-runs) AI processing for a meeting and returns the updated
   * meeting with `aiResult` populated. Throws AppError('AI_FAILED') on failure.
   * `replaceNotes`: when false, user-edited notes are preserved.
   */
  generate(meetingId: string, options?: { replaceNotes?: boolean }): Promise<Meeting>
}
