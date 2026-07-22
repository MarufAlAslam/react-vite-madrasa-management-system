import { Router } from 'express'
import crypto from 'node:crypto'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addIncomeExpense, getIncomeExpenses } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const entries = await getIncomeExpenses()
    res.json(entries)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { type, title, amount } = req.body

    if (!type || !title || amount === undefined || amount === null || amount === '') {
      res.status(400).json({ error: 'type, title, and amount are required' })
      return
    }

    if (!['income', 'expense'].includes(type)) {
      res.status(400).json({ error: 'type must be "income" or "expense"' })
      return
    }

    if (Number.isNaN(Number(amount))) {
      res.status(400).json({ error: 'amount must be a number' })
      return
    }

    const record = {
      id: crypto.randomUUID(),
      type,
      title,
      amount: Number(amount),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    }

    await addIncomeExpense(record)
    await recordActivity({
      admin: req.admin,
      action: 'finance.create',
      targetType: 'finance',
      details: `${type}: ${title} (${amount})`,
    })

    res.status(201).json(record)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
