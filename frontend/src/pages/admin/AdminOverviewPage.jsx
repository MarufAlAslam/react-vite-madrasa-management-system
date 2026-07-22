import { useMemo } from 'react'
import { useData } from '../../context/DataContext'

function AdminOverviewPage() {
  const { notices, teachers, students, gallery } = useData()

  const stats = useMemo(
    () => [
      { label: 'Total Notices', value: notices.length },
      { label: 'Teachers', value: teachers.length },
      { label: 'Students', value: students.length },
      { label: 'Gallery Items', value: gallery.length },
    ],
    [notices.length, teachers.length, students.length, gallery.length],
  )

  return (
    <section className="panel">
      <p className="section-eyebrow">Dashboard</p>
      <h2>Overview</h2>

      <div className="stats-grid">
        {stats.map((item) => (
          <article className="stat-card" key={item.label}>
            <p>{item.label}</p>
            <h3>{item.value}</h3>
          </article>
        ))}
      </div>

      <div className="notice-vertical-list admin-list-gap">
        {notices.slice(0, 4).map((notice) => (
          <article key={notice.id} className="notice-row-card">
            <div>
              <p className="notice-date">{notice.date}</p>
              <h3>{notice.title}</h3>
              <p>{notice.short}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AdminOverviewPage
