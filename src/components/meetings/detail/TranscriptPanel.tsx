import { useState } from 'react'

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0)

export function TranscriptPanel({ transcript }: { transcript: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div>
      <div
        role="region"
        aria-label="Transcript text"
        tabIndex={0}
        className={`overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-950 ${
          expanded ? 'max-h-[70vh]' : 'max-h-64'
        }`}
      >
        {transcript}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {wordCount(transcript).toLocaleString()} words · {transcript.length.toLocaleString()} characters
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="rounded-md px-2 py-1 text-sm font-medium text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-300"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  )
}
