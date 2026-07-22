const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://madrasa-backend.vercel.app'

async function request(path, options = {}, token) {
  const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
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

export async function getTeachers() {
  return request('/api/teachers')
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

export async function createGalleryItem(formData, token) {
  return request('/api/gallery', { method: 'POST', body: formData }, token)
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
