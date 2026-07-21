import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { isConfigured } from './services/googleSheets.js'
import studentsRouter from './routes/students.js'
import teachersRouter from './routes/teachers.js'

const PORT = process.env.PORT || 4000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'

const app = express()

app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, googleSheetsConfigured: isConfigured() })
})

app.use('/api/teachers', teachersRouter)
app.use('/api/students', studentsRouter)

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }
  res.status(400).json({ error: error.message || 'Unexpected error' })
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`)
    if (!isConfigured()) {
      console.warn('Google Sheets is not configured yet — set env vars in backend/.env (see .env.example)')
    }
  })
}

export default app
