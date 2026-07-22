import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { CLASSES } from '../../constants/admin'

function AdminStudentEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { students, editStudent } = useData()

  const student = students.find((item) => item.id === id)

  const [form, setForm] = useState(
    student
      ? {
          className: student.className,
          name: student.name,
          parentsNames: student.parentsNames,
          dob: student.dob,
          contact: student.contact,
        }
      : null,
  )
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef = useRef(null)

  if (!student) {
    return <Navigate to="/admin/dashboard/students" replace />
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

      await editStudent(id, formData)
      navigate('/admin/dashboard/students')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Edit Student</p>
      <h2>{student.name}</h2>

      <form className="admin-form" onSubmit={handleSubmit}>
        <img className="edit-preview-photo" src={photo ? URL.createObjectURL(photo) : student.photoUrl} alt={student.name} />

        <select
          value={form.className}
          onChange={(event) => setForm((prev) => ({ ...prev, className: event.target.value }))}
          required
        >
          {CLASSES.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Student name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Parents' names"
          value={form.parentsNames}
          onChange={(event) => setForm((prev) => ({ ...prev, parentsNames: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Date of birth</span>
          <input
            type="date"
            value={form.dob}
            onChange={(event) => setForm((prev) => ({ ...prev, dob: event.target.value }))}
            required
          />
        </label>
        <input
          type="text"
          placeholder="Contact number"
          value={form.contact}
          onChange={(event) => setForm((prev) => ({ ...prev, contact: event.target.value }))}
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
          <button type="button" className="danger-btn" onClick={() => navigate('/admin/dashboard/students')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminStudentEditPage
