import type { ActionItem, Meeting } from '@/types'
import { readJSON, writeJSON } from './storage'
import { seedActionItems, seedMeetings } from './seed'

/** Single mock "database": all mock services read/write through here. */
export const db = {
  meetings(): Meeting[] {
    return readJSON<Meeting[] | null>('meetings', null) ?? this.seed().meetings
  },
  saveMeetings(meetings: Meeting[]): void {
    writeJSON('meetings', meetings)
  },
  actionItems(): ActionItem[] {
    // Ensure seeding has happened before reading items.
    this.meetings()
    return readJSON<ActionItem[]>('actionItems', [])
  },
  saveActionItems(items: ActionItem[]): void {
    writeJSON('actionItems', items)
  },
  seed() {
    const meetings = seedMeetings()
    const actionItems = seedActionItems()
    writeJSON('meetings', meetings)
    writeJSON('actionItems', actionItems)
    return { meetings, actionItems }
  },
}
