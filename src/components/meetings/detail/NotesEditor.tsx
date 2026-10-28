import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { normalizeError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { toSafeUrl } from '@/utils/safeUrl'

interface NotesEditorProps {
  /** Last saved notes (HTML). Remount with a new `key` to load different content. */
  initialHtml: string
  onSave: (html: string) => Promise<void>
  onDirtyChange: (dirty: boolean) => void
}

/** TipTap serialises an empty document as <p></p>; treat it as empty. */
const clean = (html: string) => (html === '<p></p>' ? '' : html)

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor selection when clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-w-9 rounded-md border px-2 py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50 ${
        active
          ? 'border-indigo-500 bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100'
          : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

export function NotesEditor({ initialHtml, onSave, onDirtyChange }: NotesEditorProps) {
  const baseline = useRef(clean(initialHtml))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Only what the notes need: headings, bold, italic, lists, links.
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: false,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
          isAllowedUri: (url) => toSafeUrl(url) !== null,
        },
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Meeting notes', class: 'rich-text' },
    },
    onUpdate: ({ editor: e }) => {
      setSavedAt(false)
      setDirty(clean(e.getHTML()) !== baseline.current)
    },
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive('bold') ?? false,
      italic: e?.isActive('italic') ?? false,
      h2: e?.isActive('heading', { level: 2 }) ?? false,
      h3: e?.isActive('heading', { level: 3 }) ?? false,
      bullet: e?.isActive('bulletList') ?? false,
      ordered: e?.isActive('orderedList') ?? false,
      link: e?.isActive('link') ?? false,
    }),
  })

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  // Warn before closing the tab with unsaved notes.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  if (!editor) return null

  const openLink = () => {
    setLinkError(null)
    setLinkUrl((editor.getAttributes('link').href as string | undefined) ?? '')
    setLinkOpen(true)
  }

  const applyLink = () => {
    const safe = toSafeUrl(linkUrl)
    if (!safe) {
      setLinkError('Enter a valid http(s) or mailto link.')
      return
    }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      setLinkError('Select the text you want to turn into a link first.')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run()
    setLinkOpen(false)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
  }

  const save = async () => {
    const html = clean(editor.getHTML())
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(html)
      baseline.current = html
      setDirty(false)
      setSavedAt(true)
    } catch (e) {
      setSaveError(normalizeError(e).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div role="toolbar" aria-label="Notes formatting" className="flex flex-wrap gap-1.5">
        <ToolButton label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolButton>
        <ToolButton label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolButton>
        <ToolButton label="Heading" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolButton>
        <ToolButton label="Subheading" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolButton>
        <ToolButton label="Bulleted list" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </ToolButton>
        <ToolButton label="Numbered list" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </ToolButton>
        <ToolButton label="Link" active={state.link} onClick={openLink}>
          Link
        </ToolButton>
      </div>

      {linkOpen && (
        <div className="mt-2 rounded-md border border-slate-300 p-3 dark:border-slate-700">
          <label htmlFor="notes-link-url" className="block text-sm font-medium">
            Link address
          </label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              id="notes-link-url"
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyLink()
                }
              }}
              placeholder="https://example.com"
              aria-invalid={linkError ? true : undefined}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <div className="flex gap-2">
              <Button type="button" onClick={applyLink}>
                Apply
              </Button>
              {state.link && (
                <button type="button" onClick={removeLink} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                  Remove link
                </button>
              )}
              <button type="button" onClick={() => setLinkOpen(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                Cancel
              </button>
            </div>
          </div>
          {linkError && (
            <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {linkError}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-2 focus-within:outline-2 focus-within:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900">
        <EditorContent editor={editor} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void save()} loading={saving} disabled={!dirty}>
          {saving ? 'Saving…' : 'Save notes'}
        </Button>
        {dirty && !saving && <span className="text-sm text-amber-700 dark:text-amber-300">Unsaved changes</span>}
        {savedAt && !dirty && (
          <span role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
            Notes saved.
          </span>
        )}
      </div>
      {saveError && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {saveError}
        </p>
      )}
    </div>
  )
}
