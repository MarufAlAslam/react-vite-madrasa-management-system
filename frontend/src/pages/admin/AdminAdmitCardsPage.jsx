import { useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import { Link } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import { sortStudents } from '../../constants/admin'
import {
  CARD_GAP,
  drawAdmitCard,
  drawCuttingLine,
  getAdmitCardLayout,
  loadInstitutionAssets,
  loadStudentPhoto,
  PAGE_MARGIN,
} from '../../utils/admitCard'

function AdminAdmitCardsPage() {
  const { classes, students, settings, exams, backendError } = useData()

  const [classFilter, setClassFilter] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)

  const classSubjects = classes.find((item) => item.className === classFilter)?.subjects ?? []
  const classExams = useMemo(() => exams.filter((exam) => exam.className === classFilter), [exams, classFilter])
  const classStudents = useMemo(
    () => sortStudents(students.filter((student) => student.className === classFilter), [classFilter]),
    [students, classFilter],
  )

  function handleClassChange(value) {
    setClassFilter(value)
    setSelectedExamId('')
  }

  async function handleGenerate() {
    setError(null)

    const exam = classExams.find((item) => item.id === selectedExamId)
    if (!classFilter) {
      setError('Select a class first.')
      return
    }
    if (!exam) {
      setError('Select an exam first.')
      return
    }
    if (classStudents.length === 0) {
      setError(`No students found in ${classFilter}.`)
      return
    }

    setGenerating(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const { pageWidth, width, slotHeight, scale } = getAdmitCardLayout(doc, classSubjects)

      const assets = await loadInstitutionAssets(settings)
      const examInfo = { examName: exam.name }

      for (let index = 0; index < classStudents.length; index += 1) {
        const student = classStudents[index]
        setProgress(`Rendering ${index + 1} of ${classStudents.length}...`)

        const positionInPage = index % 2
        if (index > 0 && positionInPage === 0) {
          doc.addPage()
        }
        if (positionInPage === 1) {
          drawCuttingLine(doc, PAGE_MARGIN + slotHeight + CARD_GAP / 2, pageWidth)
        }

        const cardY = PAGE_MARGIN + positionInPage * (slotHeight + CARD_GAP)
        const studentPhotoDataUrl = await loadStudentPhoto(student)

        drawAdmitCard(doc, {
          x: PAGE_MARGIN,
          y: cardY,
          width,
          scale,
          assets,
          studentPhotoDataUrl,
          student,
          examInfo,
          subjects: classSubjects,
          scheduleBySubject: exam.schedule,
        })
      }

      doc.save(`admit-cards-${classFilter.replace(/\s+/g, '-').toLowerCase()}-${exam.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (generateError) {
      setError(generateError.message)
    } finally {
      setGenerating(false)
      setProgress(null)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Admit Cards</p>
      <h2>Bulk Admit Card Generator</h2>
      <p className="helper-text">
        Generate admit cards for every student in a class at once — 2 cards per page. For a single student, use the
        Download Admit Card option on that student's profile page instead.
      </p>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="admit-class-filter">Class:</label>
        <select id="admit-class-filter" value={classFilter} onChange={(event) => handleClassChange(event.target.value)}>
          <option value="">Choose a class...</option>
          {classes.map((classItem) => (
            <option key={classItem.className} value={classItem.className}>
              {classItem.className}
            </option>
          ))}
        </select>
      </div>

      {classFilter && classStudents.length === 0 && (
        <div className="empty-state">No students found in {classFilter}.</div>
      )}

      {classFilter && classStudents.length > 0 && (
        <>
          <p className="helper-text">{classStudents.length} student(s) in {classFilter}.</p>

          {classExams.length === 0 ? (
            <>
              <p className="helper-text">No exams created yet for {classFilter}.</p>
              <div className="card-actions">
                <Link className="cta-btn" to="/admin/dashboard/exams">
                  Create Exam
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="finance-filter-row">
                <label htmlFor="admit-exam-filter">Exam:</label>
                <select id="admit-exam-filter" value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
                  <option value="">Choose an exam...</option>
                  {classExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="error-text">{error}</p>}
              {progress && <p className="helper-text">{progress}</p>}
              <div className="card-actions">
                <button type="button" className="cta-btn" disabled={generating || !selectedExamId} onClick={handleGenerate}>
                  {generating ? 'Generating...' : `Download Admit Cards for ${classFilter} (PDF)`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default AdminAdmitCardsPage
