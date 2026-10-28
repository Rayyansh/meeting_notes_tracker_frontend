import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { meetingsService } from '@/api/services'
import { useAsyncData } from '@/hooks/useAsyncData'
import { MeetingForm } from '@/components/meetings/MeetingForm'
import { toMeetingFormValues } from '@/components/meetings/meetingFormSchema'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import type { Meeting, MeetingInput } from '@/types'

const unchanged = (m: Meeting, input: MeetingInput) =>
  m.title === input.title &&
  m.date === input.date &&
  m.type === input.type &&
  m.transcript === input.transcript &&
  JSON.stringify(m.participants) === JSON.stringify(input.participants)

export default function EditMeetingPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const load = useCallback(() => meetingsService.get(id), [id])
  const { data: meeting, error, errorCode, loading, reload } = useAsyncData(load)

  const detailPath = `/meetings/${id}`

  const save = async (input: MeetingInput) => {
    if (!meeting) return
    if (unchanged(meeting, input)) {
      toast.success('No changes to save.')
      navigate(detailPath)
      return
    }
    await meetingsService.update(meeting.id, input)
    toast.success('Meeting updated.')
    navigate(detailPath)
  }

  // Warn only if there is an AI result that a transcript change would outdate.
  const hasAiResult = meeting?.aiResult != null

  return (
    <section className="mx-auto max-w-3xl">
      <Link to={detailPath} className="text-sm text-indigo-700 hover:underline dark:text-indigo-300">
        ← Back to meeting
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Edit meeting</h1>

      <div className="mt-6" aria-busy={loading}>
        {loading && !meeting && (
          <div role="status" aria-label="Loading meeting" className="space-y-4">
            <span className="sr-only">Loading meeting…</span>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && errorCode === 'NOT_FOUND' && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-medium">Meeting not found</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              It may have been deleted, or the link may be wrong.
            </p>
            <Link
              to="/meetings"
              className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Back to meetings
            </Link>
          </div>
        )}
        {error && errorCode !== 'NOT_FOUND' && <ErrorState message={error} onRetry={reload} />}

        {meeting && !error && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <MeetingForm
              key={meeting.id}
              initialValues={toMeetingFormValues(meeting)}
              submitLabel="Save changes"
              submittingLabel="Saving…"
              onSubmit={save}
              onCancel={() => navigate(detailPath)}
              transcriptWarning={
                hasAiResult
                  ? {
                      originalTranscript: meeting.transcript,
                      message:
                        'Changing the transcript will mark the existing AI summary, decisions and action items as outdated. Nothing is deleted, and you can regenerate them from the meeting page.',
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </section>
  )
}
