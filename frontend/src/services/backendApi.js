const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  return data
}

export async function getTeachers() {
  return request('/api/teachers')
}

export async function createTeacher(formData) {
  return request('/api/teachers', { method: 'POST', body: formData })
}

export async function getStudents() {
  return request('/api/students')
}

export async function createStudent(formData) {
  return request('/api/students', { method: 'POST', body: formData })
}
