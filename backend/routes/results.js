import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth } from '../middleware/auth.js'
import { addResult, deleteResult, getResults, updateResult } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const results = await getResults(req.query.studentId)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { studentId, examName, subject, marks, grade } = req.body

    if (!studentId || !examName || !subject || !marks || !grade) {
      res.status(400).json({ error: 'studentId, examName, subject, marks, and grade are required' })
      return
    }

    const record = {
      id: crypto.randomUUID(),
      studentId,
      examName,
      subject,
      marks,
      grade,
      createdAt: new Date().toISOString(),
    }

    await addResult(record)
    await recordActivity({
      admin: req.admin,
      action: 'result.create',
      targetType: 'result',
      details: `${examName} - ${subject} (${marks}/${grade}) for student ${studentId}`,
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { examName, subject, marks, grade } = req.body

    if (!examName || !subject || !marks || !grade) {
      res.status(400).json({ error: 'examName, subject, marks, and grade are required' })
      return
    }

    const updated = await updateResult(req.params.id, { examName, subject, marks, grade })
    if (!updated) {
      res.status(404).json({ error: 'Result not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'result.update',
      targetType: 'result',
      details: `${examName} - ${subject}`,
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteResult(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Result not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'result.delete',
      targetType: 'result',
      details: `${deleted.examName} - ${deleted.subject}`,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
