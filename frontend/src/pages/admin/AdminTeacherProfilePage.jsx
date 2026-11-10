import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { TEACHER_DOCUMENTS } from '../../constants/admin'
import TeacherAssignments from '../../components/admin/TeacherAssignments'
import TeacherLoginForm from '../../components/admin/TeacherLoginForm'
import { useData } from '../../context/DataContext'
import { teacherDetails } from '../../utils/teacher'
import { downloadTeacherIdCard } from '../../utils/idCard'
import { downloadTeacherProfilePdf } from '../../utils/teacherProfilePdf'

function AdminTeacherProfilePage() {
  const { id } = useParams()
  const { teachers } = useData()
  const [generating, setGenerating] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  const teacher = teachers.find((item) => item.id === id)

  if (!teacher) {
    return <Navigate to="/admin/dashboard/teachers/list" replace />
  }

  async function handleDownload() {
    setPdfError(null)
    setGenerating(true)
    try {
      await downloadTeacherProfilePdf(teacher)
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownloadIdCard() {
    setPdfError(null)
    setGenerating(true)
    try {
      await downloadTeacherIdCard(teacher)
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Teacher Profile</p>
      <h2>{teacher.name}</h2>

      <div className="student-detail-header">
        <img className="edit-preview-photo" src={teacher.photoUrl} alt={teacher.name} />
        <div>
          {teacherDetails(teacher, { includeNid: true }).map(([label, value]) => (
            <p key={label}>
              <strong>{label}:</strong> {value}
            </p>
          ))}
        </div>
      </div>

      <h3>Documents</h3>
      <ul className="document-list">
        {TEACHER_DOCUMENTS.map(({ field, label }) => {
          const url = teacher[`${field}Url`]
          return (
            <li key={field}>
              <strong>{label}:</strong>{' '}
              {url ? (
                <>
                  <a href={url} target="_blank" rel="noreferrer">
                    View
                  </a>
                  {' | '}
                  <a href={url} download>
                    Download
                  </a>
                </>
              ) : (
                'Not uploaded'
              )}
            </li>
          )
        })}
      </ul>

      <TeacherAssignments teacher={teacher} />
      <TeacherLoginForm teacher={teacher} />

      {pdfError && <p className="error-text">{pdfError}</p>}

      <div className="card-actions">
        <Link className="cta-btn" to={`/admin/dashboard/teachers/${teacher.id}/edit`}>
          Edit Details
        </Link>
        <button type="button" className="cta-btn" disabled={generating} onClick={handleDownload}>
          {generating ? 'Preparing...' : 'Download Profile (PDF)'}
        </button>
        <button type="button" className="cta-btn" disabled={generating} onClick={handleDownloadIdCard}>
          Teacher ID Card (PDF)
        </button>
        <button type="button" className="cta-btn" onClick={() => window.print()}>
          Print
        </button>
      </div>
    </section>
  )
}

export default AdminTeacherProfilePage
