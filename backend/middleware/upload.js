import multer from 'multer'

export const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new Error('Only JPEG, PNG, or WEBP photos are allowed'))
      return
    }
    cb(null, true)
  },
})

export const uploadTeacherPhoto = upload
export const uploadStudentPhoto = upload
