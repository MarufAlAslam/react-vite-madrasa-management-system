import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { addAdmin, getAdminByEmail, getAdmins } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await getAdmins()
    res.json(admins.map(({ passwordHash, ...safe }) => safe))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ error: 'email, password, and name are required' })
      return
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'password must be at least 8 characters' })
      return
    }

    const existing = await getAdminByEmail(email)
    if (existing) {
      res.status(409).json({ error: 'An admin with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const record = {
      email,
      passwordHash,
      name,
      role: 'staff',
      createdAt: new Date().toISOString(),
    }

    await addAdmin(record)
    await recordActivity({
      admin: req.admin,
      action: 'admin.create',
      targetType: 'admin',
      details: `${name} <${email}>`,
    })

    const { passwordHash: _omit, ...safe } = record
    res.status(201).json(safe)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
