export type TranscriptFileResult = { ok: true; text: string } | { ok: false; message: string }

/**
 * Client-side checks for an uploaded transcript (UX only; the backend must
 * enforce its own type/size limits). Only plain .txt is supported.
 */
export async function readTranscriptFile(file: File, maxKb: number): Promise<TranscriptFileResult> {
  if (!/\.txt$/i.test(file.name)) {
    return { ok: false, message: 'Only .txt files are supported. Convert your transcript to plain text and try again.' }
  }
  if (file.type && file.type !== 'text/plain') {
    return { ok: false, message: 'That file does not look like plain text. Please upload a .txt file.' }
  }
  if (file.size === 0) {
    return { ok: false, message: 'That file is empty.' }
  }
  if (file.size > maxKb * 1024) {
    return { ok: false, message: `That file is too large. The maximum size is ${maxKb} KB.` }
  }

  let raw: string
  try {
    raw = await file.text()
  } catch {
    return { ok: false, message: 'We could not read that file. Please try again or paste the text instead.' }
  }

  // Binary files renamed to .txt: NUL bytes or lots of undecodable characters.
  const replacementCount = (raw.match(/�/g) ?? []).length
  if (raw.includes('\u0000') || replacementCount > Math.max(3, raw.length * 0.01)) {
    return { ok: false, message: 'That file does not look like plain text. Please upload a .txt file.' }
  }

  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  if (text.trim() === '') {
    return { ok: false, message: 'That file contains no text.' }
  }
  return { ok: true, text }
}
