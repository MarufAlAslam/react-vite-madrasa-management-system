import { google } from 'googleapis'

const TEACHERS_SHEET = 'Teachers'
const STUDENTS_SHEET = 'Students'
const ADMINS_SHEET = 'Admins'
const ACTIVITY_LOG_SHEET = 'ActivityLog'
const GALLERY_SHEET = 'Gallery'
const FINANCE_SHEET = 'IncomeExpenses'

const TEACHER_COLUMNS = ['id', 'name', 'designation', 'subject', 'indexNo', 'phone', 'photoUrl', 'createdAt']
const STUDENT_COLUMNS = ['id', 'className', 'name', 'parentsNames', 'dob', 'contact', 'photoUrl', 'createdAt']
const ADMIN_COLUMNS = ['email', 'passwordHash', 'name', 'role', 'createdAt']
const LOG_COLUMNS = ['id', 'timestamp', 'adminEmail', 'adminName', 'action', 'targetType', 'details']
const GALLERY_COLUMNS = ['id', 'title', 'photoUrl', 'createdAt']
const FINANCE_COLUMNS = ['id', 'type', 'title', 'amount', 'date']

let sheetsClient = null
const sheetIdCache = new Map()

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

function columnLetter(count) {
  return String.fromCharCode(64 + count)
}

function rowToRecord(row, columns) {
  const record = {}
  columns.forEach((column, index) => {
    record[column] = row[index] ?? ''
  })
  return record
}

async function getSheetIdByTitle(sheetName) {
  if (sheetIdCache.has(sheetName)) return sheetIdCache.get(sheetName)

  const sheets = getSheetsClient()
  const response = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    fields: 'sheets.properties',
  })

  const sheet = response.data.sheets.find((item) => item.properties.title === sheetName)
  if (!sheet) {
    throw new Error(`No "${sheetName}" tab found in the spreadsheet`)
  }

  sheetIdCache.set(sheetName, sheet.properties.sheetId)
  return sheet.properties.sheetId
}

async function appendRow(sheetName, columns, record) {
  const sheets = getSheetsClient()
  const values = columns.map((column) => record[column] ?? '')

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:${columnLetter(columns.length)}`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  })
}

async function getRows(sheetName, columns) {
  const sheets = getSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A2:${columnLetter(columns.length)}`,
  })

  const rows = response.data.values || []
  return rows.map((row) => rowToRecord(row, columns))
}

async function findRowByColumn(sheetName, columns, matchColumn, matchValue) {
  const sheets = getSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A2:${columnLetter(columns.length)}`,
  })

  const rows = response.data.values || []
  const matchIndex = columns.indexOf(matchColumn)
  const dataIndex = rows.findIndex((row) => row[matchIndex] === matchValue)

  if (dataIndex === -1) return null

  return {
    rowNumber: dataIndex + 2, // +1 for 0-based -> 1-based, +1 for the header row
    record: rowToRecord(rows[dataIndex], columns),
  }
}

async function updateRow(sheetName, columns, rowNumber, record) {
  const sheets = getSheetsClient()
  const values = columns.map((column) => record[column] ?? '')

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A${rowNumber}:${columnLetter(columns.length)}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

async function deleteRow(sheetName, rowNumber) {
  const sheets = getSheetsClient()
  const sheetId = await getSheetIdByTitle(sheetName)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  })
}

export async function getTeachers() {
  return getRows(TEACHERS_SHEET, TEACHER_COLUMNS)
}

export async function getTeacherById(id) {
  const found = await findRowByColumn(TEACHERS_SHEET, TEACHER_COLUMNS, 'id', id)
  return found?.record ?? null
}

export async function addTeacher(record) {
  await appendRow(TEACHERS_SHEET, TEACHER_COLUMNS, record)
  return record
}

export async function updateTeacher(id, patch) {
  const found = await findRowByColumn(TEACHERS_SHEET, TEACHER_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  await updateRow(TEACHERS_SHEET, TEACHER_COLUMNS, found.rowNumber, updated)
  return updated
}

export async function deleteTeacher(id) {
  const found = await findRowByColumn(TEACHERS_SHEET, TEACHER_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(TEACHERS_SHEET, found.rowNumber)
  return found.record
}

export async function getStudents() {
  return getRows(STUDENTS_SHEET, STUDENT_COLUMNS)
}

export async function getStudentById(id) {
  const found = await findRowByColumn(STUDENTS_SHEET, STUDENT_COLUMNS, 'id', id)
  return found?.record ?? null
}

export async function addStudent(record) {
  await appendRow(STUDENTS_SHEET, STUDENT_COLUMNS, record)
  return record
}

export async function updateStudent(id, patch) {
  const found = await findRowByColumn(STUDENTS_SHEET, STUDENT_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  await updateRow(STUDENTS_SHEET, STUDENT_COLUMNS, found.rowNumber, updated)
  return updated
}

export async function deleteStudent(id) {
  const found = await findRowByColumn(STUDENTS_SHEET, STUDENT_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(STUDENTS_SHEET, found.rowNumber)
  return found.record
}

export async function getAdminByEmail(email) {
  const found = await findRowByColumn(ADMINS_SHEET, ADMIN_COLUMNS, 'email', email)
  return found?.record ?? null
}

export async function getAdmins() {
  return getRows(ADMINS_SHEET, ADMIN_COLUMNS)
}

export async function addAdmin(record) {
  await appendRow(ADMINS_SHEET, ADMIN_COLUMNS, record)
  return record
}

export async function logActivity(record) {
  await appendRow(ACTIVITY_LOG_SHEET, LOG_COLUMNS, record)
  return record
}

export async function getLogs() {
  const rows = await getRows(ACTIVITY_LOG_SHEET, LOG_COLUMNS)
  return rows.reverse()
}

export async function getGallery() {
  const rows = await getRows(GALLERY_SHEET, GALLERY_COLUMNS)
  return rows.reverse()
}

export async function getGalleryItemById(id) {
  const found = await findRowByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'id', id)
  return found?.record ?? null
}

export async function addGalleryItem(record) {
  await appendRow(GALLERY_SHEET, GALLERY_COLUMNS, record)
  return record
}

export async function updateGalleryItem(id, patch) {
  const found = await findRowByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  await updateRow(GALLERY_SHEET, GALLERY_COLUMNS, found.rowNumber, updated)
  return updated
}

export async function deleteGalleryItem(id) {
  const found = await findRowByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(GALLERY_SHEET, found.rowNumber)
  return found.record
}

export async function getIncomeExpenses() {
  const rows = await getRows(FINANCE_SHEET, FINANCE_COLUMNS)
  return rows.reverse()
}

export async function addIncomeExpense(record) {
  await appendRow(FINANCE_SHEET, FINANCE_COLUMNS, record)
  return record
}

export { isConfigured }
