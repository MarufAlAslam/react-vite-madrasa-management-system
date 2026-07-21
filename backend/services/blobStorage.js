import crypto from 'node:crypto'
import { del, put } from '@vercel/blob'
import { ALLOWED_MIME_TYPES } from '../middleware/upload.js'

export async function uploadPhoto(folder, file) {
  const extension = ALLOWED_MIME_TYPES[file.mimetype]
  const pathname = `${folder}/${Date.now()}-${crypto.randomUUID()}${extension}`

  const blob = await put(pathname, file.buffer, {
    access: 'public',
    contentType: file.mimetype,
  })

  return blob.url
}

export async function deletePhoto(url) {
  await del(url).catch(() => {})
}
