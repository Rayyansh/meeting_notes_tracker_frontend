import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { meetingsService } from '@/api/services'
import { normalizeError } from '@/api/errors'
import type { Meeting } from '@/types'
import { formatDate } from '@/utils/date'
import { useAsyncData } from '@/hooks/useAsyncData'
import { AiStatusBadge } from '@/components/meetings/AiStatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

const SEARCH_DEBOUNCE_MS = 300
const NOT_SPECIFIED = 'Not specified'

const participantsText = (m: Meeting) => (m.participants.length ? m.participants.join(', ') : NOT_SPECIFIED)

const linkButton =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-500'

function NewMeetingLink() {
  return (
    <Link
      to="/meetings/new"
      className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      <PlusIcon className="size-4" />
      New meeting
    </Link>
  )
}

function RowActions({ meeting, onDelete }: { meeting: Meeting; onDelete: (m: Meeting) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Link
        to={`/meetings/${meeting.id}/edit`}
        aria-label={`Edit ${meeting.title}`}
        className={`${linkButton} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}
      >
        <EditIcon className="size-4" />
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onDelete(meeting)}
        aria-label={`Delete ${meeting.title}`}
        className={`${linkButton} text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950`}
      >
        <TrashIcon className="size-4" />
        Delete
      </button>
    </div>
  )
}

function MeetingsTable({ meetings, onDelete }: { meetings: Meeting[]; onDelete: (m: Meeting) => void }) {
  return (
    <div className="relative hidden overflow-x-auto rounded-lg border border-slate-200 bg-white xl:block dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Meetings</caption>
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Title</th>
            <th scope="col" className="px-4 py-3 font-medium">Date</th>
            <th scope="col" className="px-4 py-3 font-medium">Type</th>
            <th scope="col" className="px-4 py-3 font-medium">Participants</th>
            <th scope="col" className="px-4 py-3 font-medium">AI</th>
            <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {meetings.map((m) => (
            <tr key={m.id}>
              <td className="max-w-xs px-4 py-3">
                <Link to={`/meetings/${m.id}`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
                  {m.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(m.date)}</td>
              <td className="whitespace-nowrap px-4 py-3">{m.type}</td>
              <td className="max-w-56 truncate px-4 py-3" title={participantsText(m)}>
                {participantsText(m)}
              </td>
              <td className="px-4 py-3"><AiStatusBadge meeting={m} /></td>
              <td className="px-4 py-3"><RowActions meeting={m} onDelete={onDelete} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MeetingCards({ meetings, onDelete }: { meetings: Meeting[]; onDelete: (m: Meeting) => void }) {
  return (
    <ul className="space-y-3 xl:hidden">
      {meetings.map((m) => (
        <li key={m.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <Link to={`/meetings/${m.id}`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">
            {m.title}
          </Link>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {formatDate(m.date)} · {m.type}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
            Participants: {participantsText(m)}
          </p>
          <div className="mt-2"><AiStatusBadge meeting={m} /></div>
          <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-800">
            <RowActions meeting={m} onDelete={onDelete} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading meetings" className="space-y-3">
      <span className="sr-only">Loading meetings…</span>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}

export default function MeetingsPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [input, setInput] = useState(query)

  // Debounce typing into the URL (?q=) so the search survives navigation/back.
  useEffect(() => {
    if (input === query) return
    const t = setTimeout(() => {
      setParams(input.trim() ? { q: input } : {}, { replace: true })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [input, query, setParams])

  // Keep the box in sync when the URL changes elsewhere (e.g. Clear search, back button).
  useEffect(() => setInput(query), [query])

  const searchTerm = query.trim()
  const load = useCallback(() => meetingsService.list({ search: searchTerm }), [searchTerm])
  const { data, error, loading, reload } = useAsyncData(load)

  const [pendingDelete, setPendingDelete] = useState<Meeting | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const closeDelete = () => {
    setPendingDelete(null)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await meetingsService.remove(pendingDelete.id)
      toast.success(`Deleted “${pendingDelete.title}”.`)
      closeDelete()
      reload()
    } catch (e) {
      setDeleteError(normalizeError(e).message)
    } finally {
      setDeleting(false)
    }
  }

  const meetings = data ?? []
  const showSkeleton = loading && data === null && !error
  const isEmpty = !loading && !error && data !== null && meetings.length === 0 && searchTerm === ''
  const noResults = !loading && !error && data !== null && meetings.length === 0 && searchTerm !== ''

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Meetings</h1>
        <NewMeetingLink />
      </div>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4">
        <label htmlFor="meeting-search" className="sr-only">
          Search meetings by title or participant
        </label>
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="meeting-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by title or participant"
            className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 focus:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </form>

      <div className="mt-4" aria-busy={loading} aria-live="polite">
        {showSkeleton && <ListSkeleton />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {isEmpty && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-medium">No meetings yet</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Create a meeting and add its transcript to get started.
            </p>
            <div className="mt-4"><NewMeetingLink /></div>
          </div>
        )}
        {noResults && (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-medium">No meetings match “{searchTerm}”</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Try a different title or participant name.</p>
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Clear search
            </button>
          </div>
        )}
        {!error && meetings.length > 0 && (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <MeetingsTable meetings={meetings} onDelete={setPendingDelete} />
            <MeetingCards meetings={meetings} onDelete={setPendingDelete} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete meeting?"
        confirmLabel="Delete meeting"
        destructive
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={closeDelete}
      >
        <p>
          “{pendingDelete?.title}” and all of its action items will be permanently deleted. This cannot be undone.
        </p>
      </ConfirmDialog>
    </section>
  )
}
