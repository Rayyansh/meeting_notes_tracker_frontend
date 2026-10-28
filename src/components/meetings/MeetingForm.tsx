import { useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { MeetingInput } from '@/types'
import { MEETING_TYPES } from '@/types'
import { env } from '@/config/env'
import { normalizeError } from '@/api/errors'
import { parseParticipants } from '@/utils/participants'
import { readTranscriptFile } from '@/utils/transcriptFile'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SelectField } from '@/components/ui/SelectField'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { TextField } from '@/components/ui/TextField'
import {
  EMPTY_MEETING_FORM,
  meetingFormSchema,
  toMeetingInput,
  TRANSCRIPT_MAX_CHARS,
  type MeetingFormValues,
} from './meetingFormSchema'

interface MeetingFormProps {
  initialValues?: MeetingFormValues
  submitLabel: string
  submittingLabel: string
  /** Should throw on failure; the form shows the friendly message / field errors. */
  onSubmit: (input: MeetingInput) => Promise<void>
  onCancel: () => void
  /** Edit mode: shown while the transcript differs from `originalTranscript` (e.g. AI results will go stale). */
  transcriptWarning?: { originalTranscript: string; message: string }
}

const FIELDS = ['title', 'date', 'type', 'participants', 'transcript'] as const

export function MeetingForm({
  initialValues = EMPTY_MEETING_FORM,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  transcriptWarning,
}: MeetingFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const [pendingUpload, setPendingUpload] = useState<{ name: string; size: number; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: initialValues,
  })

  const transcript = watch('transcript')
  const participantCount = parseParticipants(watch('participants')).length

  const applyUpload = (u: { name: string; size: number; text: string }) => {
    setValue('transcript', u.text, { shouldDirty: true, shouldValidate: true })
    setUploadNote(`Loaded from ${u.name} (${Math.max(1, Math.round(u.size / 1024))} KB). You can edit the text below.`)
  }

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (!file) return
    setUploadError(null)
    const result = await readTranscriptFile(file, env.maxUploadKb)
    if (!result.ok) {
      setUploadError(result.message)
      return
    }
    const upload = { name: file.name, size: file.size, text: result.text }
    // Never silently replace text the user already entered.
    if (getValues('transcript').trim() !== '') setPendingUpload(upload)
    else applyUpload(upload)
  }

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSubmit(toMeetingInput(values))
    } catch (error) {
      const friendly = normalizeError(error)
      let mapped = false
      for (const field of FIELDS) {
        const message = friendly.fieldErrors?.[field]
        if (message) {
          setError(field, { message })
          mapped = true
        }
      }
      setFormError(mapped ? 'Please fix the highlighted fields and try again.' : friendly.message)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}

      <TextField label="Title *" autoComplete="off" error={errors.title?.message} {...register('title')} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Date *" type="date" error={errors.date?.message} {...register('date')} />
        <SelectField
          label="Type *"
          placeholder="Select a type"
          options={MEETING_TYPES}
          error={errors.type?.message}
          {...register('type')}
        />
      </div>

      {/* A textarea (not an input) so a pasted column of names keeps its line breaks. */}
      <TextAreaField
        label="Participants"
        rows={2}
        autoComplete="off"
        placeholder="Maria, James, Neha"
        error={errors.participants?.message}
        footer={
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {participantCount > 0
              ? `${participantCount} participant${participantCount === 1 ? '' : 's'}. Separate names with commas or new lines.`
              : 'Optional. Separate names with commas or new lines.'}
          </p>
        }
        {...register('participants')}
      />

      <TextAreaField
        label="Transcript *"
        rows={14}
        placeholder="Paste the meeting transcript here, or upload a .txt file."
        className="font-mono"
        error={errors.transcript?.message}
        labelAction={
          <span>
            <input
              ref={fileInputRef}
              id="transcript-file"
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => void onFileChosen(e)}
              className="peer sr-only"
            />
            <label
              htmlFor="transcript-file"
              className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Upload .txt file
            </label>
          </span>
        }
        footer={
          <div className="mt-1 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            {uploadError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
            {uploadNote && !uploadError && <p role="status">{uploadNote}</p>}
            {transcriptWarning && transcript !== transcriptWarning.originalTranscript && (
              <p
                role="status"
                className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
              >
                {transcriptWarning.message}
              </p>
            )}
            <p>
              {transcript.length.toLocaleString()} / {TRANSCRIPT_MAX_CHARS.toLocaleString()} characters. Plain .txt files up to {env.maxUploadKb} KB.
            </p>
          </div>
        }
        {...register('transcript')}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingUpload !== null}
        title="Replace transcript text?"
        confirmLabel="Replace with file"
        onConfirm={() => {
          if (pendingUpload) applyUpload(pendingUpload)
          setPendingUpload(null)
        }}
        onCancel={() => setPendingUpload(null)}
      >
        <p>
          The transcript field already has text. Replace it with the contents of “{pendingUpload?.name}”?
        </p>
      </ConfirmDialog>
    </form>
  )
}
