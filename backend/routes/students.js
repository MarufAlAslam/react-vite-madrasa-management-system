import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import {
  addStudent,
  deleteStudent,
  getClasses,
  getStudentById,
  getStudents,
  promoteStudentsByClass,
  updateStudent,
} from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { uploadStudentPhoto } from '../middleware/upload.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

async function getClassNames() {
  const classes = await getClasses()
  return classes.map((item) => item.className)
}

router.get('/', async (req, res) => {
  try {
    const students = await getStudents()
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, uploadStudentPhoto.single('photo'), async (req, res) => {
  const { className, name, fatherName, motherName, roll, dob, contact } = req.body

  if (!req.file) {
    res.status(400).json({ error: 'photo is required' })
    return
  }

  if (!className || !name || !fatherName || !motherName || !roll || !dob || !contact) {
    res.status(400).json({
      error: 'className, name, fatherName, motherName, roll, dob, and contact are required',
    })
    return
  }

  const classNames = await getClassNames()
  if (!classNames.includes(className)) {
    res.status(400).json({ error: `className must be one of: ${classNames.join(', ') || 'no classes configured yet'}` })
    return
  }

  let photoUrl
  try {
    photoUrl = await uploadPhoto('students', req.file)
  } catch (error) {
    res.status(500).json({ error: `Photo upload failed: ${error.message}` })
    return
  }

  try {
    const record = {
      id: crypto.randomUUID(),
      className,
      name,
      fatherName,
      motherName,
      roll,
      dob,
      contact,
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addStudent(record)
    await recordActivity({ admin: req.admin, action: 'student.create', targetType: 'student', details: name })
    res.status(201).json(record)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, requireSuperAdmin, uploadStudentPhoto.single('photo'), async (req, res) => {
  const { id } = req.params
  const { className, name, fatherName, motherName, roll, dob, contact } = req.body

  if (!className || !name || !fatherName || !motherName || !roll || !dob || !contact) {
    res.status(400).json({
      error: 'className, name, fatherName, motherName, roll, dob, and contact are required',
    })
    return
  }

  const classNames = await getClassNames()
  if (!classNames.includes(className)) {
    res.status(400).json({ error: `className must be one of: ${classNames.join(', ') || 'no classes configured yet'}` })
    return
  }

  const existing = await getStudentById(id).catch(() => null)
  if (!existing) {
    res.status(404).json({ error: 'Student not found' })
    return
  }

  let photoUrl = existing.photoUrl
  if (req.file) {
    try {
      photoUrl = await uploadPhoto('students', req.file)
    } catch (error) {
      res.status(500).json({ error: `Photo upload failed: ${error.message}` })
      return
    }
  }

  try {
    const updated = await updateStudent(id, {
      className,
      name,
      fatherName,
      motherName,
      roll,
      dob,
      contact,
      photoUrl,
    })
    if (req.file && existing.photoUrl) {
      await deletePhoto(existing.photoUrl)
    }
    await recordActivity({ admin: req.admin, action: 'student.update', targetType: 'student', details: name })
    res.json(updated)
  } catch (error) {
    if (req.file) await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteStudent(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Student not found' })
      return
    }

    if (deleted.photoUrl) {
      await deletePhoto(deleted.photoUrl)
    }

    await recordActivity({
      admin: req.admin,
      action: 'student.delete',
      targetType: 'student',
      details: deleted.name,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/promote', requireAuth, async (req, res) => {
  const { id } = req.params
  const { toClass } = req.body

  const classNames = await getClassNames()
  if (!toClass || !classNames.includes(toClass)) {
    res.status(400).json({ error: `toClass must be one of: ${classNames.join(', ') || 'no classes configured yet'}` })
    return
  }

  try {
    const updated = await updateStudent(id, { className: toClass })
    if (!updated) {
      res.status(404).json({ error: 'Student not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'student.promote',
      targetType: 'student',
      details: `${updated.name} -> ${toClass}`,
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/promote', requireAuth, async (req, res) => {
  const { fromClass, toClass } = req.body
  const classNames = await getClassNames()

  if (!fromClass || !classNames.includes(fromClass)) {
    res.status(400).json({ error: `fromClass must be one of: ${classNames.join(', ') || 'no classes configured yet'}` })
    return
  }

  if (!toClass || !classNames.includes(toClass)) {
    res.status(400).json({ error: `toClass must be one of: ${classNames.join(', ') || 'no classes configured yet'}` })
    return
  }

  try {
    const count = await promoteStudentsByClass(fromClass, toClass)

    await recordActivity({
      admin: req.admin,
      action: 'student.promote.bulk',
      targetType: 'student',
      details: `${fromClass} -> ${toClass} (${count} student${count === 1 ? '' : 's'})`,
    })

    res.json({ success: true, count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
