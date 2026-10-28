import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { aiService, meetingsService } from '@/api/services'
import { normalizeError } from '@/api/errors'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { Meeting } from '@/types'
import { formatDate, formatDateTime } from '@/utils/date'
import { AiSections } from '@/components/meetings/detail/AiSections'
import { NotesEditor } from '@/components/meetings/detail/NotesEditor'
import { TranscriptPanel } from '@/components/meetings/detail/TranscriptPanel'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { EditIcon, TrashIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

const NOT_SPECIFIED = 'Not specified'
const MOCK_BADGE = 'Mock AI – not verified'

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading meeting" className="space-y-4">
      <span className="sr-only">Loading meeting…</span>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function MeetingDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const load = useCallback(() => meetingsService.get(id), [id])
  const { data, error, errorCode, loading, reload } = useAsyncData(load)

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  useEffect(() => {
    if (data) setMeeting(data)
  }, [data])
  // useAsyncData keeps the previous meeting while a new id loads; never show another meeting's data.
  const current = meeting && meeting.id === id ? meeting : null

  const [notesDirty, setNotesDirty] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const lastOptions = useRef({ replaceNotes: false })
  const [confirmGenerate, setConfirmGenerate] = useState(false)
  const [replaceNotesChoice, setReplaceNotesChoice] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const runGenerate = async (options: { replaceNotes: boolean }) => {
    lastOptions.current = options
    setGenerating(true)
    setAiError(null)
    try {
      const updated = await aiService.generate(id, options)
      // Reload the editor only when notes were really replaced and nothing unsaved would be lost silently
      // (an unsaved draft is only discarded if the user explicitly chose to replace their notes).
      if (current && updated.notes !== current.notes && (!notesDirty || options.replaceNotes)) setEditorKey((k) => k + 1)
      setMeeting(updated)
      toast.success('AI summary generated (mock, not verified).')
    } catch (e) {
      const friendly = normalizeError(e)
      setAiError(friendly.message)
      if (friendly.code === 'AI_FAILED') setMeeting((m) => (m ? { ...m, aiStatus: 'failed' } : m))
    } finally {
      setGenerating(false)
    }
  }

  const hasResult = current?.aiResult != null
  const onGenerateClick = () => {
    // Regenerating, or generating while notes have unsaved edits, always asks first.
    if (hasResult || notesDirty) {
      setReplaceNotesChoice(false)
      setConfirmGenerate(true)
    } else {
      void runGenerate({ replaceNotes: false })
    }
  }

  const doDelete = async () => {
    if (!current) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await meetingsService.remove(current.id)
      toast.success(`Deleted “${current.title}”.`)
      navigate('/meetings')
    } catch (e) {
      setDeleteError(normalizeError(e).message)
      setDeleting(false)
    }
  }

  const saveNotes = async (html: string) => {
    const updated = await meetingsService.update(id, { notes: html })
    setMeeting(updated)
  }

  if (error && errorCode === 'NOT_FOUND') {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="font-medium">Meeting not found</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">It may have been deleted, or the link may be wrong.</p>
        <Link to="/meetings" className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
          Back to meetings
        </Link>
      </section>
    )
  }
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!current) return <DetailSkeleton />

  const processing = generating || current.aiStatus === 'processing'
  const failed = !processing && (current.aiStatus === 'failed' || aiError !== null)
  const mock = current.aiResult?.provider === 'mock'

  return (
    <article className="space-y-5" aria-busy={loading}>
      <div>
        <Link to="/meetings" className="text-sm text-indigo-700 hover:underline dark:text-indigo-300">
          ← Back to meetings
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold break-words">{current.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/meetings/${current.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <EditIcon className="size-4" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null)
                setConfirmDelete(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-500 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              <TrashIcon className="size-4" />
              Delete
            </button>
          </div>
        </div>

        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="inline font-medium">Date: </dt><dd className="inline">{formatDate(current.date)}</dd></div>
          <div><dt className="inline font-medium">Type: </dt><dd className="inline">{current.type}</dd></div>
          <div className="sm:col-span-2">
            <dt className="inline font-medium">Participants: </dt>
            <dd className="inline">{current.participants.length ? current.participants.join(', ') : NOT_SPECIFIED}</dd>
          </div>
          <div><dt className="inline font-medium">Created: </dt><dd className="inline">{formatDateTime(current.createdAt)}</dd></div>
          <div><dt className="inline font-medium">Last updated: </dt><dd className="inline">{formatDateTime(current.updatedAt)}</dd></div>
        </dl>
      </div>

      <Card
        title="AI summary"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {mock && !processing && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {MOCK_BADGE}
              </span>
            )}
            <Button type="button" onClick={onGenerateClick} loading={processing} disabled={processing}>
              {processing ? 'Generating…' : hasResult ? 'Regenerate with AI' : 'Generate with AI'}
            </Button>
          </div>
        }
      >
        <div aria-live="polite">
          {processing && (
            <p role="status" className="text-sm text-slate-700 dark:text-slate-300">
              Generating the summary, decisions, action items, risks and questions. This usually takes a few seconds…
            </p>
          )}
          {failed && (
            <div className="space-y-3">
              <Alert>
                {aiError ?? 'The AI could not process this meeting. Please try again.'}
                {hasResult && ' The previous result is shown below.'}
              </Alert>
              <Button type="button" onClick={() => void runGenerate(lastOptions.current)}>
                Try again
              </Button>
            </div>
          )}
          {!processing && !failed && !hasResult && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No AI summary yet. Generate one from the transcript below. The result is a mock and is not verified.
            </p>
          )}
        </div>

        {hasResult && current.aiResult && (
          <div className={processing ? 'opacity-60' : ''}>
            {current.aiStale && !processing && (
              <p role="status" className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                The transcript changed after this output was generated, so it may be out of date. Regenerate to refresh it.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Generated {formatDateTime(current.aiResult.generatedAt)}</p>
            <div className="mt-3">
              <AiSections result={current.aiResult} />
            </div>
          </div>
        )}
      </Card>

      <Card title="Notes">
        <NotesEditor key={`${current.id}-${editorKey}`} initialHtml={current.notes} onSave={saveNotes} onDirtyChange={setNotesDirty} />
      </Card>

      <Card title="Transcript">
        <TranscriptPanel transcript={current.transcript} />
      </Card>

      <ConfirmDialog
        open={confirmGenerate}
        title={hasResult ? 'Regenerate AI summary?' : 'Generate AI summary?'}
        confirmLabel={hasResult ? 'Regenerate' : 'Generate'}
        onConfirm={() => {
          setConfirmGenerate(false)
          void runGenerate({ replaceNotes: replaceNotesChoice })
        }}
        onCancel={() => setConfirmGenerate(false)}
      >
        <div className="space-y-3">
          {hasResult && (
            <p>
              A new Mock AI run replaces the summary, key points, decisions, risks and questions shown here. Action items you added, edited or
              progressed are kept; unchanged AI-generated action items are replaced.
            </p>
          )}
          {(current.notesEdited || notesDirty) && (
            <>
              <p>
                {notesDirty ? 'You have unsaved changes in your notes. ' : ''}Your notes will be kept as they are.
              </p>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={replaceNotesChoice} onChange={(e) => setReplaceNotesChoice(e.target.checked)} className="mt-0.5" />
                <span>Replace my notes with the new summary instead (my edits will be lost)</span>
              </label>
            </>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete meeting?"
        confirmLabel="Delete meeting"
        destructive
        busy={deleting}
        error={deleteError}
        onConfirm={() => void doDelete()}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>“{current.title}” and all of its action items will be permanently deleted. This cannot be undone.</p>
      </ConfirmDialog>
    </article>
  )
}
