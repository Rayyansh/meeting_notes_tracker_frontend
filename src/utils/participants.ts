export const MAX_PARTICIPANTS = 50
export const MAX_PARTICIPANT_LENGTH = 100

/** "Maria, James\nNeha" -> ["Maria","James","Neha"]. Trims, drops blanks, de-duplicates case-insensitively. */
export function parseParticipants(text: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of text.split(/[,\n;]/)) {
    const name = raw.trim().replace(/\s+/g, ' ')
    const key = name.toLowerCase()
    if (name && !seen.has(key)) {
      seen.add(key)
      result.push(name)
    }
  }
  return result
}
