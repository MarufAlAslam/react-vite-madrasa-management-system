import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addTeacher, deleteTeacher, getTeacherById, getTeachers, updateTeacher } from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { uploadTeacherPhoto } from '../middleware/upload.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

const DESIGNATIONS = [
  'Assistant Teacher',
  'Senior Assistant Teacher',
  'Lecturer',
  'Assistant Professor',
  'Vice Principal',
  'Principal',
]

router.get('/', async (req, res) => {
  try {
    const teachers = await getTeachers()
    res.json(teachers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, uploadTeacherPhoto.single('photo'), async (req, res) => {
  const { name, designation, subject, indexNo, phone } = req.body

  if (!req.file) {
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

  let photoUrl
  try {
    photoUrl = await uploadPhoto('teachers', req.file)
  } catch (error) {
    res.status(500).json({ error: `Photo upload failed: ${error.message}` })
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
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addTeacher(record)
    await recordActivity({ admin: req.admin, action: 'teacher.create', targetType: 'teacher', details: name })
    res.status(201).json(record)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, requireSuperAdmin, uploadTeacherPhoto.single('photo'), async (req, res) => {
  const { id } = req.params
  const { name, designation, subject, indexNo, phone } = req.body

  if (!name || !designation || !subject || !indexNo || !phone) {
    res.status(400).json({ error: 'name, designation, subject, indexNo, and phone are required' })
    return
  }

  if (!DESIGNATIONS.includes(designation)) {
    res.status(400).json({ error: `designation must be one of: ${DESIGNATIONS.join(', ')}` })
    return
  }

  const existing = await getTeacherById(id).catch(() => null)
  if (!existing) {
    res.status(404).json({ error: 'Teacher not found' })
    return
  }

  let photoUrl = existing.photoUrl
  if (req.file) {
    try {
      photoUrl = await uploadPhoto('teachers', req.file)
    } catch (error) {
      res.status(500).json({ error: `Photo upload failed: ${error.message}` })
      return
    }
  }

  try {
    const updated = await updateTeacher(id, { name, designation, subject, indexNo, phone, photoUrl })
    if (req.file && existing.photoUrl) {
      await deletePhoto(existing.photoUrl)
    }
    await recordActivity({ admin: req.admin, action: 'teacher.update', targetType: 'teacher', details: name })
    res.json(updated)
  } catch (error) {
    if (req.file) await deletePhoto(photoUrl)
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

    if (deleted.photoUrl) {
      await deletePhoto(deleted.photoUrl)
    }

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
