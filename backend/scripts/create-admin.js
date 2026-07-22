import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { google } from 'googleapis'

const [, , email, password, name] = process.argv

if (!email || !password || !name) {
  console.error('Usage: node scripts/create-admin.js <email> <password> <name>')
  process.exit(1)
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const sheets = google.sheets({ version: 'v4', auth })

const passwordHash = await bcrypt.hash(password, 10)

await sheets.spreadsheets.values.append({
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  range: 'Admins!A:C',
  valueInputOption: 'RAW',
  insertDataOption: 'INSERT_ROWS',
  requestBody: { values: [[email, passwordHash, name]] },
})

console.log(`Admin "${email}" added to the Admins sheet.`)
