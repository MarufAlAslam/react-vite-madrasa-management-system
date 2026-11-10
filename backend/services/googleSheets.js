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
const SETTINGS_SHEET = 'Settings'
const EXAMS_SHEET = 'Exams'
const STAFF_SHEET = 'Staff'

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
  'joiningDate',
  'gender',
  'bloodGroup',
  'department', // no longer used; kept so the columns after it keep their positions in the sheet
  'qualification',
  'nid',
  'address',
  'ntraCertificateUrl',
  'appointmentLetterUrl',
  'joiningLetterUrl',
  'additionalDocumentUrl',
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
  'registrationNo',
  'section',
]
const ADMIN_COLUMNS = ['email', 'passwordHash', 'name', 'role', 'createdAt', 'teacherId']
const LOG_COLUMNS = ['id', 'timestamp', 'adminEmail', 'adminName', 'action', 'targetType', 'details']
const GALLERY_COLUMNS = ['id', 'title', 'photoUrl', 'createdAt', 'albumTitle', 'featured']
const FINANCE_COLUMNS = ['id', 'type', 'title', 'amount', 'date']
const PAYMENT_COLUMNS = ['id', 'studentId', 'title', 'amount', 'date', 'createdAt']
const RESULT_COLUMNS = ['id', 'studentId', 'examName', 'subject', 'marks', 'grade', 'createdAt', 'updatedAt']
const CLASS_COLUMNS = ['className', 'subjects', 'createdAt']
const SETTINGS_COLUMNS = ['logoUrl', 'examControllerSignUrl', 'principalSignUrl', 'updatedAt']
const EXAM_COLUMNS = ['id', 'name', 'className', 'duration', 'venue', 'schedule', 'createdAt']
const STAFF_COLUMNS = ['id', 'name', 'designation', 'phone', 'photoUrl', 'createdAt']

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

async function findRowsByColumn(sheetName, columns, matchColumn, matchValue) {
  const sheets = getSheetsClient()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A2:${columnLetter(columns.length)}`,
  })

  const rows = response.data.values || []

  return rows
    .map((row, index) => ({ rowNumber: index + 2, record: rowToRecord(row, columns) }))
    .filter((entry) => entry.record[matchColumn] === matchValue)
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
  const sectionColIndex = STUDENT_COLUMNS.indexOf('section')

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
      // Sections only exist in Class 6, so a promoted student's old section no longer applies.
      data.push({
        range: `${STUDENTS_SHEET}!${columnLetter(sectionColIndex + 1)}${rowNumber}`,
        values: [['']],
      })
    }
  })

  if (data.length === 0) return 0

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: { valueInputOption: 'RAW', data },
  })

  return data.length / 2
}

export async function getAdminByEmail(email) {
  const found = await findRowByColumn(ADMINS_SHEET, ADMIN_COLUMNS, 'email', email)
  return found?.record ?? null
}

export async function updateAdminPassword(email, passwordHash) {
  const found = await findRowByColumn(ADMINS_SHEET, ADMIN_COLUMNS, 'email', email)
  if (!found) return false

  await updateRow(ADMINS_SHEET, ADMIN_COLUMNS, found.rowNumber, { ...found.record, passwordHash })
  return true
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

function parseGalleryRow(record) {
  return { ...record, featured: record.featured === 'true' }
}

export async function getGallery() {
  const rows = await getRows(GALLERY_SHEET, GALLERY_COLUMNS)
  return rows.map(parseGalleryRow).reverse()
}

export async function getGalleryItemById(id) {
  const found = await findRowByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'id', id)
  return found ? parseGalleryRow(found.record) : null
}

export async function addGalleryItem(record) {
  const stored = { ...record, featured: record.featured ? 'true' : '' }
  await appendRow(GALLERY_SHEET, GALLERY_COLUMNS, stored)
  return parseGalleryRow(stored)
}

export async function updateGalleryItem(id, patch) {
  const found = await findRowByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  if (patch.featured !== undefined) updated.featured = patch.featured ? 'true' : ''
  await updateRow(GALLERY_SHEET, GALLERY_COLUMNS, found.rowNumber, updated)
  return parseGalleryRow(updated)
}

export async function deleteGalleryItem(id) {
  const found = await findRowByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(GALLERY_SHEET, found.rowNumber)
  return parseGalleryRow(found.record)
}

export async function updateGalleryAlbum(albumTitle, patch) {
  const matches = await findRowsByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'albumTitle', albumTitle)
  const updatedRecords = []

  for (const match of matches) {
    const updated = { ...match.record, ...patch }
    if (patch.featured !== undefined) updated.featured = patch.featured ? 'true' : ''
    await updateRow(GALLERY_SHEET, GALLERY_COLUMNS, match.rowNumber, updated)
    updatedRecords.push(parseGalleryRow(updated))
  }

  return updatedRecords
}

export async function deleteGalleryAlbum(albumTitle) {
  const matches = await findRowsByColumn(GALLERY_SHEET, GALLERY_COLUMNS, 'albumTitle', albumTitle)
  const sorted = [...matches].sort((a, b) => b.rowNumber - a.rowNumber)
  const deletedRecords = []

  for (const match of sorted) {
    await deleteRow(GALLERY_SHEET, match.rowNumber)
    deletedRecords.push(parseGalleryRow(match.record))
  }

  return deletedRecords
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

  const updated = { ...found.record, ...patch, id, updatedAt: new Date().toISOString() }
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

export async function getSettings() {
  const rows = await getRows(SETTINGS_SHEET, SETTINGS_COLUMNS)
  return rows[0] || { logoUrl: '', examControllerSignUrl: '', principalSignUrl: '', updatedAt: '' }
}

export async function updateSettings(patch) {
  const rows = await getRows(SETTINGS_SHEET, SETTINGS_COLUMNS)
  const current = rows[0] || {}
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() }

  if (rows.length === 0) {
    await appendRow(SETTINGS_SHEET, SETTINGS_COLUMNS, updated)
  } else {
    await updateRow(SETTINGS_SHEET, SETTINGS_COLUMNS, 2, updated)
  }
  return updated
}

function parseExamRow(record) {
  let schedule = {}
  try {
    schedule = JSON.parse(record.schedule || '{}')
  } catch {
    schedule = {}
  }
  return { ...record, schedule }
}

export async function getExams(className) {
  const rows = await getRows(EXAMS_SHEET, EXAM_COLUMNS)
  const parsed = rows.map(parseExamRow)
  return className ? parsed.filter((exam) => exam.className === className) : parsed
}

export async function addExam(record) {
  const stored = { ...record, schedule: JSON.stringify(record.schedule || {}) }
  await appendRow(EXAMS_SHEET, EXAM_COLUMNS, stored)
  return parseExamRow(stored)
}

export async function updateExam(id, patch) {
  const found = await findRowByColumn(EXAMS_SHEET, EXAM_COLUMNS, 'id', id)
  if (!found) return null

  const updated = {
    ...found.record,
    ...patch,
    id,
    schedule: JSON.stringify(patch.schedule ?? parseExamRow(found.record).schedule),
  }
  await updateRow(EXAMS_SHEET, EXAM_COLUMNS, found.rowNumber, updated)
  return parseExamRow(updated)
}

export async function deleteExam(id) {
  const found = await findRowByColumn(EXAMS_SHEET, EXAM_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(EXAMS_SHEET, found.rowNumber)
  return parseExamRow(found.record)
}

export async function getStaff() {
  return getRows(STAFF_SHEET, STAFF_COLUMNS)
}

export async function getStaffById(id) {
  const found = await findRowByColumn(STAFF_SHEET, STAFF_COLUMNS, 'id', id)
  return found?.record ?? null
}

export async function addStaff(record) {
  await appendRow(STAFF_SHEET, STAFF_COLUMNS, record)
  return record
}

export async function updateStaff(id, patch) {
  const found = await findRowByColumn(STAFF_SHEET, STAFF_COLUMNS, 'id', id)
  if (!found) return null

  const updated = { ...found.record, ...patch, id }
  await updateRow(STAFF_SHEET, STAFF_COLUMNS, found.rowNumber, updated)
  return updated
}

export async function deleteStaff(id) {
  const found = await findRowByColumn(STAFF_SHEET, STAFF_COLUMNS, 'id', id)
  if (!found) return null

  await deleteRow(STAFF_SHEET, found.rowNumber)
  return found.record
}

export { isConfigured }
