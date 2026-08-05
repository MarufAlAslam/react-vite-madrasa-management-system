import { Router } from 'express'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addClass, deleteClass, getClasses, updateClass } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

function validateSubjects(subjects) {
  return (
    Array.isArray(subjects) &&
    subjects.length > 0 &&
    subjects.every((subject) => subject && typeof subject.name === 'string' && subject.name.trim() && Number(subject.fullMarks) > 0)
  )
}

router.get('/', async (req, res) => {
  try {
    res.json(await getClasses())
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  const { className, subjects } = req.body

  if (!className || !String(className).trim()) {
    res.status(400).json({ error: 'className is required' })
    return
  }

  if (!validateSubjects(subjects)) {
    res.status(400).json({ error: 'subjects must be a non-empty array of { name, fullMarks }' })
    return
  }

  try {
    const existing = await getClasses()
    if (existing.some((item) => item.className === className)) {
      res.status(409).json({ error: `Class "${className}" already exists` })
      return
    }

    const record = { className, subjects, createdAt: new Date().toISOString() }
    const created = await addClass(record)
    await recordActivity({ admin: req.admin, action: 'class.create', targetType: 'class', details: className })
    res.status(201).json(created)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:className', requireAuth, requireSuperAdmin, async (req, res) => {
  const { subjects } = req.body

  if (!validateSubjects(subjects)) {
    res.status(400).json({ error: 'subjects must be a non-empty array of { name, fullMarks }' })
    return
  }

  try {
    const updated = await updateClass(req.params.className, subjects)
    if (!updated) {
      res.status(404).json({ error: 'Class not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'class.update',
      targetType: 'class',
      details: req.params.className,
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:className', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteClass(req.params.className)
    if (!deleted) {
      res.status(404).json({ error: 'Class not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'class.delete',
      targetType: 'class',
      details: req.params.className,
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
