import { Router } from 'express'
import crypto from 'node:crypto'
import { addStudent, getStudents } from '../services/googleSheets.js'
import { deletePhoto, uploadPhoto } from '../services/blobStorage.js'
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
  const { className, name, parentsNames, dob, contact } = req.body

  if (!req.file) {
    res.status(400).json({ error: 'photo is required' })
    return
  }

  if (!className || !name || !parentsNames || !dob || !contact) {
    res.status(400).json({ error: 'className, name, parentsNames, dob, and contact are required' })
    return
  }

  if (!CLASSES.includes(className)) {
    res.status(400).json({ error: `className must be one of: ${CLASSES.join(', ')}` })
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
      parentsNames,
      dob,
      contact,
      photoUrl,
      createdAt: new Date().toISOString(),
    }

    await addStudent(record)
    res.status(201).json(record)
  } catch (error) {
    await deletePhoto(photoUrl)
    res.status(500).json({ error: error.message })
  }
})

export default router
