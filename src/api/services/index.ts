/**
 * The ONLY module pages/components import API functionality from.
 * Selects mock or HTTP implementations via VITE_USE_MOCK_API.
 */
import { env } from '@/config/env'
import type { AuthService } from './auth'
import type { MeetingsService } from './meetings'
import type { ActionItemsService } from './actionItems'
import type { AIService } from './ai'
import type { DashboardService } from './dashboard'
import { authMock } from '../mock/auth.mock'
import { meetingsMock } from '../mock/meetings.mock'
import { actionItemsMock } from '../mock/actionItems.mock'
import { aiMock } from '../mock/ai.mock'
import { dashboardMock } from '../mock/dashboard.mock'
import { withSessionExpiry } from '../withSessionExpiry'
import { actionItemsHttp, aiHttp, authHttp, dashboardHttp, meetingsHttp } from '../http'

export const authService: AuthService = env.useMockApi ? authMock : authHttp
// Auth is NOT wrapped: a failed login (UNAUTHORIZED) is not an expired session.
export const meetingsService: MeetingsService = withSessionExpiry(env.useMockApi ? meetingsMock : meetingsHttp)
export const actionItemsService: ActionItemsService = withSessionExpiry(env.useMockApi ? actionItemsMock : actionItemsHttp)
export const aiService: AIService = withSessionExpiry(env.useMockApi ? aiMock : aiHttp)
export const dashboardService: DashboardService = withSessionExpiry(env.useMockApi ? dashboardMock : dashboardHttp)

export type { AuthService, MeetingsService, ActionItemsService, AIService, DashboardService }
