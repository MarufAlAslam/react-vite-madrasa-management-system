import 'dotenv/config'
import { getStudents, getTeachers, isConfigured } from '../services/googleSheets.js'

if (!isConfigured()) {
  console.error('Missing env vars. Check GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID in backend/.env')
  process.exit(1)
}

try {
  const [teachers, students] = await Promise.all([getTeachers(), getStudents()])
  console.log(`Connected. Teachers sheet has ${teachers.length} row(s), Students sheet has ${students.length} row(s).`)
} catch (error) {
  console.error('Could not read the spreadsheet:', error.message)
  process.exit(1)
}
