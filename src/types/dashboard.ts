import type { Meeting } from './meeting'

export interface DashboardSummary {
  totalMeetings: number
  totalActionItems: number
  openActionItems: number
  completedActionItems: number
  overdueActionItems: number
  recentMeetings: Meeting[]
}
