import { useData } from '../context/DataContext'

function StaffPage() {
  const { staff, loading } = useData()

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Office Staff</p>
        <h2>Staff Directory</h2>

        {loading && <div className="empty-state">Loading staff...</div>}
        {!loading && staff.length === 0 && <div className="empty-state">No office staff added yet.</div>}

        {!loading && staff.length > 0 && (
          <div className="teachers-grid">
            {staff.map((member) => (
              <article key={member.id} className="teacher-card">
                <img src={member.photoUrl} alt={member.name} />
                <h3>{member.name}</h3>
                <p className="subject-pill">{member.designation}</p>
                <p>{member.phone}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default StaffPage
