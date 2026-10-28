import type { AuthService } from '../services/auth'
import type { MeetingsService } from '../services/meetings'
import type { ActionItemsService } from '../services/actionItems'
import type { AIService } from '../services/ai'
import type { DashboardService } from '../services/dashboard'
import { AppError } from '../errors'

// Phase B placeholders: implemented against the real contract once shared.
const notReady = (): never => {
  throw new AppError('NOT_IMPLEMENTED', 'The real API is not connected yet.')
}

export const authHttp: AuthService = { register: notReady, login: notReady, logout: notReady, getCurrentUser: notReady }
export const meetingsHttp: MeetingsService = { list: notReady, get: notReady, create: notReady, update: notReady, remove: notReady }
export const actionItemsHttp: ActionItemsService = { list: notReady, create: notReady, update: notReady, remove: notReady }
export const aiHttp: AIService = { generate: notReady }
export const dashboardHttp: DashboardService = { getSummary: notReady }
