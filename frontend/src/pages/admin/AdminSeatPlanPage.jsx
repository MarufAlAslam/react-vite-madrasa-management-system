import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import { buildSeatPlanPdf } from '../../utils/seatPlan'

function AdminSeatPlanPage() {
  const { students, classes, backendError } = useData()

  const [className, setClassName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const classStudents = useMemo(() => students.filter((student) => student.className === className), [students, className])

  async function handleDownload() {
    setError(null)
    setGenerating(true)
    try {
      const doc = await buildSeatPlanPdf(classStudents)
      doc.save(`seat-plan-${className.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (generateError) {
      setError(generateError.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Exams</p>
      <h2>Seat Plan</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="seat-plan-class">Class:</label>
        <select id="seat-plan-class" value={className} onChange={(event) => setClassName(event.target.value)}>
          <option value="">Choose a class...</option>
          {classes.map((item) => (
            <option key={item.className} value={item.className}>
              {item.className}
            </option>
          ))}
        </select>
      </div>

      {className && classStudents.length === 0 && <div className="empty-state">No students found in {className}.</div>}

      {classStudents.length > 0 && (
        <>
          <p>{classStudents.length} student cards, 2 per row, sorted by roll.</p>
          {error && <p className="error-text">{error}</p>}
          <div className="card-actions">
            <button type="button" className="cta-btn" disabled={generating} onClick={handleDownload}>
              {generating ? 'Preparing...' : 'Download Seat Plan (PDF)'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default AdminSeatPlanPage
