import { useState } from 'react'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'
import ExamScheduleForm from '../../components/admin/ExamScheduleForm'

function AdminExamsPage() {
  const { classes, exams, backendError, addExam, removeExam } = useData()
  const confirm = useConfirm()

  const [classFilter, setClassFilter] = useState('')
  const [examName, setExamName] = useState('')
  const [duration, setDuration] = useState('')
  const [venue, setVenue] = useState('')
  const [scheduleBySubject, setScheduleBySubject] = useState({})
  const [createError, setCreateError] = useState(null)
  const [creating, setCreating] = useState(false)

  const [rowBusy, setRowBusy] = useState({})
  const [rowError, setRowError] = useState({})

  const classSubjects = classes.find((item) => item.className === classFilter)?.subjects ?? []

  function handleScheduleChange(subjectName, field, value) {
    setScheduleBySubject((prev) => ({ ...prev, [subjectName]: { ...prev[subjectName], [field]: value } }))
  }

  function resetForm() {
    setExamName('')
    setDuration('')
    setVenue('')
    setScheduleBySubject({})
  }

  async function handleCreate(event) {
    event.preventDefault()
    setCreateError(null)

    if (!classFilter) {
      setCreateError('Select a class first.')
      return
    }
    if (!examName.trim()) {
      setCreateError('Exam name is required.')
      return
    }

    setCreating(true)
    try {
      await addExam({
        name: examName.trim(),
        className: classFilter,
        duration: duration.trim(),
        venue: venue.trim(),
        schedule: scheduleBySubject,
      })
      resetForm()
    } catch (error) {
      setCreateError(error.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id) {
    if (
      !(await confirm('Delete this exam? Admit cards already downloaded are unaffected, but it can no longer be selected.', {
        danger: true,
      }))
    ) {
      return
    }

    setRowBusy((prev) => ({ ...prev, [id]: true }))
    try {
      await removeExam(id)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [id]: error.message }))
      setRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Exams</p>
      <h2>Create Exam</h2>
      <p className="helper-text">
        Admit cards can only be generated for an exam created here — pick the class it applies to and fill in the
        schedule once.
      </p>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="exam-class-filter">Class:</label>
        <select id="exam-class-filter" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
          <option value="">Choose a class...</option>
          {classes.map((classItem) => (
            <option key={classItem.className} value={classItem.className}>
              {classItem.className}
            </option>
          ))}
        </select>
      </div>

      {classFilter && (
        <form className="admin-form" onSubmit={handleCreate}>
          <ExamScheduleForm
            subjects={classSubjects}
            examName={examName}
            onExamNameChange={setExamName}
            duration={duration}
            onDurationChange={setDuration}
            venue={venue}
            onVenueChange={setVenue}
            scheduleBySubject={scheduleBySubject}
            onScheduleChange={handleScheduleChange}
          />
          {createError && <p className="error-text">{createError}</p>}
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Exam'}
          </button>
        </form>
      )}

      {exams.length === 0 && <div className="empty-state">No exams created yet.</div>}

      <div className="notice-vertical-list admin-list-gap">
        {exams.map((exam) => (
          <article key={exam.id} className="notice-row-card">
            <div>
              <h3>{exam.name}</h3>
              <p>
                <strong>Class:</strong> {exam.className}
              </p>
              <p>
                <strong>Duration:</strong> {exam.duration || '-'} &nbsp; <strong>Venue:</strong> {exam.venue || '-'}
              </p>
              {rowError[exam.id] && <p className="error-text">{rowError[exam.id]}</p>}
              <div className="gallery-manage-actions">
                <button
                  type="button"
                  className="danger-btn"
                  disabled={Boolean(rowBusy[exam.id])}
                  onClick={() => handleDelete(exam.id)}
                >
                  {rowBusy[exam.id] ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AdminExamsPage
