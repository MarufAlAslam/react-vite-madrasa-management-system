import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { DESIGNATIONS } from '../../constants/admin'

const emptyTeacherForm = { name: '', designation: '', subject: '', indexNo: '', phone: '' }

function AdminTeachersPage() {
  const { teachers, backendError, addTeacher, removeTeacher } = useData()
  const { isSuperAdmin } = useAuth()

  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm)
  const [teacherPhoto, setTeacherPhoto] = useState(null)
  const [teacherFormError, setTeacherFormError] = useState(null)
  const [teacherSubmitting, setTeacherSubmitting] = useState(false)
  const teacherPhotoInputRef = useRef(null)

  const [rowBusy, setRowBusy] = useState({})
  const [rowError, setRowError] = useState({})

  async function handleTeacherSubmit(event) {
    event.preventDefault()

    if (!teacherPhoto) {
      setTeacherFormError('Please choose a photo to upload.')
      return
    }

    setTeacherSubmitting(true)
    setTeacherFormError(null)

    try {
      const formData = new FormData()
      Object.entries(teacherForm).forEach(([key, value]) => formData.append(key, value))
      formData.append('photo', teacherPhoto)

      await addTeacher(formData)
      setTeacherForm(emptyTeacherForm)
      setTeacherPhoto(null)
      if (teacherPhotoInputRef.current) teacherPhotoInputRef.current.value = ''
    } catch (error) {
      setTeacherFormError(error.message)
    } finally {
      setTeacherSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this teacher? This cannot be undone.')) return

    setRowBusy((prev) => ({ ...prev, [id]: true }))
    setRowError((prev) => ({ ...prev, [id]: null }))

    try {
      await removeTeacher(id)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [id]: error.message }))
      setRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Add Teacher</p>
      <h2>Faculty Management</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleTeacherSubmit}>
        <input
          type="text"
          placeholder="Teacher name"
          value={teacherForm.name}
          onChange={(event) => setTeacherForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <select
          value={teacherForm.designation}
          onChange={(event) => setTeacherForm((prev) => ({ ...prev, designation: event.target.value }))}
          required
        >
          <option value="">Select designation</option>
          {DESIGNATIONS.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Subject"
          value={teacherForm.subject}
          onChange={(event) => setTeacherForm((prev) => ({ ...prev, subject: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Index No."
          value={teacherForm.indexNo}
          onChange={(event) => setTeacherForm((prev) => ({ ...prev, indexNo: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Contact number"
          value={teacherForm.phone}
          onChange={(event) => setTeacherForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={teacherPhotoInputRef}
            onChange={(event) => setTeacherPhoto(event.target.files[0] || null)}
            required
          />
        </label>
        {teacherFormError && <p className="error-text">{teacherFormError}</p>}
        <button type="submit" disabled={teacherSubmitting}>
          {teacherSubmitting ? 'Adding...' : 'Add Teacher'}
        </button>
      </form>

      <div className="teachers-grid admin-list-gap">
        {teachers.map((teacher) => (
          <article key={teacher.id} className="teacher-card">
            <img src={teacher.photoUrl} alt={teacher.name} />
            <h3>{teacher.name}</h3>
            <p className="subject-pill">{teacher.designation}</p>
            <p>{teacher.subject}</p>
            <p>{teacher.phone}</p>

            {isSuperAdmin && (
              <>
                <div className="card-actions">
                  <Link className="cta-btn" to={`/admin/dashboard/teachers/${teacher.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="cta-btn danger-btn"
                    disabled={rowBusy[teacher.id]}
                    onClick={() => handleDelete(teacher.id)}
                  >
                    {rowBusy[teacher.id] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                {rowError[teacher.id] && <p className="error-text">{rowError[teacher.id]}</p>}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default AdminTeachersPage
