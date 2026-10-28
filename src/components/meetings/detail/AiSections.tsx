import type { ReactNode } from 'react'
import type { AIResult } from '@/types'
import { NO_OUTCOMES } from '@/api/mock/mockAi'
import { NO_DUE_DATE_LABEL, UNASSIGNED_LABEL } from '@/types'
import { formatDate } from '@/utils/date'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  )
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-slate-600 dark:text-slate-400">{empty}</p>
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

const SUMMARY_PARTS: { key: keyof AIResult['summary']; label: string }[] = [
  { key: 'purpose', label: 'Purpose' },
  { key: 'discussionPoints', label: 'Discussion points' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'concerns', label: 'Concerns' },
  { key: 'nextSteps', label: 'Next steps' },
]

/** The separate AI output sections. Missing data is always shown as an explicit "none/unassigned" message. */
export function AiSections({ result }: { result: AIResult }) {
  return (
    <div className="space-y-4">
      <Section title="Summary">
        <dl className="space-y-3">
          {SUMMARY_PARTS.map(({ key, label }) => (
            <div key={key}>
              <dt className="font-medium text-slate-700 dark:text-slate-300">{label}</dt>
              <dd className="mt-0.5">{result.summary[key]}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Key discussion points">
        <BulletList items={result.keyDiscussionPoints} empty="No discussion points identified." />
      </Section>

      <Section title="Decisions">
        <BulletList items={result.decisions} empty={NO_OUTCOMES} />
      </Section>

      <Section title="Action items">
        {result.actionItems.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No action items identified.</p>
        ) : (
          <ul className="space-y-2">
            {result.actionItems.map((item) => (
              <li key={item.description} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <p>{item.description}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Owner: {item.owner || UNASSIGNED_LABEL} · Due: {item.dueDate ? formatDate(item.dueDate) : NO_DUE_DATE_LABEL} · Priority: {item.priority}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Risks and concerns">
        <BulletList items={result.risks} empty="No risks or concerns identified." />
      </Section>

      <Section title="Unanswered questions">
        <BulletList items={result.unansweredQuestions} empty="No unanswered questions identified." />
      </Section>
    </div>
  )
}
