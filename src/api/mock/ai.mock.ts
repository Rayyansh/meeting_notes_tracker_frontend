import type { AIService } from '../services/ai'
import { AppError } from '../errors'

/**
 * SKELETON. The deterministic mock AI (zod-validated, labelled "Mock AI – not
 * verified", never inventing owners/dates/decisions) is built with S9, where
 * it can be checked against the sample transcript.
 */
export const aiMock: AIService = {
  async generate() {
    throw new AppError('NOT_IMPLEMENTED', 'AI generation is not available yet.')
  },
}
