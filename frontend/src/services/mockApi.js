import noticesSeed from '../data/notices.json'
import teachersSeed from '../data/teachers.json'
import gallerySeed from '../data/gallery.json'
import resultsSeed from '../data/results.json'
import incomeExpensesSeed from '../data/incomeExpenses.json'
import adminSeed from '../data/admin.json'

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (data) => JSON.parse(JSON.stringify(data))

let noticesStore = clone(noticesSeed)
let teachersStore = clone(teachersSeed)
let galleryStore = clone(gallerySeed)
let resultsStore = clone(resultsSeed)
let incomeExpensesStore = clone(incomeExpensesSeed)

export async function getNotices() {
  await wait()
  return clone(noticesStore)
}

export async function createNotice(payload) {
  await wait(300)
  const newNotice = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    ...payload,
  }
  noticesStore = [newNotice, ...noticesStore]
  return clone(newNotice)
}

export async function getTeachers() {
  await wait()
  return clone(teachersStore)
}

export async function getGallery() {
  await wait()
  return clone(galleryStore)
}

export async function getResults() {
  await wait()
  return clone(resultsStore)
}

export async function getResultByRollClass(roll, className) {
  await wait(350)
  const item = resultsStore.find((result) => result.roll === roll && result.className === className)
  return item ? clone(item) : null
}

export async function createTeacher(payload) {
  await wait(320)
  const teacher = { id: Date.now(), ...payload }
  teachersStore = [teacher, ...teachersStore]
  return clone(teacher)
}

export async function createGalleryItem(payload) {
  await wait(320)
  const item = { id: Date.now(), ...payload }
  galleryStore = [item, ...galleryStore]
  return clone(item)
}

export async function updateGalleryItem(id, payload) {
  await wait(300)
  galleryStore = galleryStore.map((item) => (item.id === id ? { ...item, ...payload } : item))
  const updated = galleryStore.find((item) => item.id === id)
  return updated ? clone(updated) : null
}

export async function deleteGalleryItem(id) {
  await wait(260)
  galleryStore = galleryStore.filter((item) => item.id !== id)
  return true
}

export async function createResultRecord(payload) {
  await wait(320)
  const result = { id: Date.now(), ...payload }
  resultsStore = [result, ...resultsStore]
  return clone(result)
}

export async function updateResultRecord(id, payload) {
  await wait(300)
  resultsStore = resultsStore.map((result) => (result.id === id ? { ...result, ...payload } : result))
  const updated = resultsStore.find((result) => result.id === id)
  return updated ? clone(updated) : null
}

export async function getIncomeExpenses() {
  await wait()
  return clone(incomeExpensesStore)
}

export async function createIncomeExpense(payload) {
  await wait(320)
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    ...payload,
  }
  incomeExpensesStore = [entry, ...incomeExpensesStore]
  return clone(entry)
}

export async function loginAdmin(email, password) {
  await wait(450)
  if (email === adminSeed.email && password === adminSeed.password) {
    return { name: adminSeed.name, email: adminSeed.email }
  }

  throw new Error('Invalid email or password')
}
