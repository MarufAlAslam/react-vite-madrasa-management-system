import { useRef, useState } from 'react'
import { useData } from '../../context/DataContext'
import { DESIGNATIONS, UNIQUE_DESIGNATIONS } from '../../constants/admin'

const emptyTeacherForm = { name: '', designation: '', subject: '', indexNo: '', phone: '' }

function AdminTeachersPage() {
  const { teachers, backendError, addTeacher } = useData()

  const availableDesignations = DESIGNATIONS.filter(
    (designation) => !UNIQUE_DESIGNATIONS.includes(designation) || !teachers.some((t) => t.designation === designation),
  )

  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm)
  const [teacherPhoto, setTeacherPhoto] = useState(null)
  const [teacherFormError, setTeacherFormError] = useState(null)
  const [teacherSubmitting, setTeacherSubmitting] = useState(false)
  const teacherPhotoInputRef = useRef(null)

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
          {availableDesignations.map((designation) => (
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
    </section>
  )
}

export default AdminTeachersPage
