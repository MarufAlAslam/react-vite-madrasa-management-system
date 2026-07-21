import { Router } from 'express'
import crypto from 'node:crypto'
import { addTeacher, getTeachers } from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
import { uploadTeacherPhoto } from '../middleware/upload.js'

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

router.post('/', uploadTeacherPhoto.single('photo'), async (req, res) => {
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
    res.status(201).json(record)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

export default router
