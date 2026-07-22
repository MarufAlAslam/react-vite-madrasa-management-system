import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { DESIGNATIONS } from '../../constants/admin'

function AdminTeacherEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { teachers, editTeacher } = useData()

  const teacher = teachers.find((item) => item.id === id)

  const [form, setForm] = useState(
    teacher
      ? {
          name: teacher.name,
          designation: teacher.designation,
          subject: teacher.subject,
          indexNo: teacher.indexNo,
          phone: teacher.phone,
        }
      : null,
  )
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef = useRef(null)

  if (!teacher) {
    return <Navigate to="/admin/dashboard/teachers" replace />
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

      await editTeacher(id, formData)
      navigate('/admin/dashboard/teachers')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Edit Teacher</p>
      <h2>{teacher.name}</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <img className="edit-preview-photo" src={photo ? URL.createObjectURL(photo) : teacher.photoUrl} alt={teacher.name} />

        <input
          type="text"
          placeholder="Teacher name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <select
          value={form.designation}
          onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))}
          required
        >
          {DESIGNATIONS.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Subject"
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Index No."
          value={form.indexNo}
          onChange={(event) => setForm((prev) => ({ ...prev, indexNo: event.target.value }))}
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
          <button type="button" className="danger-btn" onClick={() => navigate('/admin/dashboard/teachers')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminTeacherEditPage
