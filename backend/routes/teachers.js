import { Router } from 'express'
import crypto from 'node:crypto'
import { optionalAuth, requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addTeacher, deleteTeacher, getClasses, getTeacherById, getTeachers, updateTeacher } from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { TEACHER_DOCUMENT_FIELDS, uploadTeacherFiles } from '../middleware/upload.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

const DESIGNATIONS = [
  'Principal',
  'Vice Principal',
  'Assistant Professor',
  'Lecturer',
  'Senior Assistant Teacher',
  'Assistant Teacher',
]

const UNIQUE_DESIGNATIONS = ['Principal', 'Vice Principal']

const GENDERS = ['Male', 'Female']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function pickProfileFields(body) {
  const { joiningDate, gender, bloodGroup, qualification, nid, address } = body
  return {
    joiningDate: joiningDate || '',
    gender: gender || '',
    bloodGroup: bloodGroup || '',
    qualification: qualification || '',
    nid: nid || '',
    address: address || '',
  }
}

function validateProfileFields({ gender, bloodGroup }) {
  if (gender && !GENDERS.includes(gender)) return `gender must be one of: ${GENDERS.join(', ')}`
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) return `bloodGroup must be one of: ${BLOOD_GROUPS.join(', ')}`
  return null
}

const DOCUMENT_URL_KEYS = TEACHER_DOCUMENT_FIELDS.map((field) => `${field}Url`)

// NID and uploaded documents are sensitive: only admins may see them, public visitors never do.
function withoutPrivateFields(teacher) {
  const rest = { ...teacher }
  delete rest.nid
  DOCUMENT_URL_KEYS.forEach((key) => delete rest[key])
  return rest
}

// Uploads whichever documents were sent; on any failure removes the ones already stored.
async function uploadDocuments(files) {
  const urls = {}
  try {
    for (const field of TEACHER_DOCUMENT_FIELDS) {
      const file = files?.[field]?.[0]
      if (file) urls[`${field}Url`] = await uploadPhoto('teacher-documents', file)
    }
  } catch (error) {
    await Promise.all(Object.values(urls).map(deletePhoto))
    throw new Error(`Document upload failed: ${error.message}`)
  }
  return urls
}

async function findDesignationHolder(designation, excludeId) {
  if (!UNIQUE_DESIGNATIONS.includes(designation)) return null
  const teachers = await getTeachers()
  return teachers.find((teacher) => teacher.designation === designation && teacher.id !== excludeId) || null
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const teachers = await getTeachers()
    // Teacher logins are not admins, so they get the public view too.
    const canSeePrivate = req.admin && req.admin.role !== 'teacher'
    res.json(canSeePrivate ? teachers : teachers.map(withoutPrivateFields))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, uploadTeacherFiles, async (req, res) => {
  const { name, designation, subject, indexNo, phone } = req.body
  const photoFile = req.files?.photo?.[0]

  if (!photoFile) {
    res.status(400).json({ error: 'photo is required' })
    return
  }

  if (!name || !designation || !subject || !indexNo || !phone) {
    res.status(400).json({ error: 'name, designation, subject, indexNo, and phone are required' })
    return
  }

  if (!DESIGNATIONS.includes(designation)) {
    res.status(400).json({ error: `designation must be one of: ${DESIGNATIONS.join(', ')}` })
    return
  }

  const profileFields = pickProfileFields(req.body)
  const profileError = validateProfileFields(profileFields)
  if (profileError) {
    res.status(400).json({ error: profileError })
    return
  }

  const existingHolder = await findDesignationHolder(designation, null)
  if (existingHolder) {
    res.status(409).json({ error: `${designation} is already assigned to ${existingHolder.name}` })
    return
  }

  let photoUrl
  try {
    photoUrl = await uploadPhoto('teachers', photoFile)
  } catch (error) {
    res.status(500).json({ error: `Photo upload failed: ${error.message}` })
    return
  }

  let documentUrls
  try {
    documentUrls = await uploadDocuments(req.files)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
    return
  }

  try {
    const record = {
      id: crypto.randomUUID(),
      name,
      designation,
      subject,
      indexNo,
      phone,
      ...profileFields,
      ...documentUrls,
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addTeacher(record)
    await recordActivity({ admin: req.admin, action: 'teacher.create', targetType: 'teacher', details: name })
    res.status(201).json(record)
  } catch (error) {
    await Promise.all([photoUrl, ...Object.values(documentUrls)].map(deletePhoto))
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, requireSuperAdmin, uploadTeacherFiles, async (req, res) => {
  const { id } = req.params
  const { name, designation, subject, indexNo, phone, removeDocuments } = req.body
  const photoFile = req.files?.photo?.[0]

  if (!name || !designation || !subject || !indexNo || !phone) {
    res.status(400).json({ error: 'name, designation, subject, indexNo, and phone are required' })
    return
  }

  if (!DESIGNATIONS.includes(designation)) {
    res.status(400).json({ error: `designation must be one of: ${DESIGNATIONS.join(', ')}` })
    return
  }

  const profileFields = pickProfileFields(req.body)
  const profileError = validateProfileFields(profileFields)
  if (profileError) {
    res.status(400).json({ error: profileError })
    return
  }

  const existing = await getTeacherById(id).catch(() => null)
  if (!existing) {
    res.status(404).json({ error: 'Teacher not found' })
    return
  }

  const existingHolder = await findDesignationHolder(designation, id)
  if (existingHolder) {
    res.status(409).json({ error: `${designation} is already assigned to ${existingHolder.name}` })
    return
  }

  let photoUrl = existing.photoUrl
  if (photoFile) {
    try {
      photoUrl = await uploadPhoto('teachers', photoFile)
    } catch (error) {
      res.status(500).json({ error: `Photo upload failed: ${error.message}` })
      return
    }
  }

  let newDocumentUrls
  try {
    newDocumentUrls = await uploadDocuments(req.files)
  } catch (error) {
    if (photoFile) await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
    return
  }

  // A newly uploaded file replaces the old one; otherwise a document is cleared only if the admin asked to remove it.
  const documentPatch = { ...newDocumentUrls }
  String(removeDocuments || '')
    .split(',')
    .filter((field) => TEACHER_DOCUMENT_FIELDS.includes(field) && !newDocumentUrls[`${field}Url`])
    .forEach((field) => {
      documentPatch[`${field}Url`] = ''
    })

  try {
    const updated = await updateTeacher(id, {
      name,
      designation,
      subject,
      indexNo,
      phone,
      ...profileFields,
      ...documentPatch,
      photoUrl,
    })

    if (photoFile && existing.photoUrl) {
      await deletePhoto(existing.photoUrl)
    }
    await Promise.all(Object.keys(documentPatch).map((key) => existing[key] && deletePhoto(existing[key])))

    await recordActivity({ admin: req.admin, action: 'teacher.update', targetType: 'teacher', details: name })
    res.json(updated)
  } catch (error) {
    if (photoFile) await deletePhoto(photoUrl)
    await Promise.all(Object.values(newDocumentUrls).map(deletePhoto))
    res.status(500).json({ error: error.message })
  }
})

// Replaces the teacher's class/subject assignments. Each entry is { className, subject } and must exist in Classes.
router.put('/:id/assign', requireAuth, requireSuperAdmin, async (req, res) => {
  const { assignments } = req.body

  if (!Array.isArray(assignments)) {
    res.status(400).json({ error: 'assignments must be an array of { className, subject }' })
    return
  }

  try {
    const classes = await getClasses()
    const cleaned = []

    for (const item of assignments) {
      const subjects = classes.find((classItem) => classItem.className === item?.className)?.subjects
      if (!subjects?.some((subject) => subject.name === item.subject)) {
        res.status(400).json({ error: `"${item?.subject}" is not a subject of "${item?.className}"` })
        return
      }
      if (!cleaned.some((entry) => entry.className === item.className && entry.subject === item.subject)) {
        cleaned.push({ className: item.className, subject: item.subject })
      }
    }

    const updated = await updateTeacher(req.params.id, { assignedClasses: cleaned })
    if (!updated) {
      res.status(404).json({ error: 'Teacher not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'teacher.assign',
      targetType: 'teacher',
      details: `${updated.name} -> ${cleaned.map((entry) => `${entry.className}/${entry.subject}`).join(', ') || 'none'}`,
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteTeacher(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Teacher not found' })
      return
    }

    await Promise.all([deleted.photoUrl, ...DOCUMENT_URL_KEYS.map((key) => deleted[key])].map((url) => url && deletePhoto(url)))

    await recordActivity({
      admin: req.admin,
      action: 'teacher.delete',
      targetType: 'teacher',
      details: deleted.name,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
