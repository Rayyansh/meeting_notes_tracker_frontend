import { z } from 'zod'
import { ACTION_PRIORITIES } from './actionItem'

export type AIStatus = 'none' | 'processing' | 'completed' | 'failed'

/** Identifies who produced the output; the UI labels `mock` as not verified. */
export const AI_PROVIDERS = ['mock', 'real'] as const

const aiActionItemSchema = z.object({
  description: z.string().min(1),
  /** Only set when the transcript names an owner; otherwise empty. */
  owner: z.string(),
  /** Only set when the transcript states a date; otherwise null. */
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  priority: z.enum(ACTION_PRIORITIES),
})

export const aiResultSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  generatedAt: z.string(),
  summary: z.object({
    purpose: z.string(),
    discussionPoints: z.string(),
    outcomes: z.string(),
    concerns: z.string(),
    nextSteps: z.string(),
  }),
  keyDiscussionPoints: z.array(z.string()),
  /** Empty array => UI shows "No clear decisions recorded". */
  decisions: z.array(z.string()),
  actionItems: z.array(aiActionItemSchema),
  risks: z.array(z.string()),
  unansweredQuestions: z.array(z.string()),
})

export type AIResult = z.infer<typeof aiResultSchema>
export type AIActionItemDraft = z.infer<typeof aiActionItemSchema>
