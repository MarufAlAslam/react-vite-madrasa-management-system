import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import TeacherDocumentUploads from '../../components/admin/TeacherDocumentUploads'
import TeacherFormFields from '../../components/admin/TeacherFormFields'
import { useData } from '../../context/DataContext'
import { DESIGNATIONS, UNIQUE_DESIGNATIONS } from '../../constants/admin'

function AdminTeacherEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { teachers, editTeacher } = useData()

  const teacher = teachers.find((item) => item.id === id)
  const availableDesignations = DESIGNATIONS.filter(
    (designation) =>
      !UNIQUE_DESIGNATIONS.includes(designation) ||
      designation === teacher?.designation ||
      !teachers.some((t) => t.designation === designation),
  )

  const [form, setForm] = useState(
    teacher
      ? {
          name: teacher.name,
          designation: teacher.designation,
          subject: teacher.subject,
          indexNo: teacher.indexNo,
          phone: teacher.phone,
          joiningDate: teacher.joiningDate || '',
          gender: teacher.gender || '',
          bloodGroup: teacher.bloodGroup || '',
          department: teacher.department || '',
          qualification: teacher.qualification || '',
          nid: teacher.nid || '',
          address: teacher.address || '',
        }
      : null,
  )
  const [photo, setPhoto] = useState(null)
  const [documents, setDocuments] = useState({})
  const [removedDocuments, setRemovedDocuments] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const photoInputRef = useRef(null)

  if (!teacher) {
    return <Navigate to="/admin/dashboard/teachers/list" replace />
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
      Object.entries(documents).forEach(([field, file]) => file && formData.append(field, file))
      formData.append(
        'removeDocuments',
        Object.keys(removedDocuments).filter((field) => removedDocuments[field]).join(','),
      )

      await editTeacher(id, formData)
      navigate('/admin/dashboard/teachers/list')
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

        <TeacherFormFields form={form} setForm={setForm} designations={availableDesignations} />
        <label className="file-input-label">
          <span>Replace photo (optional)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={photoInputRef}
            onChange={(event) => setPhoto(event.target.files[0] || null)}
          />
        </label>

        <TeacherDocumentUploads
          teacher={teacher}
          files={documents}
          setFiles={setDocuments}
          removed={removedDocuments}
          setRemoved={setRemovedDocuments}
        />

        {error && <p className="error-text">{error}</p>}

        <div className="card-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="danger-btn" onClick={() => navigate('/admin/dashboard/teachers/list')}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminTeacherEditPage
