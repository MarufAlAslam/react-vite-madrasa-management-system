import { Router } from 'express'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js'
import { getLogs } from '../services/googleSheets.js'

const router = Router()

router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const logs = await getLogs()
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
