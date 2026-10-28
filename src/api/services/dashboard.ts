import type { DashboardSummary } from '@/types'

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>
}
