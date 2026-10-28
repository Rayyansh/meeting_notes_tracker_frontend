import { Link, useNavigate } from 'react-router-dom'
import { meetingsService } from '@/api/services'
import { MeetingForm } from '@/components/meetings/MeetingForm'
import { useToast } from '@/components/ui/Toast'
import type { MeetingInput } from '@/types'

export default function NewMeetingPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const create = async (input: MeetingInput) => {
    const meeting = await meetingsService.create(input)
    toast.success('Meeting created.')
    navigate(`/meetings/${meeting.id}`)
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link to="/meetings" className="text-sm text-indigo-700 hover:underline dark:text-indigo-300">
        ← Back to meetings
      </Link>
      <h1 className="mt-2 text-xl font-semibold">New meeting</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Add the meeting details and its transcript. AI summaries can be generated after saving.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <MeetingForm
          submitLabel="Create meeting"
          submittingLabel="Creating…"
          onSubmit={create}
          onCancel={() => navigate('/meetings')}
        />
      </div>
    </section>
  )
}
