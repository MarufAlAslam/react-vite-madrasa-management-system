import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'

function AdminTeacherProfilePage() {
  const { id } = useParams()
  const { teachers, classes, assignTeacherClasses } = useData()

  const teacher = teachers.find((item) => item.id === id)

  const [selectedClasses, setSelectedClasses] = useState(teacher?.assignedClasses ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  if (!teacher) {
    return <Navigate to="/admin/dashboard/teachers" replace />
  }

  function toggleClass(className) {
    setSaved(false)
    setSelectedClasses((prev) =>
      prev.includes(className) ? prev.filter((item) => item !== className) : [...prev, className],
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await assignTeacherClasses(teacher.id, selectedClasses)
      setSaved(true)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Teacher Profile</p>
      <h2>{teacher.name}</h2>

      <div className="student-detail-header">
        <img className="edit-preview-photo" src={teacher.photoUrl} alt={teacher.name} />
        <div>
          <p>
            <strong>Designation:</strong> {teacher.designation}
          </p>
          <p>
            <strong>Subject:</strong> {teacher.subject}
          </p>
          <p>
            <strong>Index No.:</strong> {teacher.indexNo}
          </p>
          <p>
            <strong>Contact:</strong> {teacher.phone}
          </p>
        </div>
      </div>

      <div className="card-actions">
        <Link className="cta-btn" to={`/admin/dashboard/teachers/${teacher.id}/edit`}>
          Edit Details
        </Link>
      </div>

      <h3>Assigned Classes</h3>
      <p className="helper-text">Select which classes this teacher is assigned to teach.</p>

      {classes.length === 0 && <div className="empty-state">No classes configured yet.</div>}

      <div className="checkbox-grid">
        {classes.map((classItem) => (
          <label key={classItem.className}>
            <input
              type="checkbox"
              checked={selectedClasses.includes(classItem.className)}
              onChange={() => toggleClass(classItem.className)}
            />
            {classItem.className}
          </label>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {saved && <p className="helper-text">Assigned classes saved.</p>}

      <div className="card-actions">
        <button type="button" className="cta-btn" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Assignment'}
        </button>
      </div>
    </section>
  )
}

export default AdminTeacherProfilePage
