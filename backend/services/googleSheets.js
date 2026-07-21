import { google } from 'googleapis'

const TEACHERS_SHEET = 'Teachers'
const STUDENTS_SHEET = 'Students'

const TEACHER_COLUMNS = ['id', 'name', 'designation', 'subject', 'indexNo', 'phone', 'photoUrl', 'createdAt']
const STUDENT_COLUMNS = ['id', 'className', 'name', 'parentsNames', 'dob', 'contact', 'photoUrl', 'createdAt']

let sheetsClient = null

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID,
  )
}

function getSheetsClient() {
  if (!isConfigured()) {
    throw new Error(
      'Google Sheets is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID in backend/.env',
    )
  }

  if (sheetsClient) return sheetsClient

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  sheetsClient = google.sheets({ version: 'v4', auth })
  return sheetsClient
}

function rowToRecord(row, columns) {
  const record = {}
  columns.forEach((column, index) => {
    record[column] = row[index] ?? ''
  })
  return record
}

async function appendRow(sheetName, columns, record) {
  const sheets = getSheetsClient()
  const values = columns.map((column) => record[column] ?? '')

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:${String.fromCharCode(64 + columns.length)}`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  })
}

async function getRows(sheetName, columns) {
  const sheets = getSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A2:${String.fromCharCode(64 + columns.length)}`,
  })

  const rows = response.data.values || []
  return rows.map((row) => rowToRecord(row, columns))
}

export async function getTeachers() {
  return getRows(TEACHERS_SHEET, TEACHER_COLUMNS)
}

export async function addTeacher(record) {
  await appendRow(TEACHERS_SHEET, TEACHER_COLUMNS, record)
  return record
}

export async function getStudents() {
  return getRows(STUDENTS_SHEET, STUDENT_COLUMNS)
}

export async function addStudent(record) {
  await appendRow(STUDENTS_SHEET, STUDENT_COLUMNS, record)
  return record
}

export { isConfigured }
