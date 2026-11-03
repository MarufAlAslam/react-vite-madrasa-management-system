const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://madrasa-backend-eight.vercel.app'

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function request(path, options = {}, token) {
  const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token) {
      unauthorizedHandler?.()
    }
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  return data
}

export async function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function getClasses() {
  return request('/api/classes')
}

export async function createClass(payload, token) {
  return request(
    '/api/classes',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function updateClass(className, subjects, token) {
  return request(
    `/api/classes/${encodeURIComponent(className)}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subjects }) },
    token,
  )
}

export async function deleteClass(className, token) {
  return request(`/api/classes/${encodeURIComponent(className)}`, { method: 'DELETE' }, token)
}

export async function getTeachers(token) {
  return request('/api/teachers', {}, token)
}

export async function createTeacher(formData, token) {
  return request('/api/teachers', { method: 'POST', body: formData }, token)
}

export async function updateTeacher(id, formData, token) {
  return request(`/api/teachers/${id}`, { method: 'PUT', body: formData }, token)
}

export async function deleteTeacher(id, token) {
  return request(`/api/teachers/${id}`, { method: 'DELETE' }, token)
}

export async function assignTeacherClasses(id, classNames, token) {
  return request(
    `/api/teachers/${id}/assign`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classNames }) },
    token,
  )
}

export async function getStudents() {
  return request('/api/students')
}

export async function createStudent(formData, token) {
  return request('/api/students', { method: 'POST', body: formData }, token)
}

export async function updateStudent(id, formData, token) {
  return request(`/api/students/${id}`, { method: 'PUT', body: formData }, token)
}

export async function deleteStudent(id, token) {
  return request(`/api/students/${id}`, { method: 'DELETE' }, token)
}

export async function promoteStudent(id, toClass, token) {
  return request(
    `/api/students/${id}/promote`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toClass }) },
    token,
  )
}

export async function promoteStudentsBulk(fromClass, toClass, token) {
  return request(
    '/api/students/promote',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromClass, toClass }) },
    token,
  )
}

export async function getAdmins(token) {
  return request('/api/admins', {}, token)
}

export async function createAdmin(payload, token) {
  return request(
    '/api/admins',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function getLogs(token) {
  return request('/api/logs', {}, token)
}

export async function getGallery() {
  return request('/api/gallery')
}

export async function createGalleryAlbum(formData, token) {
  return request('/api/gallery/album', { method: 'POST', body: formData }, token)
}

export async function updateGalleryAlbum(albumTitle, payload, token) {
  return request(
    `/api/gallery/album/${encodeURIComponent(albumTitle)}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function deleteGalleryAlbum(albumTitle, token) {
  return request(`/api/gallery/album/${encodeURIComponent(albumTitle)}`, { method: 'DELETE' }, token)
}

export async function updateGalleryItem(id, formData, token) {
  return request(`/api/gallery/${id}`, { method: 'PUT', body: formData }, token)
}

export async function deleteGalleryItem(id, token) {
  return request(`/api/gallery/${id}`, { method: 'DELETE' }, token)
}

export async function getIncomeExpenses(token) {
  return request('/api/income-expenses', {}, token)
}

export async function createIncomeExpense(payload, token) {
  return request(
    '/api/income-expenses',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function getPayments(studentId, token) {
  return request(`/api/payments?studentId=${encodeURIComponent(studentId)}`, {}, token)
}

export async function createPayment(payload, token) {
  return request(
    '/api/payments',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function updatePayment(id, payload, token) {
  return request(
    `/api/payments/${id}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function deletePayment(id, token) {
  return request(`/api/payments/${id}`, { method: 'DELETE' }, token)
}

export async function getResults(studentId, token) {
  return request(`/api/results?studentId=${encodeURIComponent(studentId)}`, {}, token)
}

export async function getAllResults(token) {
  return request('/api/results', {}, token)
}

export async function createResult(payload, token) {
  return request(
    '/api/results',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function updateResult(id, payload, token) {
  return request(
    `/api/results/${id}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function deleteResult(id, token) {
  return request(`/api/results/${id}`, { method: 'DELETE' }, token)
}

export async function getSettings() {
  return request('/api/settings')
}

export async function updateSettings(formData, token) {
  return request('/api/settings', { method: 'POST', body: formData }, token)
}

export async function getExams() {
  return request('/api/exams')
}

export async function createExam(payload, token) {
  return request(
    '/api/exams',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function updateExam(id, payload, token) {
  return request(
    `/api/exams/${id}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
    token,
  )
}

export async function deleteExam(id, token) {
  return request(`/api/exams/${id}`, { method: 'DELETE' }, token)
}

export async function getStaff() {
  return request('/api/staff')
}

export async function createStaff(formData, token) {
  return request('/api/staff', { method: 'POST', body: formData }, token)
}

export async function updateStaff(id, formData, token) {
  return request(`/api/staff/${id}`, { method: 'PUT', body: formData }, token)
}

export async function deleteStaff(id, token) {
  return request(`/api/staff/${id}`, { method: 'DELETE' }, token)
}
