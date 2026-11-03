import TeacherCard from '../components/common/TeacherCard'
import { useData } from '../context/DataContext'
import { sortByDesignation } from '../constants/admin'

function TeachersPage() {
  const { teachers, loading } = useData()
  const sortedTeachers = sortByDesignation(teachers)

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Teachers</p>
        <h2>Faculty Directory</h2>

        {loading && <div className="empty-state">Loading teachers...</div>}
        {!loading && teachers.length === 0 && (
          <div className="empty-state">No teachers added yet.</div>
        )}

        {!loading && teachers.length > 0 && (
          <div className="teachers-grid">
            {sortedTeachers.map((teacher) => (
              <article key={teacher.id} className="teacher-card">
                <TeacherCard teacher={teacher} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default TeachersPage
