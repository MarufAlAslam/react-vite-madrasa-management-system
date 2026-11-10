import { useMemo, useState } from 'react'
import TeacherAssignments from '../../components/admin/TeacherAssignments'
import TeacherLoginForm from '../../components/admin/TeacherLoginForm'
import { sortByDesignation } from '../../constants/admin'
import { useData } from '../../context/DataContext'

function AdminTeacherAccessPage() {
  const { teachers, backendError } = useData()
  const [teacherId, setTeacherId] = useState('')

  const sortedTeachers = useMemo(() => sortByDesignation(teachers), [teachers])
  const teacher = teachers.find((item) => item.id === teacherId)

  return (
    <section className="panel">
      <p className="section-eyebrow">Teacher Access</p>
      <h2>Assign Subjects &amp; Create Teacher Login</h2>
      <p className="helper-text">
        Give a teacher a login, then assign the class and subject pairs they can enter results for. Teachers sign in
        from the same admin login page and see only their own results page.
      </p>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="access-teacher">Teacher:</label>
        <select id="access-teacher" value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
          <option value="">Choose a teacher...</option>
          {sortedTeachers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.designation})
            </option>
          ))}
        </select>
      </div>

      {teachers.length === 0 && <div className="empty-state">No teachers added yet.</div>}

      {teacher && (
        <div key={teacher.id}>
          <TeacherLoginForm teacher={teacher} />
          <TeacherAssignments teacher={teacher} />
        </div>
      )}
    </section>
  )
}

export default AdminTeacherAccessPage
