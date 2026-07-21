import { useData } from '../context/DataContext'

function TeachersPage() {
  const { teachers, loading } = useData()

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
            {teachers.map((teacher) => (
              <article key={teacher.id} className="teacher-card">
                <img src={teacher.photoUrl} alt={teacher.name} />
                <h3>{teacher.name}</h3>
                <p className="subject-pill">{teacher.designation}</p>
                <p>{teacher.subject}</p>
                <p>{teacher.phone}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default TeachersPage
