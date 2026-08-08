import { useMemo, useState } from 'react'
import { useData } from '../../context/DataContext'
import StudentResultsPanel from '../../components/admin/StudentResultsPanel'

function AdminResultsPage() {
  const { students, classes, backendError } = useData()

  const [classFilter, setClassFilter] = useState('')
  const [studentId, setStudentId] = useState('')

  const filteredStudents = useMemo(
    () => (classFilter ? students.filter((student) => student.className === classFilter) : []),
    [students, classFilter],
  )

  const selectedStudent = filteredStudents.find((student) => student.id === studentId) ?? null

  function handleClassChange(value) {
    setClassFilter(value)
    setStudentId('')
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Result Management</p>
        <h2>Manage Student Results</h2>

        {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

        <div className="finance-filter-row">
          <label htmlFor="results-class-filter">Class:</label>
          <select id="results-class-filter" value={classFilter} onChange={(event) => handleClassChange(event.target.value)}>
            <option value="">Choose a class...</option>
            {classes.map((classItem) => (
              <option key={classItem.className} value={classItem.className}>
                {classItem.className}
              </option>
            ))}
          </select>

          <label htmlFor="results-student-filter">Student:</label>
          <select
            id="results-student-filter"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={!classFilter}
          >
            <option value="">Choose a student...</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} (Roll: {student.roll})
              </option>
            ))}
          </select>
        </div>

        {classFilter && filteredStudents.length === 0 && (
          <div className="empty-state">No students found in {classFilter}.</div>
        )}
      </section>

      {selectedStudent && <StudentResultsPanel student={selectedStudent} />}
    </div>
  )
}

export default AdminResultsPage
