import { google } from 'googleapis'

const TEACHERS_SHEET = 'Teachers'
const STUDENTS_SHEET = 'Students'
const ADMINS_SHEET = 'Admins'
const ACTIVITY_LOG_SHEET = 'ActivityLog'
const GALLERY_SHEET = 'Gallery'
const FINANCE_SHEET = 'IncomeExpenses'
const PAYMENTS_SHEET = 'Payments'
const RESULTS_SHEET = 'Results'
const CLASSES_SHEET = 'Classes'

const TEACHER_COLUMNS = [
  'id',
  'name',
  'designation',
  'subject',
  'indexNo',
  'phone',
  'photoUrl',
  'createdAt',
  'assignedClasses',
]
const STUDENT_COLUMNS = [
  'id',
  'className',
  'name',
  'fatherName',
  'motherName',
  'roll',
  'dob',
  'contact',
  'photoUrl',
  'createdAt',
]
const ADMIN_COLUMNS = ['email', 'passwordHash', 'name', 'role', 'createdAt']
const LOG_COLUMNS = ['id', 'timestamp', 'adminEmail', 'adminName', 'action', 'targetType', 'details']
const GALLERY_COLUMNS = ['id', 'title', 'photoUrl', 'createdAt']
const FINANCE_COLUMNS = ['id', 'type', 'title', 'amount', 'date']
const PAYMENT_COLUMNS = ['id', 'studentId', 'title', 'amount', 'date', 'createdAt']
const RESULT_COLUMNS = ['id', 'studentId', 'examName', 'subject', 'marks', 'grade', 'createdAt']
const CLASS_COLUMNS = ['className', 'subjects', 'createdAt']

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

function parseTeacherRow(record) {
  let assignedClasses = []
  try {
    assignedClasses = JSON.parse(record.assignedClasses || '[]')
  } catch {
    assignedClasses = []
  }
  return { ...record, assignedClasses }
}

export async function getTeachers() {
  const rows = await getRows(TEACHERS_SHEET, TEACHER_COLUMNS)
  return rows.map(parseTeacherRow)
}

export async function getTeacherById(id) {
  const found = await findRowByColumn(TEACHERS_SHEET, TEACHER_COLUMNS, 'id', id)
  return found ? parseTeacherRow(found.record) : null
}

export async function addTeacher(record) {
  const stored = { ...record, assignedClasses: JSON.stringify(record.assignedClasses || []) }
  await appendRow(TEACHERS_SHEET, TEACHER_COLUMNS, stored)
  return parseTeacherRow(stored)
}

export async function updateTeacher(id, patch) {
  const found = await findRowByColumn(TEACHERS_SHEET, TEACHER_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  if (patch.assignedClasses !== undefined) {
    updated.assignedClasses = JSON.stringify(patch.assignedClasses)
  }
  await updateRow(TEACHERS_SHEET, TEACHER_COLUMNS, found.rowNumber, updated)
  return parseTeacherRow(updated)
}

export async function deleteTeacher(id) {
  const found = await findRowByColumn(TEACHERS_SHEET, TEACHER_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(TEACHERS_SHEET, found.rowNumber)
  return parseTeacherRow(found.record)
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

export async function promoteStudentsByClass(fromClass, toClass) {
  const sheets = getSheetsClient()
  const classColIndex = STUDENT_COLUMNS.indexOf('className')

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${STUDENTS_SHEET}!A2:${columnLetter(STUDENT_COLUMNS.length)}`,
  })

  const rows = response.data.values || []
  const data = []

  rows.forEach((row, index) => {
    if (row[classColIndex] === fromClass) {
      const rowNumber = index + 2
      data.push({
        range: `${STUDENTS_SHEET}!${columnLetter(classColIndex + 1)}${rowNumber}`,
        values: [[toClass]],
      })
    }
  })

  if (data.length === 0) return 0

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data },
  })

  return data.length
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

export async function getPayments(studentId) {
  const rows = await getRows(PAYMENTS_SHEET, PAYMENT_COLUMNS)
  const filtered = studentId ? rows.filter((row) => row.studentId === studentId) : rows
  return filtered.reverse()
}

export async function addPayment(record) {
  await appendRow(PAYMENTS_SHEET, PAYMENT_COLUMNS, record)
  return record
}

export async function updatePayment(id, patch) {
  const found = await findRowByColumn(PAYMENTS_SHEET, PAYMENT_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  await updateRow(PAYMENTS_SHEET, PAYMENT_COLUMNS, found.rowNumber, updated)
  return updated
}

export async function deletePayment(id) {
  const found = await findRowByColumn(PAYMENTS_SHEET, PAYMENT_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(PAYMENTS_SHEET, found.rowNumber)
  return found.record
}

export async function getResults(studentId) {
  const rows = await getRows(RESULTS_SHEET, RESULT_COLUMNS)
  const filtered = studentId ? rows.filter((row) => row.studentId === studentId) : rows
  return filtered.reverse()
}

export async function addResult(record) {
  await appendRow(RESULTS_SHEET, RESULT_COLUMNS, record)
  return record
}

export async function updateResult(id, patch) {
  const found = await findRowByColumn(RESULTS_SHEET, RESULT_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  await updateRow(RESULTS_SHEET, RESULT_COLUMNS, found.rowNumber, updated)
  return updated
}

export async function deleteResult(id) {
  const found = await findRowByColumn(RESULTS_SHEET, RESULT_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(RESULTS_SHEET, found.rowNumber)
  return found.record
}

function parseClassRow(record) {
  let subjects = []
  try {
    subjects = JSON.parse(record.subjects || '[]')
  } catch {
    subjects = []
  }
  return { ...record, subjects }
}

export async function getClasses() {
  const rows = await getRows(CLASSES_SHEET, CLASS_COLUMNS)
  return rows.map(parseClassRow)
}

export async function getClassByName(className) {
  const found = await findRowByColumn(CLASSES_SHEET, CLASS_COLUMNS, 'className', className)
  return found ? parseClassRow(found.record) : null
}

export async function addClass(record) {
  const stored = { ...record, subjects: JSON.stringify(record.subjects) }
  await appendRow(CLASSES_SHEET, CLASS_COLUMNS, stored)
  return parseClassRow(stored)
}

export async function updateClass(className, subjects) {
  const found = await findRowByColumn(CLASSES_SHEET, CLASS_COLUMNS, 'className', className)
  if (!found) return null

  const updated = { ...found.record, subjects: JSON.stringify(subjects) }
  await updateRow(CLASSES_SHEET, CLASS_COLUMNS, found.rowNumber, updated)
  return parseClassRow(updated)
}

export async function deleteClass(className) {
  const found = await findRowByColumn(CLASSES_SHEET, CLASS_COLUMNS, 'className', className)
  if (!found) return null

  await deleteRow(CLASSES_SHEET, found.rowNumber)
  return parseClassRow(found.record)
}

export { isConfigured }
