import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getAdminByEmail } from '../services/googleSheets.js'
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

    const role = admin.role === 'super' ? 'super' : 'staff'
    const token = jwt.sign({ email: admin.email, name: admin.name, role }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    })

    await recordActivity({ admin: { email: admin.email, name: admin.name }, action: 'login', targetType: 'admin' })

    res.json({ token, email: admin.email, name: admin.name, role })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
