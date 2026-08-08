import { useRef, useState } from 'react'
import { useData } from '../../context/DataContext'

const emptyStudentForm = {
  className: '',
  name: '',
  fatherName: '',
  motherName: '',
  roll: '',
  dob: '',
  contact: '',
  registrationNo: '',
  section: '',
}

function AdminStudentsPage() {
  const { classes, backendError, addStudent } = useData()

  const [studentForm, setStudentForm] = useState(emptyStudentForm)
  const [studentPhoto, setStudentPhoto] = useState(null)
  const [studentFormError, setStudentFormError] = useState(null)
  const [studentSubmitting, setStudentSubmitting] = useState(false)
  const studentPhotoInputRef = useRef(null)

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
          {classes.map((classItem) => (
            <option key={classItem.className} value={classItem.className}>
              {classItem.className}
            </option>
          ))}
        </select>
        {classes.length === 0 && <p className="helper-text">No classes configured yet — add one under Manage Classes first.</p>}
        <input
          type="text"
          placeholder="Student name"
          value={studentForm.name}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Father's name"
          value={studentForm.fatherName}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, fatherName: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Mother's name"
          value={studentForm.motherName}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, motherName: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Roll number"
          value={studentForm.roll}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, roll: event.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Registration number (optional)"
          value={studentForm.registrationNo}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, registrationNo: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Section (optional)"
          value={studentForm.section}
          onChange={(event) => setStudentForm((prev) => ({ ...prev, section: event.target.value }))}
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
    </section>
  )
}

export default AdminStudentsPage
