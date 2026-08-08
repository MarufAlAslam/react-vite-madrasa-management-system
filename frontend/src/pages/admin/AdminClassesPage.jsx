import { useState } from 'react'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'

const emptySubjectRow = { name: '', fullMarks: '', labelEn: '', code: '' }

function totalMarks(subjects) {
  return subjects.reduce((sum, subject) => sum + (Number(subject.fullMarks) || 0), 0)
}

function SubjectEditor({ subjects, onChange }) {
  function updateRow(index, field, value) {
    onChange(subjects.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    onChange([...subjects, { ...emptySubjectRow }])
  }

  function removeRow(index) {
    onChange(subjects.filter((_, i) => i !== index))
  }

  return (
    <div>
      {subjects.map((subject, index) => (
        <div className="subject-row" key={index}>
          <input
            type="text"
            placeholder="Subject name"
            value={subject.name}
            onChange={(event) => updateRow(index, 'name', event.target.value)}
          />
          <input
            type="text"
            placeholder="PDF label (English, optional)"
            value={subject.labelEn || ''}
            onChange={(event) => updateRow(index, 'labelEn', event.target.value)}
          />
          <input
            type="text"
            placeholder="Subject code (optional)"
            value={subject.code || ''}
            onChange={(event) => updateRow(index, 'code', event.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="Full marks"
            value={subject.fullMarks}
            onChange={(event) => updateRow(index, 'fullMarks', event.target.value)}
          />
          <button type="button" className="danger-btn" onClick={() => removeRow(index)}>
            Remove
          </button>
        </div>
      ))}
      <div className="gallery-manage-actions">
        <button type="button" onClick={addRow}>
          Add Subject
        </button>
        <span className="subject-total">Total: {totalMarks(subjects)} marks</span>
      </div>
    </div>
  )
}

function AdminClassesPage() {
  const { classes, backendError, addClass, editClass, removeClass } = useData()
  const confirm = useConfirm()

  const [newClassName, setNewClassName] = useState('')
  const [newSubjects, setNewSubjects] = useState([{ ...emptySubjectRow }])
  const [copyFrom, setCopyFrom] = useState('')
  const [createError, setCreateError] = useState(null)
  const [creating, setCreating] = useState(false)

  const [editingClassName, setEditingClassName] = useState(null)
  const [editSubjects, setEditSubjects] = useState([])
  const [rowBusy, setRowBusy] = useState({})
  const [rowError, setRowError] = useState({})

  function handleCopyFrom(className) {
    setCopyFrom(className)
    const source = classes.find((item) => item.className === className)
    if (source) {
      setNewSubjects(source.subjects.map((subject) => ({ ...subject })))
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    setCreateError(null)

    const cleanedSubjects = newSubjects
      .map((subject) => ({
        name: subject.name.trim(),
        fullMarks: Number(subject.fullMarks),
        labelEn: subject.labelEn?.trim() || subject.name.trim(),
        code: subject.code?.trim() || '',
      }))
      .filter((subject) => subject.name && subject.fullMarks > 0)

    if (!newClassName.trim()) {
      setCreateError('Class name is required.')
      return
    }
    if (cleanedSubjects.length === 0) {
      setCreateError('Add at least one subject with a valid full marks value.')
      return
    }

    setCreating(true)
    try {
      await addClass({ className: newClassName.trim(), subjects: cleanedSubjects })
      setNewClassName('')
      setNewSubjects([{ ...emptySubjectRow }])
      setCopyFrom('')
    } catch (error) {
      setCreateError(error.message)
    } finally {
      setCreating(false)
    }
  }

  function startEdit(classItem) {
    setEditingClassName(classItem.className)
    setEditSubjects(classItem.subjects.map((subject) => ({ ...subject })))
  }

  async function handleSaveEdit(className) {
    const cleanedSubjects = editSubjects
      .map((subject) => ({
        name: subject.name.trim(),
        fullMarks: Number(subject.fullMarks),
        labelEn: subject.labelEn?.trim() || subject.name.trim(),
        code: subject.code?.trim() || '',
      }))
      .filter((subject) => subject.name && subject.fullMarks > 0)

    if (cleanedSubjects.length === 0) {
      setRowError((prev) => ({ ...prev, [className]: 'Add at least one valid subject.' }))
      return
    }

    setRowBusy((prev) => ({ ...prev, [className]: true }))
    setRowError((prev) => ({ ...prev, [className]: null }))

    try {
      await editClass(className, cleanedSubjects)
      setEditingClassName(null)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [className]: error.message }))
    } finally {
      setRowBusy((prev) => ({ ...prev, [className]: false }))
    }
  }

  async function handleDelete(className) {
    if (
      !(await confirm(`Delete "${className}"? Students already in this class will keep it, but it can no longer be selected.`, {
        danger: true,
      }))
    ) {
      return
    }

    setRowBusy((prev) => ({ ...prev, [className]: true }))
    try {
      await removeClass(className)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [className]: error.message }))
      setRowBusy((prev) => ({ ...prev, [className]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Manage Classes</p>
      <h2>Classes &amp; Subjects</h2>
      <p className="helper-text">
        Only classes defined here can be selected when adding students, entering results, or generating admit cards.
      </p>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Class name (e.g. Class 9)"
          value={newClassName}
          onChange={(event) => setNewClassName(event.target.value)}
        />

        {classes.length > 0 && (
          <select value={copyFrom} onChange={(event) => handleCopyFrom(event.target.value)}>
            <option value="">Copy subjects from existing class (optional)</option>
            {classes.map((item) => (
              <option key={item.className} value={item.className}>
                {item.className}
              </option>
            ))}
          </select>
        )}

        <SubjectEditor subjects={newSubjects} onChange={setNewSubjects} />

        {createError && <p className="error-text">{createError}</p>}
        <button type="submit" disabled={creating}>
          {creating ? 'Creating...' : 'Create Class'}
        </button>
      </form>

      {classes.length === 0 && <div className="empty-state">No classes configured yet.</div>}

      <div className="notice-vertical-list admin-list-gap">
        {classes.map((classItem) => {
          const busy = Boolean(rowBusy[classItem.className])
          const isEditing = editingClassName === classItem.className

          return (
            <article key={classItem.className} className="notice-row-card">
              <h3>{classItem.className}</h3>

              {isEditing ? (
                <>
                  <SubjectEditor subjects={editSubjects} onChange={setEditSubjects} />
                  <div className="gallery-manage-actions">
                    <button type="button" disabled={busy} onClick={() => handleSaveEdit(classItem.className)}>
                      {busy ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="danger-btn" onClick={() => setEditingClassName(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <ul className="subject-list-view">
                    {classItem.subjects.map((subject) => (
                      <li key={subject.name}>
                        <span>{subject.name}</span>
                        <span>{subject.fullMarks}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="subject-total">Total: {totalMarks(classItem.subjects)} marks</p>
                  <div className="gallery-manage-actions">
                    <button type="button" onClick={() => startEdit(classItem)}>
                      Edit
                    </button>
                    <button type="button" className="danger-btn" disabled={busy} onClick={() => handleDelete(classItem.className)}>
                      {busy ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}

              {rowError[classItem.className] && <p className="error-text">{rowError[classItem.className]}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AdminClassesPage
