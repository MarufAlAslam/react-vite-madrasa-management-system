import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'
import { createResult, deleteResult, getAllResults, getResults, updateResult } from '../../services/backendApi'
import { computeGPA, computeGrade } from '../../utils/grade'
import { getMadrasaName } from '../../utils/institution'
import { drawDoubleBorder, imageUrlToCoverDataUrl, THEME } from '../../utils/pdf'

function StudentResultsPanel({ student }) {
  const { classes, exams, students, settings } = useData()
  const { token } = useAuth()
  const confirm = useConfirm()

  const studentSubjects = classes.find((item) => item.className === student.className)?.subjects ?? []
  const classExams = useMemo(
    () =>
      exams
        .filter((exam) => exam.className === student.className)
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [exams, student.className],
  )

  const [results, setResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [resultsError, setResultsError] = useState(null)

  const [examName, setExamName] = useState('')
  const [marksBySubject, setMarksBySubject] = useState({})
  const [editingResultIds, setEditingResultIds] = useState(null)
  const [resultFormError, setResultFormError] = useState(null)
  const [resultSubmitting, setResultSubmitting] = useState(false)

  const [examBusy, setExamBusy] = useState({})
  const [examActionError, setExamActionError] = useState({})

  const [pdfError, setPdfError] = useState(null)
  const [generatingExam, setGeneratingExam] = useState(null)

  const formRef = useRef(null)

  const groupedResults = useMemo(() => {
    const map = new Map()
    results.forEach((result) => {
      if (!map.has(result.examName)) map.set(result.examName, [])
      map.get(result.examName).push(result)
    })
    return Array.from(map.entries()).map(([name, entries]) => {
      const publishedAt = entries.reduce(
        (min, entry) => (entry.createdAt && (!min || entry.createdAt < min) ? entry.createdAt : min),
        null,
      )
      const updatedAt = entries.reduce(
        (max, entry) => (entry.updatedAt && (!max || entry.updatedAt > max) ? entry.updatedAt : max),
        null,
      )
      return { examName: name, entries, publishedAt, updatedAt }
    })
  }, [results])

  const examNameOptions = useMemo(() => {
    const names = classExams.map((exam) => exam.name)
    return examName && !names.includes(examName) ? [examName, ...names] : names
  }, [classExams, examName])

  useEffect(() => {
    setResultsLoading(true)
    getResults(student.id, token)
      .then(setResults)
      .catch((error) => setResultsError(error.message))
      .finally(() => setResultsLoading(false))
  }, [student.id, token])

  function handleMarksChange(subjectName, value) {
    setMarksBySubject((prev) => ({ ...prev, [subjectName]: value }))
  }

  function startEditExam(group) {
    const idsBySubject = {}
    const marks = {}
    group.entries.forEach((entry) => {
      idsBySubject[entry.subject] = entry.id
      marks[entry.subject] = entry.marks
    })
    setExamName(group.examName)
    setMarksBySubject(marks)
    setEditingResultIds(idsBySubject)
    setResultFormError(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelEdit() {
    setExamName('')
    setMarksBySubject({})
    setEditingResultIds(null)
    setResultFormError(null)
  }

  async function handleSaveResults(event) {
    event.preventDefault()

    if (!examName.trim()) {
      setResultFormError('Select an exam.')
      return
    }

    for (const subject of studentSubjects) {
      const value = marksBySubject[subject.name]
      if (value === undefined || value === '') continue

      const numeric = Number(value)
      if (Number.isNaN(numeric) || numeric < 0) {
        setResultFormError(`Marks for "${subject.name}" cannot be negative.`)
        return
      }
      if (numeric > subject.fullMarks) {
        setResultFormError(`Marks for "${subject.name}" cannot exceed ${subject.fullMarks}.`)
        return
      }
    }

    const idsBySubject = editingResultIds || {}
    const ops = studentSubjects.map((subject) => {
      const rawValue = marksBySubject[subject.name]
      const value = rawValue === undefined || rawValue === '' ? '0' : rawValue
      const grade = computeGrade(value, subject.fullMarks)
      const payload = { examName: examName.trim(), subject: subject.name, marks: value, grade }
      const existingId = idsBySubject[subject.name]
      return existingId
        ? updateResult(existingId, payload, token)
        : createResult({ studentId: student.id, ...payload }, token)
    })

    setResultSubmitting(true)
    setResultFormError(null)
    try {
      await Promise.all(ops)
      const fresh = await getResults(student.id, token)
      setResults(fresh)
      cancelEdit()
    } catch (error) {
      setResultFormError(error.message)
    } finally {
      setResultSubmitting(false)
    }
  }

  async function handleDeleteExam(group) {
    if (!(await confirm(`Delete all results for "${group.examName}"? This cannot be undone.`, { danger: true }))) return

    setExamBusy((prev) => ({ ...prev, [group.examName]: true }))
    setExamActionError((prev) => ({ ...prev, [group.examName]: null }))
    try {
      await Promise.all(group.entries.map((entry) => deleteResult(entry.id, token)))
      setResults((prev) => prev.filter((result) => result.examName !== group.examName))
      if (editingResultIds && examName === group.examName) cancelEdit()
    } catch (error) {
      setExamActionError((prev) => ({ ...prev, [group.examName]: error.message }))
    } finally {
      setExamBusy((prev) => ({ ...prev, [group.examName]: false }))
    }
  }

  async function handleDownloadExamResult(group) {
    setPdfError(null)
    setGeneratingExam(group.examName)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()

      drawDoubleBorder(doc, 14, 14, pageWidth - 28, 38)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...THEME.green)
      doc.setFontSize(16)
      doc.text(getMadrasaName(settings), pageWidth / 2, 26, { align: 'center' })
      doc.setFontSize(12)
      doc.text(`Result Sheet — ${group.examName}`, pageWidth / 2, 34, { align: 'center' })

      try {
        const photoDataUrl = await imageUrlToCoverDataUrl(student.photoUrl, 300, 300)
        doc.addImage(photoDataUrl, 'JPEG', pageWidth - 40, 18, 22, 22)
      } catch {
        // proceed without photo if it can't be fetched
      }

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...THEME.ink)
      doc.setFontSize(10)
      doc.text(`Name: ${student.name}`, 20, 42)
      doc.text(`Class: ${student.className}    Roll: ${student.roll}`, 20, 47)

      const totalObtained = group.entries.reduce((sum, entry) => sum + Number(entry.marks), 0)
      const totalFullMarks = group.entries.reduce((sum, entry) => {
        const fullMarks = studentSubjects.find((subject) => subject.name === entry.subject)?.fullMarks || 0
        return sum + fullMarks
      }, 0)
      const gpa = computeGPA(group.entries.map((entry) => entry.grade))

      autoTable(doc, {
        startY: 58,
        head: [['Subject', 'Marks Obtained', 'Full Marks', 'Grade']],
        body: group.entries.map((entry) => [
          studentSubjects.find((subject) => subject.name === entry.subject)?.labelEn || entry.subject,
          entry.marks,
          studentSubjects.find((subject) => subject.name === entry.subject)?.fullMarks ?? '-',
          entry.grade,
        ]),
        headStyles: { fillColor: THEME.green, textColor: 255 },
        alternateRowStyles: { fillColor: THEME.paperTint },
        styles: { textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2 },
      })

      let meritText = 'Merit Position: -'
      try {
        const allResults = await getAllResults(token)
        const classmateIds = new Set(
          students.filter((item) => item.className === student.className).map((item) => item.id),
        )
        const totalsByStudent = new Map()
        allResults.forEach((result) => {
          if (result.examName !== group.examName) return
          if (!classmateIds.has(result.studentId)) return
          totalsByStudent.set(result.studentId, (totalsByStudent.get(result.studentId) || 0) + Number(result.marks))
        })
        const ranked = [...totalsByStudent.entries()].sort((a, b) => b[1] - a[1])
        const position = ranked.findIndex(([id]) => id === student.id) + 1
        if (position > 0) meritText = `Merit Position: ${position} of ${ranked.length} (in class)`
      } catch {
        // if the class-wide ranking can't be computed, still deliver the rest of the result sheet
      }

      let y = doc.lastAutoTable.finalY + 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...THEME.ink)
      doc.text(`Total Marks Obtained: ${totalObtained} / ${totalFullMarks}`, 20, y)
      y += 7
      doc.text(`Final GPA: ${gpa.toFixed(2)}`, 20, y)
      y += 7
      doc.text(meritText, 20, y)

      doc.save(
        `result-${student.name.replace(/\s+/g, '-').toLowerCase()}-${group.examName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
      )
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGeneratingExam(null)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Results</p>
      <h2>Exam Results — {student.name}</h2>

      {studentSubjects.length === 0 && (
        <p className="helper-text">
          No subjects configured for {student.className}. Add them under Manage Classes before entering results.
        </p>
      )}

      {studentSubjects.length > 0 && classExams.length === 0 && (
        <>
          <p className="helper-text">No exams created yet for {student.className}.</p>
          <div className="card-actions">
            <Link className="cta-btn" to="/admin/dashboard/exams">
              Create Exam
            </Link>
          </div>
        </>
      )}

      {studentSubjects.length > 0 && classExams.length > 0 && (
        <form className="admin-form" onSubmit={handleSaveResults} ref={formRef}>
          {editingResultIds && <p className="helper-text">Editing exam: {examName || '(unnamed)'}</p>}

          <select value={examName} onChange={(event) => setExamName(event.target.value)} required>
            <option value="">Select exam...</option>
            {examNameOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <div className="subject-marks-grid">
            {studentSubjects.map((subject) => (
              <label
                className={`subject-marks-field ${editingResultIds?.[subject.name] ? 'is-editing' : ''}`}
                key={subject.name}
              >
                <span>
                  {subject.name} (out of {subject.fullMarks})
                </span>
                <input
                  type="number"
                  min="0"
                  max={subject.fullMarks}
                  placeholder="Marks (blank = 0)"
                  value={marksBySubject[subject.name] ?? ''}
                  onChange={(event) => handleMarksChange(subject.name, event.target.value)}
                />
              </label>
            ))}
          </div>

          {resultFormError && <p className="error-text">{resultFormError}</p>}
          <div className="card-actions">
            <button type="submit" disabled={resultSubmitting}>
              {resultSubmitting ? 'Saving...' : editingResultIds ? 'Save Changes' : 'Save Results'}
            </button>
            {editingResultIds && (
              <button type="button" className="danger-btn" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {resultsLoading && <div className="empty-state">Loading results...</div>}
      {resultsError && <p className="error-text">{resultsError}</p>}
      {!resultsLoading && groupedResults.length === 0 && <div className="empty-state">No results recorded yet.</div>}

      {groupedResults.map((group) => (
        <div key={group.examName} className="result-exam-group">
          <h3>{group.examName}</h3>
          <p className="result-exam-meta">
            {group.publishedAt && <span>Published: {new Date(group.publishedAt).toLocaleString()}</span>}
            {group.updatedAt && group.updatedAt !== group.publishedAt && (
              <span>Updated: {new Date(group.updatedAt).toLocaleString()}</span>
            )}
          </p>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map((entry) => {
                  const fullMarks = studentSubjects.find((subject) => subject.name === entry.subject)?.fullMarks
                  return (
                    <tr key={entry.id}>
                      <td>{entry.subject}</td>
                      <td>
                        {entry.marks}
                        {fullMarks ? ` / ${fullMarks}` : ''}
                      </td>
                      <td>{entry.grade}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {examActionError[group.examName] && <p className="error-text">{examActionError[group.examName]}</p>}
          <div className="gallery-manage-actions">
            <button type="button" onClick={() => startEditExam(group)}>
              Edit
            </button>
            <button
              type="button"
              className="danger-btn"
              disabled={Boolean(examBusy[group.examName])}
              onClick={() => handleDeleteExam(group)}
            >
              {examBusy[group.examName] ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              disabled={generatingExam === group.examName}
              onClick={() => handleDownloadExamResult(group)}
            >
              {generatingExam === group.examName ? 'Preparing...' : 'Download Result Sheet (PDF)'}
            </button>
          </div>
        </div>
      ))}
      {pdfError && <p className="error-text">{pdfError}</p>}
    </section>
  )
}

export default StudentResultsPanel
