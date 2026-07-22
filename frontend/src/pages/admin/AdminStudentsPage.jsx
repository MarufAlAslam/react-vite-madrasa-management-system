import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { CLASSES } from '../../constants/admin'

const emptyStudentForm = { className: '', name: '', parentsNames: '', dob: '', contact: '' }

function AdminStudentsPage() {
  const { students, backendError, addStudent, removeStudent } = useData()
  const { isSuperAdmin } = useAuth()

  const [studentForm, setStudentForm] = useState(emptyStudentForm)
  const [studentPhoto, setStudentPhoto] = useState(null)
  const [studentFormError, setStudentFormError] = useState(null)
  const [studentSubmitting, setStudentSubmitting] = useState(false)
  const studentPhotoInputRef = useRef(null)

  const [rowBusy, setRowBusy] = useState({})
  const [rowError, setRowError] = useState({})

  async function handleStudentSubmit(event) {
    event.preventDefault()

    if (!studentPhoto) {
      setStudentFormError('Please choose a photo to upload.')
      return
    }

    setStudentSubmitting(true)
    setStudentFormError(null)

    try {
      const formData = new FormData()
      Object.entries(studentForm).forEach(([key, value]) => formData.append(key, value))
      formData.append('photo', studentPhoto)

      await addStudent(formData)
      setStudentForm(emptyStudentForm)
      setStudentPhoto(null)
      if (studentPhotoInputRef.current) studentPhotoInputRef.current.value = ''
    } catch (error) {
      setStudentFormError(error.message)
    } finally {
      setStudentSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this student? This cannot be undone.')) return

    setRowBusy((prev) => ({ ...prev, [id]: true }))
    setRowError((prev) => ({ ...prev, [id]: null }))

    try {
      await removeStudent(id)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [id]: error.message }))
      setRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Add Student</p>
      <h2>Student Admission</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleStudentSubmit}>
        <select
          value={studentForm.className}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, className: event.target.value }))}
          required
        >
          <option value="">Select class</option>
          {CLASSES.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Student name"
          value={studentForm.name}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Parents' names"
          value={studentForm.parentsNames}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, parentsNames: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Date of birth</span>
          <input
            type="date"
            value={studentForm.dob}
            onChange={(event) => setStudentForm((prev) => ({ ...prev, dob: event.target.value }))}
            required
          />
        </label>
        <input
          type="text"
          placeholder="Contact number"
          value={studentForm.contact}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, contact: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={studentPhotoInputRef}
            onChange={(event) => setStudentPhoto(event.target.files[0] || null)}
            required
          />
        </label>
        {studentFormError && <p className="error-text">{studentFormError}</p>}
        <button type="submit" disabled={studentSubmitting}>
          {studentSubmitting ? 'Adding...' : 'Add Student'}
        </button>
      </form>

      <div className="teachers-grid admin-list-gap">
        {students.map((student) => (
          <article key={student.id} className="teacher-card">
            <img src={student.photoUrl} alt={student.name} />
            <h3>{student.name}</h3>
            <p className="subject-pill">{student.className}</p>
            <p>{student.parentsNames}</p>
            <p>{student.contact}</p>

            {isSuperAdmin && (
              <>
                <div className="card-actions">
                  <Link className="cta-btn" to={`/admin/dashboard/students/${student.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="cta-btn danger-btn"
                    disabled={rowBusy[student.id]}
                    onClick={() => handleDelete(student.id)}
                  >
                    {rowBusy[student.id] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                {rowError[student.id] && <p className="error-text">{rowError[student.id]}</p>}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default AdminStudentsPage
