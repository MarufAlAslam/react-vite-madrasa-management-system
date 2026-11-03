import { useRef, useState } from 'react'
import TeacherDocumentUploads from '../../components/admin/TeacherDocumentUploads'
import TeacherFormFields from '../../components/admin/TeacherFormFields'
import { useData } from '../../context/DataContext'
import { DESIGNATIONS, UNIQUE_DESIGNATIONS } from '../../constants/admin'

const emptyTeacherForm = {
  name: '',
  designation: '',
  subject: '',
  indexNo: '',
  phone: '',
  joiningDate: '',
  gender: '',
  bloodGroup: '',
  department: '',
  qualification: '',
  nid: '',
  address: '',
}

function AdminTeachersPage() {
  const { teachers, backendError, addTeacher } = useData()

  const availableDesignations = DESIGNATIONS.filter(
    (designation) => !UNIQUE_DESIGNATIONS.includes(designation) || !teachers.some((t) => t.designation === designation),
  )

  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm)
  const [teacherPhoto, setTeacherPhoto] = useState(null)
  const [documents, setDocuments] = useState({})
  const [documentInputKey, setDocumentInputKey] = useState(0)
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
      Object.entries(documents).forEach(([field, file]) => file && formData.append(field, file))

      await addTeacher(formData)
      setTeacherForm(emptyTeacherForm)
      setTeacherPhoto(null)
      setDocuments({})
      setDocumentInputKey((key) => key + 1)
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
        <TeacherFormFields
          form={teacherForm}
          setForm={setTeacherForm}
          designations={availableDesignations}
          designationPlaceholder="Select designation"
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
        <TeacherDocumentUploads key={documentInputKey} files={documents} setFiles={setDocuments} />
        {teacherFormError && <p className="error-text">{teacherFormError}</p>}
        <button type="submit" disabled={teacherSubmitting}>
          {teacherSubmitting ? 'Adding...' : 'Add Teacher'}
        </button>
      </form>
    </section>
  )
}

export default AdminTeachersPage
