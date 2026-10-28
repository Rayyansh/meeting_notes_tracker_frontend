import type { Meeting, MeetingInput, MeetingListParams, MeetingUpdate } from '@/types'

export interface MeetingsService {
  list(params?: MeetingListParams): Promise<Meeting[]>
  get(id: string): Promise<Meeting>
  create(input: MeetingInput): Promise<Meeting>
  /** Changing `transcript` marks existing AI results stale. */
  update(id: string, input: MeetingUpdate): Promise<Meeting>
  /** Also removes the meeting's action items. */
  remove(id: string): Promise<void>
}
