import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createTeacherLogin, getAdmins } from '../../services/backendApi'

// Super-admin form that gives a teacher a login which is limited to entering results.
function TeacherLoginForm({ teacher }) {
  const { token } = useAuth()

  const [existingEmail, setExistingEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAdmins(token)
      .then((admins) => setExistingEmail(admins.find((admin) => admin.teacherId === teacher.id)?.email ?? null))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [token, teacher.id])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const created = await createTeacherLogin({ teacherId: teacher.id, ...form }, token)
      setExistingEmail(created.email)
      setForm({ email: '', password: '' })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h3>Teacher Login</h3>
      {loading && <p>Checking login...</p>}
      {!loading && existingEmail && <p>This teacher can log in with <strong>{existingEmail}</strong>.</p>}
      {!loading && !existingEmail && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Login email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            minLength={8}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Teacher Login'}
          </button>
        </form>
      )}
      {existingEmail && error && <p className="error-text">{error}</p>}
    </>
  )
}

export default TeacherLoginForm
