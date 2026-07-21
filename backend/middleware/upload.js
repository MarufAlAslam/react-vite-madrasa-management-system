import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads')

const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

function createUploader(subfolder) {
  const destination = path.join(UPLOADS_ROOT, subfolder)

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, destination)
    },
    filename(req, file, cb) {
      const extension = ALLOWED_MIME_TYPES[file.mimetype]
      cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (!ALLOWED_MIME_TYPES[file.mimetype]) {
        cb(new Error('Only JPEG, PNG, or WEBP photos are allowed'))
        return
      }
      cb(null, true)
    },
  })
}

export const uploadTeacherPhoto = createUploader('teachers')
export const uploadStudentPhoto = createUploader('students')
export { UPLOADS_ROOT }
