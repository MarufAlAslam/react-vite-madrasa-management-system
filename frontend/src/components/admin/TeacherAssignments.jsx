import { useState } from 'react'
import { useData } from '../../context/DataContext'

// Super-admin editor for the class/subject pairs a teacher may enter results for.
function TeacherAssignments({ teacher }) {
  const { classes, assignTeacherClasses } = useData()

  const [assignments, setAssignments] = useState(
    (teacher.assignedClasses ?? []).filter((item) => item?.className && item?.subject),
  )
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const subjects = classes.find((item) => item.className === className)?.subjects ?? []

  function handleAdd() {
    if (!className || !subject) return
    setAssignments((prev) =>
      prev.some((item) => item.className === className && item.subject === subject)
        ? prev
        : [...prev, { className, subject }],
    )
    setSubject('')
    setMessage(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await assignTeacherClasses(teacher.id, assignments)
      setMessage('Assignments saved.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h3>Assigned Classes &amp; Subjects</h3>
      <p className="helper-text">A teacher with a login can enter results only for these class and subject pairs.</p>

      {assignments.length === 0 && <p>Nothing assigned yet.</p>}
      <ul className="document-list">
        {assignments.map((item) => (
          <li key={`${item.className}/${item.subject}`}>
            {item.className} — {item.subject}{' '}
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                setAssignments((prev) => prev.filter((entry) => entry !== item))
                setMessage(null)
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="finance-filter-row">
        <select value={className} onChange={(event) => { setClassName(event.target.value); setSubject('') }}>
          <option value="">Choose a class...</option>
          {classes.map((item) => (
            <option key={item.className} value={item.className}>
              {item.className}
            </option>
          ))}
        </select>
        <select value={subject} onChange={(event) => setSubject(event.target.value)} disabled={!className}>
          <option value="">Choose a subject...</option>
          {subjects.map((item) => (
            <option key={item.name} value={item.name}>
              {item.labelEn || item.name}
            </option>
          ))}
        </select>
        <button type="button" className="cta-btn" onClick={handleAdd} disabled={!className || !subject}>
          Add
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="helper-text">{message}</p>}
      <div className="card-actions">
        <button type="button" className="cta-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Assignments'}
        </button>
      </div>
    </>
  )
}

export default TeacherAssignments
