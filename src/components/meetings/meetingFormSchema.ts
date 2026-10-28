import { z } from 'zod'
import { MEETING_TYPES, type Meeting, type MeetingInput, type MeetingType } from '@/types'
import { env } from '@/config/env'
import { isValidISODate } from '@/utils/date'
import { MAX_PARTICIPANT_LENGTH, MAX_PARTICIPANTS, parseParticipants } from '@/utils/participants'

export const TITLE_MAX_LENGTH = 200
/** Same ceiling as the upload limit (1 byte ~ 1 char for typical transcripts). */
export const TRANSCRIPT_MAX_CHARS = env.maxUploadKb * 1024

export const meetingFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a meeting title.').max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`),
  date: z
    .string()
    .min(1, 'Choose the meeting date.')
    .refine((v) => isValidISODate(v) && v >= '1900-01-01' && v <= '2100-12-31', 'Enter a valid date.'),
  // A string so the empty "Select a type" option is a valid *form* value that fails validation.
  type: z.string().refine((v) => (MEETING_TYPES as readonly string[]).includes(v), 'Select a meeting type.'),
  participants: z.string().superRefine((text, ctx) => {
    const names = parseParticipants(text)
    if (names.length > MAX_PARTICIPANTS) {
      ctx.addIssue({ code: 'custom', message: `Add at most ${MAX_PARTICIPANTS} participants.` })
    } else if (names.some((n) => n.length > MAX_PARTICIPANT_LENGTH)) {
      ctx.addIssue({ code: 'custom', message: `Each participant name must be ${MAX_PARTICIPANT_LENGTH} characters or fewer.` })
    }
  }),
  transcript: z
    .string()
    .refine((v) => v.trim().length > 0, 'Paste the transcript or upload a .txt file. It cannot be empty.')
    .refine((v) => v.length <= TRANSCRIPT_MAX_CHARS, `The transcript is too long (maximum ${TRANSCRIPT_MAX_CHARS.toLocaleString()} characters).`),
})

/** Raw field values as the form holds them (type is '' until chosen). */
export type MeetingFormValues = z.infer<typeof meetingFormSchema>

export const EMPTY_MEETING_FORM: MeetingFormValues = {
  title: '',
  date: '',
  type: '',
  participants: '',
  transcript: '',
}

/** Only call with values that passed `meetingFormSchema` (so `type` is a real MeetingType). */
export function toMeetingInput(values: MeetingFormValues): MeetingInput {
  return {
    title: values.title.trim(),
    date: values.date,
    type: values.type as MeetingType,
    participants: parseParticipants(values.participants),
    transcript: values.transcript,
  }
}

/** Prefill values for editing. Participants are joined so they round-trip through `parseParticipants`. */
export function toMeetingFormValues(meeting: Meeting): MeetingFormValues {
  return {
    title: meeting.title,
    date: meeting.date,
    type: meeting.type,
    participants: meeting.participants.join(', '),
    transcript: meeting.transcript,
  }
}
