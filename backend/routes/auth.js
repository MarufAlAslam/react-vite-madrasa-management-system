import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuthOrTeacher } from '../middleware/auth.js'
import { getAdminByEmail, updateAdminPassword } from '../services/googleSheets.js'
import { recordActivity } from '../services/activity.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' })
      return
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: 'JWT_SECRET is not configured on the server' })
      return
    }

    const admin = await getAdminByEmail(email)
    if (!admin) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const matches = await bcrypt.compare(password, admin.passwordHash)
    if (!matches) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const role = ['super', 'teacher'].includes(admin.role) ? admin.role : 'staff'
    const teacherId = role === 'teacher' ? admin.teacherId : undefined
    const token = jwt.sign({ email: admin.email, name: admin.name, role, teacherId }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    })

    await recordActivity({ admin: { email: admin.email, name: admin.name }, action: 'login', targetType: 'admin' })

    res.json({ token, email: admin.email, name: admin.name, role, teacherId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Any logged-in account (admin, staff or teacher) can change its own password.
router.put('/password', requireAuthOrTeacher, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'currentPassword and newPassword are required' })
      return
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' })
      return
    }

    if (newPassword === currentPassword) {
      res.status(400).json({ error: 'New password must be different from the current password' })
      return
    }

    const account = await getAdminByEmail(req.admin.email)
    if (!account) {
      res.status(404).json({ error: 'Account not found' })
      return
    }

    // A wrong current password is a 400, not a 401, so the frontend doesn't treat it as an expired session.
    if (!(await bcrypt.compare(currentPassword, account.passwordHash))) {
      res.status(400).json({ error: 'Current password is incorrect' })
      return
    }

    await updateAdminPassword(account.email, await bcrypt.hash(newPassword, 10))
    await recordActivity({ admin: req.admin, action: 'password.change', targetType: 'admin' })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
