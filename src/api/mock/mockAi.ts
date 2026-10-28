import type { AIActionItemDraft, AIResult } from '@/types'

/**
 * Deterministic, EXTRACTIVE mock "AI". It only selects and lightly reformats
 * sentences that already appear in the transcript; it never writes new facts.
 *  - Owners come only from a named speaker/person ("Maria will...", or "I will..."
 *    said by a named speaker). Group subjects ("we", "our team") stay unassigned.
 *  - Due dates are set only when the sentence contains an absolute date
 *    (YYYY-MM-DD or "28 July 2026"). Relative phrases ("by Friday") stay in the
 *    description text and the due date remains "Not specified".
 *  - Priority is not inferred: always the default (Medium).
 * Results are heuristic, so the UI labels them "Mock AI - not verified".
 */

export const NO_PURPOSE = 'Not specified in the transcript.'
export const NO_DISCUSSION = 'No discussion points identified.'
export const NO_OUTCOMES = 'No clear decisions recorded.'
export const NO_CONCERNS = 'No concerns identified.'
export const NO_NEXT_STEPS = 'No next steps identified.'

interface Sentence {
  speaker: string | null
  text: string
  isQuestion: boolean
  turnIndex: number
}

const SPEAKER_LINE = /^([\p{Lu}][\p{L}'’.-]*(?: [\p{Lu}][\p{L}'’.-]*){0,2}):\s+(.*)$/u

const STOPWORDS = new Set(
  `that this with have from they them their there would could should about which what when where will been were your into also than then just some more most very much many such like only over after before because while these those other being does done make made want need needs going yeah okay thanks thank sure good right`.split(
    /\s+/,
  ),
)

const COMMITMENT_VERBS =
  '(?:provide|share|send|check|confirm|arrange|prepare|ask|review|follow up|schedule|circulate|deliver|draft|organi[sz]e|book|coordinate|investigate|look into|get back|update|finali[sz]e|submit|complete|write|email|call|contact|document)'

// Decisions: explicit agreement/commitment wording only. Generic "we will" / "will require" are NOT enough
// (they also match needs and conditions), so scope statements are matched by their specific phrasing.
const DECISION_RE =
  /\b(agreed? (?:to|that|on)|decided|let us keep|keep it out|should only|never answered|will not replace|will integrate|will support|will require human review|considered later|that matches my understanding)\b/i

// Concerns: risk/blocker wording, excluding positive uses ("low-risk", "reduce risk") and the generic word "problem".
const RISK_RE =
  /\b(risks?|risky|concerns?|tight|dependen(?:t|cy|cies)|worried|biggest problem|main problem|major problem|sensitive|gdpr|compliance|reputational|not sure|cannot|can't|unclear|uncertain|delays?|blocked|blockers?|misunderstand|expensive|difficult|challenges?)\b/i
const RISK_EXCLUDE_RE = /\blow[- ]risk\b|\breduce (?:the )?risk\b|\brisk[- ]free\b/i

const PURPOSE_RE = /\b(purpose|goal|objective|agenda|meeting is)\b/i
const PENDING_REPLY_RE = /\b(not sure|do not know|don't know|unclear|to be confirmed|will check|check with|get back to)\b/i

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

function parseTurns(transcript: string, participants: string[]): { speaker: string | null; text: string }[] {
  const lines = transcript.replace(/\r\n?/g, '\n').split('\n')
  // A "Name:" prefix only counts as a speaker if that name starts at least two lines,
  // or is one of the meeting's listed participants (so a single-turn speaker is still recognised).
  const known = new Set(participants.map((p) => p.trim().toLowerCase()))
  const counts = new Map<string, number>()
  for (const line of lines) {
    const m = SPEAKER_LINE.exec(line.trim())
    if (m) counts.set(m[1]!, (counts.get(m[1]!) ?? 0) + 1)
  }
  const speakers = new Set([...counts].filter(([name, n]) => n >= 2 || known.has(name.toLowerCase())).map(([name]) => name))

  const turns: { speaker: string | null; text: string }[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const m = SPEAKER_LINE.exec(line)
    if (m && speakers.has(m[1]!)) turns.push({ speaker: m[1]!, text: m[2]! })
    else if (turns.length > 0) turns[turns.length - 1]!.text += ` ${line}`
    else turns.push({ speaker: null, text: line })
  }
  return turns
}

function splitSentences(turns: { speaker: string | null; text: string }[]): Sentence[] {
  const out: Sentence[] = []
  turns.forEach((turn, turnIndex) => {
    const cleaned = turn.text.replace(/\s+([.,!?])/g, '$1').replace(/\s+/g, ' ').trim()
    for (const part of cleaned.split(/(?<=[.!?])\s+(?=[\p{Lu}€"“(])/u)) {
      const text = part.trim()
      if (text) out.push({ speaker: turn.speaker, text, isQuestion: text.endsWith('?'), turnIndex })
    }
  })
  return out
}

const stripPeriod = (s: string) => s.replace(/[.\s]+$/, '')
const attribute = (s: Sentence) => (s.speaker ? `${s.speaker}: ${s.text}` : s.text)

function contentWords(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

function parseAbsoluteDate(text: string): string | null {
  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text)
  if (iso) return iso[0]
  const long = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join('|')})\\s+(\\d{4})\\b`, 'i').exec(text)
  if (long) {
    const month = MONTHS.indexOf(long[2]!.toLowerCase()) + 1
    const date = `${long[3]}-${String(month).padStart(2, '0')}-${String(Number(long[1])).padStart(2, '0')}`
    const d = new Date(`${date}T00:00:00`)
    return Number.isNaN(d.getTime()) ? null : date
  }
  return null
}

function extractActionItem(sentence: Sentence, people: string[]): AIActionItemDraft | null {
  if (sentence.isQuestion) return null
  const nameAlt = people.length ? `|${people.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}` : ''
  const re = new RegExp(`\\b(I|We|Our [a-z]+(?: [a-z]+)? team|The [a-z]+(?: [a-z]+)? team${nameAlt}) (?:will|can|'ll|to) ${COMMITMENT_VERBS}\\b`, 'i')
  const m = re.exec(sentence.text)
  if (!m) return null

  const subject = m[1]!
  let owner = ''
  let description = stripPeriod(sentence.text)
  if (/^i$/i.test(subject)) {
    if (sentence.speaker) {
      owner = sentence.speaker
      description = description.replace(/\bI(?= (?:will|can|'ll|to) )/, sentence.speaker)
    }
  } else if (people.some((p) => p.toLowerCase() === subject.toLowerCase())) {
    owner = people.find((p) => p.toLowerCase() === subject.toLowerCase())!
  }
  return { description, owner, dueDate: parseAbsoluteDate(sentence.text), priority: 'Medium' }
}

/** Same owner + mostly the same content words => the same task stated twice; keep the longer wording. */
function dedupeActions(items: AIActionItemDraft[]): AIActionItemDraft[] {
  const sameTask = (a: AIActionItemDraft, b: AIActionItemDraft) => {
    if (a.owner.toLowerCase() !== b.owner.toLowerCase()) return false
    const wa = new Set(contentWords(a.description))
    const wb = new Set(contentWords(b.description))
    const shared = [...wa].filter((w) => wb.has(w)).length
    return shared >= 2 && shared / Math.min(wa.size, wb.size) >= 0.5
  }
  let current = items
  // Merging can create new overlaps (A~B, then merged~C), so repeat until nothing changes.
  for (let changed = true; changed; ) {
    changed = false
    const next: AIActionItemDraft[] = []
    for (const item of current) {
      const i = next.findIndex((k) => sameTask(k, item))
      if (i === -1) next.push(item)
      else {
        changed = true
        if (item.description.length > next[i]!.description.length) next[i] = item
      }
    }
    current = next
  }
  return current
}

const unique = (xs: string[]) => [...new Set(xs)]

export function analyzeTranscript(transcript: string, participants: string[] = []): AIResult {
  const turns = parseTurns(transcript, participants)
  const sentences = splitSentences(turns)
  if (sentences.length === 0) throw new Error('empty transcript')

  const people = unique([...turns.map((t) => t.speaker).filter((s): s is string => s !== null), ...participants])
  const used = new Set<Sentence>()

  // 1) Action items (highest precedence), de-duplicated.
  const actionPairs: { sentence: Sentence; item: AIActionItemDraft }[] = []
  for (const s of sentences) {
    const item = extractActionItem(s, people)
    if (item) actionPairs.push({ sentence: s, item })
  }
  const actionItems = dedupeActions(actionPairs.map((p) => p.item))
  actionPairs.forEach((p) => used.add(p.sentence))

  // The purpose sentence belongs to the summary only, not to decisions/points.
  const purposeSentence = sentences.slice(0, 12).find((s) => !s.isQuestion && PURPOSE_RE.test(s.text))
  if (purposeSentence) used.add(purposeSentence)

  // 2) Decisions, 3) risks: statements only (no questions), exclusive of earlier buckets.
  const statements = sentences.filter((s) => !s.isQuestion && s.text.length >= 30)
  const decisions = unique(statements.filter((s) => !used.has(s) && DECISION_RE.test(s.text)).map((s) => (used.add(s), attribute(s)))).slice(0, 8)
  const risks = unique(statements.filter((s) => !used.has(s) && RISK_RE.test(s.text) && !RISK_EXCLUDE_RE.test(s.text)).map((s) => (used.add(s), attribute(s)))).slice(0, 8)

  // 4) Unanswered: a question whose next reply (by someone else) postpones the answer.
  const unansweredQuestions: string[] = []
  sentences.forEach((s, i) => {
    if (!s.isQuestion) return
    const reply = sentences.slice(i + 1).find((n) => n.turnIndex > s.turnIndex)
    const replyTurnSentences = reply ? sentences.filter((n) => n.turnIndex === reply.turnIndex) : []
    const pending = replyTurnSentences.find((n) => PENDING_REPLY_RE.test(n.text))
    if (reply && reply.speaker !== s.speaker && pending) {
      unansweredQuestions.push(`${s.text} (asked by ${s.speaker ?? 'a participant'}; reply was deferred: “${pending.text}”)`)
    }
  })

  // 5) Key discussion points: highest-scoring remaining statements (term frequency), in original order.
  const freq = new Map<string, number>()
  for (const s of statements) for (const w of contentWords(s.text)) freq.set(w, (freq.get(w) ?? 0) + 1)
  const score = (s: Sentence) => {
    const words = contentWords(s.text)
    return words.length === 0 ? 0 : words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0) / Math.sqrt(words.length)
  }
  const keyDiscussionPoints = statements
    .filter((s) => !used.has(s) && s.text.length <= 300)
    .map((s) => ({ s, score: score(s) }))
    .sort((a, b) => b.score - a.score || a.s.turnIndex - b.s.turnIndex)
    .slice(0, 8)
    .sort((a, b) => a.s.turnIndex - b.s.turnIndex)
    .map(({ s }) => attribute(s))

  // Summary: composed only of the extracted sentences above.
  const join = (xs: string[], n: number, empty: string) =>
    xs.length ? xs.slice(0, n).map((x) => x.replace(/^[\p{L}'’.-]+(?: [\p{L}'’.-]+){0,2}: /u, '')).join(' ') : empty

  return {
    provider: 'mock',
    generatedAt: new Date().toISOString(),
    summary: {
      purpose: purposeSentence ? purposeSentence.text : NO_PURPOSE,
      discussionPoints: join(keyDiscussionPoints, 3, NO_DISCUSSION),
      outcomes: join(decisions, 3, NO_OUTCOMES),
      concerns: join(risks, 3, NO_CONCERNS),
      nextSteps: actionItems.length ? actionItems.slice(0, 4).map((a) => `${stripPeriod(a.description)}.`).join(' ') : NO_NEXT_STEPS,
    },
    keyDiscussionPoints,
    decisions,
    actionItems,
    risks,
    unansweredQuestions,
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Rich-text (HTML) notes pre-filled from the summary; the user then edits freely. */
export function summaryToHtml(summary: AIResult['summary']): string {
  const part = (title: string, text: string) => `<h3>${title}</h3><p>${escapeHtml(text)}</p>`
  return (
    '<h2>Summary (Mock AI, not verified)</h2>' +
    part('Purpose', summary.purpose) +
    part('Discussion points', summary.discussionPoints) +
    part('Outcomes', summary.outcomes) +
    part('Concerns', summary.concerns) +
    part('Next steps', summary.nextSteps)
  )
}
