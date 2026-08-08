import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addExam, deleteExam, getClasses, getExams } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    res.json(await getExams(req.query.className))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, className, duration, venue, schedule } = req.body

  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const classNames = (await getClasses()).map((item) => item.className)
  if (!className || !classNames.includes(className)) {
    res.status(400).json({ error: `className must be one of: ${classNames.join(', ') || 'no classes configured yet'}` })
    return
  }

  try {
    const record = {
      id: crypto.randomUUID(),
      name: name.trim(),
      className,
      duration: duration || '',
      venue: venue || '',
      schedule: schedule || {},
      createdAt: new Date().toISOString(),
    }

    const created = await addExam(record)
    await recordActivity({
      admin: req.admin,
      action: 'exam.create',
      targetType: 'exam',
      details: `${record.name} (${className})`,
    })
    res.status(201).json(created)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const deleted = await deleteExam(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Exam not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'exam.delete',
      targetType: 'exam',
      details: `${deleted.name} (${deleted.className})`,
    })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
