import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../services/backendApi'

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

function ChangePasswordPage() {
  const { token } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  function bind(key) {
    return { value: form[key], onChange: (event) => setForm((prev) => ({ ...prev, [key]: event.target.value })) }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (form.newPassword !== form.confirmPassword) {
      setError('The new password and its confirmation do not match.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(form.currentPassword, form.newPassword, token)
      setForm(emptyForm)
      setMessage('Your password has been changed.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">My Account</p>
      <h2>Change Password</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <input type="password" placeholder="Current password" autoComplete="current-password" {...bind('currentPassword')} required />
        <input
          type="password"
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          minLength={8}
          {...bind('newPassword')}
          required
        />
        <input type="password" placeholder="Confirm new password" autoComplete="new-password" {...bind('confirmPassword')} required />

        {error && <p className="error-text">{error}</p>}
        {message && <p className="helper-text">{message}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </section>
  )
}

export default ChangePasswordPage
