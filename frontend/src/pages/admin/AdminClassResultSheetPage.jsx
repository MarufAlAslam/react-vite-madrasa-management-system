import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { getAllResults } from '../../services/backendApi'
import { buildClassResultPdf, buildClassResultRows, ordinal, subjectHeading } from '../../utils/classResultSheet'

function AdminClassResultSheetPage() {
  const { token } = useAuth()
  const { students, classes, backendError } = useData()

  const [className, setClassName] = useState('')
  const [examName, setExamName] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAllResults(token)
      .then(setResults)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [token])

  const classStudents = useMemo(() => students.filter((student) => student.className === className), [students, className])
  const subjects = useMemo(() => classes.find((item) => item.className === className)?.subjects ?? [], [classes, className])

  const examNames = useMemo(() => {
    const ids = new Set(classStudents.map((student) => student.id))
    return [...new Set(results.filter((result) => ids.has(result.studentId)).map((result) => result.examName))]
  }, [classStudents, results])

  const rows = useMemo(
    () => (examName ? buildClassResultRows({ students: classStudents, results, examName }) : []),
    [classStudents, results, examName],
  )

  function handleClassChange(value) {
    setClassName(value)
    setExamName('')
  }

  function download() {
    buildClassResultPdf({ className, examName, subjects, rows }).save(
      `class-result-${className}-${examName}`.replace(/\s+/g, '-').toLowerCase() + '.pdf',
    )
  }

  function print() {
    const doc = buildClassResultPdf({ className, examName, subjects, rows })
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Result Management</p>
      <h2>Class Result Sheet</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="finance-filter-row">
        <label htmlFor="sheet-class">Class:</label>
        <select id="sheet-class" value={className} onChange={(event) => handleClassChange(event.target.value)}>
          <option value="">Choose a class...</option>
          {classes.map((item) => (
            <option key={item.className} value={item.className}>
              {item.className}
            </option>
          ))}
        </select>

        <label htmlFor="sheet-exam">Exam:</label>
        <select id="sheet-exam" value={examName} onChange={(event) => setExamName(event.target.value)} disabled={!className}>
          <option value="">Choose an exam...</option>
          {examNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="empty-state">Loading results...</div>}
      {!loading && className && examNames.length === 0 && (
        <div className="empty-state">No results have been entered for {className} yet.</div>
      )}

      {examName && (
        <>
          <div className="card-actions">
            <button type="button" className="cta-btn" onClick={download}>
              Download (PDF)
            </button>
            <button type="button" className="cta-btn" onClick={print}>
              Print
            </button>
          </div>

          <div className="table-wrap">
            <table className="data-table class-result-table">
              <thead>
                <tr>
                  <th>Merit</th>
                  <th>Roll</th>
                  <th>Name</th>
                  {subjects.map((subject) => (
                    <th key={subject.name} className="vertical-th">
                      <span>{subjectHeading(subject)}</span>
                    </th>
                  ))}
                  <th>Total</th>
                  <th>GPA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.student.id}>
                    <td>{row.position ? ordinal(row.position) : '-'}</td>
                    <td>{row.student.roll}</td>
                    <td>{row.student.name}</td>
                    {subjects.map((subject) => (
                      <td key={subject.name}>{row.marksBySubject[subject.name] ?? '-'}</td>
                    ))}
                    <td>{row.hasResult ? row.total : '-'}</td>
                    <td>{row.gpa === null ? '-' : row.gpa.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default AdminClassResultSheetPage
