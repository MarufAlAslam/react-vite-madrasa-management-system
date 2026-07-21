import { Router } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import { addTeacher, getTeachers } from '../services/googleSheets.js'
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
  async function fail(status, message) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    res.status(status).json({ error: message })
  }

  try {
    const { name, designation, subject, indexNo, phone } = req.body

    if (!req.file) {
      await fail(400, 'photo is required')
      return
    }

    if (!name || !designation || !subject || !indexNo || !phone) {
      await fail(400, 'name, designation, subject, indexNo, and phone are required')
      return
    }

    if (!DESIGNATIONS.includes(designation)) {
      await fail(400, `designation must be one of: ${DESIGNATIONS.join(', ')}`)
      return
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/teachers/${req.file.filename}`

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
    await fail(500, error.message)
  }
})

export default router
