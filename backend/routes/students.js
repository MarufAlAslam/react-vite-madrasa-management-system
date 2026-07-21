import { Router } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import { addStudent, getStudents } from '../services/googleSheets.js'
import { uploadStudentPhoto } from '../middleware/upload.js'

const router = Router()

const CLASSES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Alim 1st Year',
  'Alim 2nd Year',
  'Fazil 1st Year',
  'Fazil 2nd Year',
  'Kamil 1st Year',
  'Kamil 2nd Year',
]

router.get('/', async (req, res) => {
  try {
    const students = await getStudents()
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', uploadStudentPhoto.single('photo'), async (req, res) => {
  async function fail(status, message) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {})
    }
    res.status(status).json({ error: message })
  }

  try {
    const { className, name, parentsNames, dob, contact } = req.body

    if (!req.file) {
      await fail(400, 'photo is required')
      return
    }

    if (!className || !name || !parentsNames || !dob || !contact) {
      await fail(400, 'className, name, parentsNames, dob, and contact are required')
      return
    }

    if (!CLASSES.includes(className)) {
      await fail(400, `className must be one of: ${CLASSES.join(', ')}`)
      return
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/students/${req.file.filename}`

    const record = {
      id: crypto.randomUUID(),
      className,
      name,
      parentsNames,
      dob,
      contact,
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addStudent(record)
    res.status(201).json(record)
  } catch (error) {
    await fail(500, error.message)
  }
})

export default router
