import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createAdmin, getAdmins } from '../../services/backendApi'

const emptyAdminForm = { name: '', email: '', password: '' }

function AdminAdminsPage() {
  const { token } = useAuth()

  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [adminForm, setAdminForm] = useState(emptyAdminForm)
  const [adminFormError, setAdminFormError] = useState(null)
  const [adminSubmitting, setAdminSubmitting] = useState(false)

  useEffect(() => {
    getAdmins(token)
      .then(setAdmins)
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAdminSubmit(event) {
    event.preventDefault()

    if (adminForm.password.length < 8) {
      setAdminFormError('Password must be at least 8 characters.')
      return
    }

    setAdminSubmitting(true)
    setAdminFormError(null)

    try {
      const created = await createAdmin(adminForm, token)
      setAdmins((prev) => [...prev, created])
      setAdminForm(emptyAdminForm)
    } catch (error) {
      setAdminFormError(error.message)
    } finally {
      setAdminSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Create Admin</p>
      <h2>Add-Only Admin Accounts</h2>
      <p className="helper-text">
        New admins created here can only add teachers and students. They cannot edit, delete, view the activity
        log, export data, or create other admins.
      </p>

      <form className="admin-form" onSubmit={handleAdminSubmit}>
        <input
          type="text"
          placeholder="Full name"
          value={adminForm.name}
          onChange={(event) => setAdminForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={adminForm.email}
          onChange={(event) => setAdminForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Password (min. 8 characters)"
          value={adminForm.password}
          onChange={(event) => setAdminForm((prev) => ({ ...prev, password: event.target.value }))}
          minLength={8}
          required
        />
        {adminFormError && <p className="error-text">{adminFormError}</p>}
        <button type="submit" disabled={adminSubmitting}>
          {adminSubmitting ? 'Creating...' : 'Create Admin'}
        </button>
      </form>

      {loadError && <p className="error-text">Could not load admins: {loadError}</p>}
      {loading && <div className="empty-state">Loading admins...</div>}

      <div className="notice-vertical-list admin-list-gap">
        {admins.map((admin) => (
          <article key={admin.email} className="notice-row-card">
            <div>
              <p className="notice-date">{admin.role === 'super' ? 'Super Admin' : 'Staff Admin'}</p>
              <h3>{admin.name}</h3>
              <p>{admin.email}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AdminAdminsPage
