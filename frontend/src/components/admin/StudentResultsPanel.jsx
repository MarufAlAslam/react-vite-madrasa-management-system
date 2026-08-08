import { useEffect, useMemo, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'
import { createResult, deleteResult, getResults, updateResult } from '../../services/backendApi'
import { computeGrade } from '../../utils/grade'
import { drawDoubleBorder, imageUrlToCoverDataUrl, THEME } from '../../utils/pdf'

function StudentResultsPanel({ student }) {
  const { classes } = useData()
  const { token } = useAuth()
  const confirm = useConfirm()

  const studentSubjects = classes.find((item) => item.className === student.className)?.subjects ?? []

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
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const formRef = useRef(null)

  const groupedResults = useMemo(() => {
    const map = new Map()
    results.forEach((result) => {
      if (!map.has(result.examName)) map.set(result.examName, [])
      map.get(result.examName).push(result)
    })
    return Array.from(map.entries()).map(([name, entries]) => ({ examName: name, entries }))
  }, [results])

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
      setResultFormError('Exam name is required.')
      return
    }

    const idsBySubject = editingResultIds || {}
    const ops = []

    studentSubjects.forEach((subject) => {
      const value = marksBySubject[subject.name]
      const existingId = idsBySubject[subject.name]
      const hasValue = value !== undefined && value !== ''

      if (hasValue) {
        const grade = computeGrade(value, subject.fullMarks)
        const payload = { examName: examName.trim(), subject: subject.name, marks: value, grade }
        ops.push(
          existingId
            ? updateResult(existingId, payload, token)
            : createResult({ studentId: student.id, ...payload }, token),
        )
      } else if (existingId) {
        ops.push(deleteResult(existingId, token))
      }
    })

    if (ops.length === 0) {
      setResultFormError('Enter marks for at least one subject.')
      return
    }

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

  async function handleDownloadResult() {
    setPdfError(null)
    setGeneratingPdf(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()

      drawDoubleBorder(doc, 14, 14, pageWidth - 28, 38)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...THEME.green)
      doc.setFontSize(16)
      doc.text('Moulovirhat H. Fazil Madrasah', pageWidth / 2, 26, { align: 'center' })
      doc.setFontSize(12)
      doc.text('Result Sheet', pageWidth / 2, 34, { align: 'center' })

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

      autoTable(doc, {
        startY: 58,
        head: [['Exam', 'Subject', 'Marks', 'Grade']],
        body: results.map((result) => [
          result.examName,
          studentSubjects.find((subject) => subject.name === result.subject)?.labelEn || result.subject,
          result.marks,
          result.grade,
        ]),
        headStyles: { fillColor: THEME.green, textColor: 255 },
        alternateRowStyles: { fillColor: THEME.paperTint },
        styles: { textColor: THEME.ink, lineColor: THEME.gold, lineWidth: 0.2 },
      })

      doc.save(`result-${student.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (error) {
      setPdfError(error.message)
    } finally {
      setGeneratingPdf(false)
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

      <form className="admin-form" onSubmit={handleSaveResults} ref={formRef}>
        {editingResultIds && <p className="helper-text">Editing exam: {examName || '(unnamed)'}</p>}

        <input
          type="text"
          placeholder="Exam name (e.g. First Term, Class Test, Mid Term)"
          value={examName}
          onChange={(event) => setExamName(event.target.value)}
        />

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
                placeholder="Marks"
                value={marksBySubject[subject.name] ?? ''}
                onChange={(event) => handleMarksChange(subject.name, event.target.value)}
              />
            </label>
          ))}
        </div>

        {resultFormError && <p className="error-text">{resultFormError}</p>}
        <div className="card-actions">
          <button type="submit" disabled={resultSubmitting || studentSubjects.length === 0}>
            {resultSubmitting ? 'Saving...' : editingResultIds ? 'Save Changes' : 'Save Results'}
          </button>
          {editingResultIds && (
            <button type="button" className="danger-btn" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {resultsLoading && <div className="empty-state">Loading results...</div>}
      {resultsError && <p className="error-text">{resultsError}</p>}
      {!resultsLoading && groupedResults.length === 0 && <div className="empty-state">No results recorded yet.</div>}

      {groupedResults.map((group) => (
        <div key={group.examName} className="result-exam-group">
          <h3>{group.examName}</h3>

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
          </div>
        </div>
      ))}

      {!resultsLoading && results.length > 0 && (
        <div className="card-actions">
          <button type="button" className="cta-btn" disabled={generatingPdf} onClick={handleDownloadResult}>
            {generatingPdf ? 'Preparing...' : 'Download Result Sheet (PDF)'}
          </button>
        </div>
      )}
      {pdfError && <p className="error-text">{pdfError}</p>}
    </section>
  )
}

export default StudentResultsPanel
