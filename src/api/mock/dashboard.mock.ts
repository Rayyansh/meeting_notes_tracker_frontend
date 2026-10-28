import type { DashboardService } from '../services/dashboard'
import { isOverdue } from '@/utils/overdue'
import { db } from './db'
import { delay, failIf } from './storage'

export const dashboardMock: DashboardService = {
  async getSummary() {
    await delay()
    failIf('load')
    const meetings = db.meetings()
    const items = db.actionItems()
    return {
      totalMeetings: meetings.length,
      totalActionItems: items.length,
      openActionItems: items.filter((a) => a.status !== 'Completed').length,
      completedActionItems: items.filter((a) => a.status === 'Completed').length,
      overdueActionItems: items.filter((a) => isOverdue(a)).length,
      recentMeetings: [...meetings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    }
  },
}
