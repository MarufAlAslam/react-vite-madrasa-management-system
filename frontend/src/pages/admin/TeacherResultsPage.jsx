import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { sortStudents } from '../../constants/admin'
import { createResult, getAllResults, updateResult } from '../../services/backendApi'
import { computeGrade } from '../../utils/grade'

function TeacherResultsPage() {
  const { token, user } = useAuth()
  const { teachers, students, classes, exams, loading, backendError } = useData()

  const teacher = teachers.find((item) => item.id === user?.teacherId)
  const assignments = useMemo(
    () => (teacher?.assignedClasses ?? []).filter((item) => item?.className && item?.subject),
    [teacher],
  )

  const [assignmentIndex, setAssignmentIndex] = useState('')
  const [examName, setExamName] = useState('')
  const [results, setResults] = useState([])
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const assignment = assignments[assignmentIndex] ?? null
  const subject = classes.find((item) => item.className === assignment?.className)?.subjects?.find((item) => item.name === assignment?.subject)

  const classStudents = useMemo(
    () => (assignment ? sortStudents(students.filter((student) => student.className === assignment.className), [assignment.className]) : []),
    [students, assignment],
  )
  const examNames = useMemo(
    () => [...new Set(exams.filter((exam) => exam.className === assignment?.className).map((exam) => exam.name))],
    [exams, assignment],
  )

  useEffect(() => {
    getAllResults(token)
      .then(setResults)
      .catch((loadError) => setError(loadError.message))
  }, [token])

  // The saved result for each student for the chosen exam and subject.
  const existingByStudent = useMemo(() => {
    const map = new Map()
    results.forEach((result) => {
      if (result.examName === examName && result.subject === assignment?.subject) map.set(result.studentId, result)
    })
    return map
  }, [results, examName, assignment])

  useEffect(() => {
    setMarks(Object.fromEntries([...existingByStudent].map(([studentId, result]) => [studentId, result.marks])))
  }, [existingByStudent])

  function handleAssignmentChange(value) {
    setAssignmentIndex(value)
    setExamName('')
    setMessage(null)
    setError(null)
  }

  async function handleSave() {
    setError(null)
    setMessage(null)

    const changes = []
    for (const student of classStudents) {
      const value = String(marks[student.id] ?? '').trim()
      const existing = existingByStudent.get(student.id)
      if (value === '' || value === existing?.marks) continue

      const numeric = Number(value)
      if (!Number.isFinite(numeric) || numeric < 0 || numeric > subject.fullMarks) {
        setError(`Marks for ${student.name} (roll ${student.roll}) must be between 0 and ${subject.fullMarks}.`)
        return
      }
      changes.push({ student, value, existing })
    }

    if (changes.length === 0) {
      setMessage('Nothing to save.')
      return
    }

    setSaving(true)
    try {
      for (const { student, value, existing } of changes) {
        const payload = { examName, subject: assignment.subject, marks: value, grade: computeGrade(value, subject.fullMarks) }
        if (existing) await updateResult(existing.id, payload, token)
        else await createResult({ studentId: student.id, ...payload }, token)
      }
      setResults(await getAllResults(token))
      setMessage(`Saved marks for ${changes.length} student${changes.length === 1 ? '' : 's'}.`)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">My Work</p>
      <h2>Enter Results</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}
      {loading && <div className="empty-state">Loading...</div>}
      {!loading && assignments.length === 0 && (
        <div className="empty-state">No class or subject has been assigned to you yet. Please contact the administrator.</div>
      )}

      {assignments.length > 0 && (
        <div className="finance-filter-row">
          <label htmlFor="my-assignment">Class &amp; subject:</label>
          <select id="my-assignment" value={assignmentIndex} onChange={(event) => handleAssignmentChange(event.target.value)}>
            <option value="">Choose...</option>
            {assignments.map((item, index) => (
              <option key={`${item.className}/${item.subject}`} value={index}>
                {item.className} — {item.subject}
              </option>
            ))}
          </select>

          <label htmlFor="my-exam">Exam:</label>
          <select id="my-exam" value={examName} onChange={(event) => setExamName(event.target.value)} disabled={!assignment}>
            <option value="">Choose an exam...</option>
            {examNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {assignment && examNames.length === 0 && <div className="empty-state">No exams have been created for {assignment.className} yet.</div>}

      {assignment && subject && examName && (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Marks (out of {subject.fullMarks})</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.roll}</td>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={subject.fullMarks}
                        step="any"
                        value={marks[student.id] ?? ''}
                        onChange={(event) => setMarks((prev) => ({ ...prev, [student.id]: event.target.value }))}
                      />
                    </td>
                    <td>{marks[student.id] === undefined || marks[student.id] === '' ? '-' : computeGrade(marks[student.id], subject.fullMarks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="error-text">{error}</p>}
          {message && <p className="helper-text">{message}</p>}
          <div className="card-actions">
            <button type="button" className="cta-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </>
      )}

      {!(assignment && subject && examName) && error && <p className="error-text">{error}</p>}
    </section>
  )
}

export default TeacherResultsPage
