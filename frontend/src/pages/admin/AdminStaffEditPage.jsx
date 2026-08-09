import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'

function AdminStaffEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { staff, editStaff } = useData()

  const member = staff.find((item) => item.id === id)

  const [form, setForm] = useState(
    member ? { name: member.name, designation: member.designation, phone: member.phone } : null,
  )
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef = useRef(null)

  if (!member) {
    return <Navigate to="/admin/dashboard/staff/list" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => formData.append(key, value))
      if (photo) {
        formData.append('photo', photo)
      }

      await editStaff(id, formData)
      navigate('/admin/dashboard/staff/list')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Edit Staff</p>
      <h2>{member.name}</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <img className="edit-preview-photo" src={photo ? URL.createObjectURL(photo) : member.photoUrl} alt={member.name} />

        <input
          type="text"
          placeholder="Staff name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Designation"
          value={form.designation}
          onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Contact number"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Replace photo (optional)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={photoInputRef}
            onChange={(event) => setPhoto(event.target.files[0] || null)}
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="card-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="danger-btn" onClick={() => navigate('/admin/dashboard/staff/list')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminStaffEditPage
