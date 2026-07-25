import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth } from '../middleware/auth.js'
import { addPayment, deletePayment, getPayments, updatePayment } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const payments = await getPayments(req.query.studentId)
    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { studentId, title, amount, date } = req.body

    if (!studentId || !title || amount === undefined || amount === null || amount === '') {
      res.status(400).json({ error: 'studentId, title, and amount are required' })
      return
    }

    if (Number.isNaN(Number(amount))) {
      res.status(400).json({ error: 'amount must be a number' })
      return
    }

    const record = {
      id: crypto.randomUUID(),
      studentId,
      title,
      amount: Number(amount),
      date: date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString(),
    }

    await addPayment(record)
    await recordActivity({
      admin: req.admin,
      action: 'payment.create',
      targetType: 'payment',
      details: `${title} (${amount}) for student ${studentId}`,
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, amount, date } = req.body

    if (!title || amount === undefined || amount === null || amount === '') {
      res.status(400).json({ error: 'title and amount are required' })
      return
    }

    if (Number.isNaN(Number(amount))) {
      res.status(400).json({ error: 'amount must be a number' })
      return
    }

    const updated = await updatePayment(req.params.id, { title, amount: Number(amount), date })
    if (!updated) {
      res.status(404).json({ error: 'Payment not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'payment.update',
      targetType: 'payment',
      details: `${title} (${amount})`,
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deletePayment(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Payment not found' })
      return
    }

    await recordActivity({
      admin: req.admin,
      action: 'payment.delete',
      targetType: 'payment',
      details: deleted.title,
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
