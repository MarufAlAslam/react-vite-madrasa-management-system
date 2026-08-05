import { useState } from 'react'
import { useData } from '../context/DataContext'

function StudentsPage() {
  const { students, classes, loading } = useData()
  const [selectedClass, setSelectedClass] = useState('')

  const filteredStudents = selectedClass ? students.filter((student) => student.className === selectedClass) : []

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Students</p>
        <h2>Student Directory</h2>

        <label className="file-input-label" htmlFor="student-class-filter">
          <span>Select a class to view students</span>
          <select
            id="student-class-filter"
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            <option value="">Choose a class...</option>
            {classes.map((classItem) => (
              <option key={classItem.className} value={classItem.className}>
                {classItem.className}
              </option>
            ))}
          </select>
        </label>

        {loading && <div className="empty-state">Loading students...</div>}

        {!loading && selectedClass && filteredStudents.length === 0 && (
          <div className="empty-state">No students found in {selectedClass}.</div>
        )}

        {!loading && filteredStudents.length > 0 && (
          <div className="teachers-grid admin-list-gap">
            {filteredStudents.map((student) => (
              <article key={student.id} className="teacher-card">
                <img src={student.photoUrl} alt={student.name} />
                <h3>{student.name}</h3>
                <p className="subject-pill">{student.className}</p>
                <p>Roll: {student.roll}</p>
                <p>Father: {student.fatherName}</p>
                <p>Mother: {student.motherName}</p>
                <p>DOB: {student.dob}</p>
                <p>Contact: {student.contact}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default StudentsPage
