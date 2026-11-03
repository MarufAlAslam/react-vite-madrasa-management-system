import multer from 'multer'

export const ALLOWED_MIME_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export const DOCUMENT_MIME_TYPES = {
  ...ALLOWED_MIME_TYPES,
  'application/pdf': '.pdf',
}

export const TEACHER_DOCUMENT_FIELDS = ['ntraCertificate', 'appointmentLetter', 'joiningLetter', 'additionalDocument']

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
export const uploadSettingsAssets = upload
export const uploadStaffPhoto = upload

// Teacher form: one photo (images only) plus optional PDF/image documents.
// Kept under Vercel's 4.5 MB request body limit, so each file is capped at 4 MB.
export const uploadTeacherFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = file.fieldname === 'photo' ? ALLOWED_MIME_TYPES : DOCUMENT_MIME_TYPES
    if (!allowed[file.mimetype]) {
      cb(
        new Error(
          file.fieldname === 'photo'
            ? 'Only JPEG, PNG, or WEBP photos are allowed'
            : 'Documents must be PDF, JPEG, PNG, or WEBP files',
        ),
      )
      return
    }
    cb(null, true)
  },
}).fields([
  { name: 'photo', maxCount: 1 },
  ...TEACHER_DOCUMENT_FIELDS.map((name) => ({ name, maxCount: 1 })),
])
