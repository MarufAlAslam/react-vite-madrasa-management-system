import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { isConfigured } from './services/googleSheets.js'
import adminsRouter from './routes/admins.js'
import authRouter from './routes/auth.js'
import classesRouter from './routes/classes.js'
import examsRouter from './routes/exams.js'
import galleryRouter from './routes/gallery.js'
import incomeExpensesRouter from './routes/incomeExpenses.js'
import logsRouter from './routes/logs.js'
import paymentsRouter from './routes/payments.js'
import resultsRouter from './routes/results.js'
import settingsRouter from './routes/settings.js'
import staffRouter from './routes/staff.js'
import studentsRouter from './routes/students.js'
import teachersRouter from './routes/teachers.js'

const PORT = process.env.PORT || 4000
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()

const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || FRONTEND_ORIGINS.includes('*') || FRONTEND_ORIGINS.includes(origin) || isLocalhost(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, googleSheetsConfigured: isConfigured() })
})

app.use('/api/auth', authRouter)
app.use('/api/classes', classesRouter)
app.use('/api/exams', examsRouter)
app.use('/api/teachers', teachersRouter)
app.use('/api/students', studentsRouter)
app.use('/api/admins', adminsRouter)
app.use('/api/logs', logsRouter)
app.use('/api/gallery', galleryRouter)
app.use('/api/income-expenses', incomeExpensesRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/results', resultsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/staff', staffRouter)

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
