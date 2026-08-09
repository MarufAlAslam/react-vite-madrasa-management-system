import { Link, Navigate, useParams } from 'react-router-dom'
import { useData } from '../../context/DataContext'

function AdminTeacherProfilePage() {
  const { id } = useParams()
  const { teachers } = useData()

  const teacher = teachers.find((item) => item.id === id)

  if (!teacher) {
    return <Navigate to="/admin/dashboard/teachers/list" replace />
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
    </section>
  )
}

export default AdminTeacherProfilePage
