import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { getAllResults, getIncomeExpenses } from '../../services/backendApi'
import { computeGPA } from '../../utils/grade'

function AdminOverviewPage() {
  const { notices, teachers, students, staff, gallery } = useData()
  const { token } = useAuth()

  const [results, setResults] = useState([])
  const [incomeExpenses, setIncomeExpenses] = useState([])

  useEffect(() => {
    let cancelled = false
    getAllResults(token)
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    getIncomeExpenses(token)
      .then((data) => {
        if (!cancelled) setIncomeExpenses(data)
      })
      .catch(() => {
        if (!cancelled) setIncomeExpenses([])
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const netBalance = useMemo(() => {
    const income = incomeExpenses.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + Number(entry.amount), 0)
    const expense = incomeExpenses.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + Number(entry.amount), 0)
    return income - expense
  }, [incomeExpenses])

  const newAdmissionsThisMonth = useMemo(() => {
    const now = new Date()
    return students.filter((student) => {
      if (!student.createdAt) return false
      const created = new Date(student.createdAt)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
  }, [students])

  const stats = useMemo(
    () => [
      { label: 'Total Notices', value: notices.length },
      { label: 'Teachers', value: teachers.length },
      { label: 'Office Staff', value: staff.length },
      { label: 'Students', value: students.length },
      { label: 'Gallery Items', value: gallery.length },
    ],
    [notices.length, teachers.length, staff.length, students.length, gallery.length],
  )

  const classPerformance = useMemo(() => {
    const classNameById = new Map(students.map((student) => [student.id, student.className]))
    const gradesByClass = new Map()

    results.forEach((result) => {
      const className = classNameById.get(result.studentId)
      if (!className) return
      if (!gradesByClass.has(className)) gradesByClass.set(className, [])
      gradesByClass.get(className).push(result.grade)
    })

    return [...gradesByClass.entries()]
      .map(([className, grades]) => ({ className, gpa: computeGPA(grades) }))
      .sort((a, b) => b.gpa - a.gpa)
  }, [results, students])

  const topClass = classPerformance[0]
  const needsAttentionClass = classPerformance[classPerformance.length - 1]
  const maxGpa = Math.max(5, ...classPerformance.map((item) => item.gpa))

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

      <div className="stats-grid admin-list-gap">
        <article className="stat-card">
          <p>Net Balance</p>
          <h3>{netBalance.toLocaleString()}</h3>
        </article>
        <article className="stat-card">
          <p>New Admissions This Month</p>
          <h3>{newAdmissionsThisMonth}</h3>
        </article>
      </div>

      {classPerformance.length > 0 && (
        <>
          <div className="stats-grid admin-list-gap">
            <article className="stat-card">
              <p>Best Performing Class</p>
              <h3>{topClass.className}</h3>
              <p>GPA {topClass.gpa.toFixed(2)}</p>
            </article>
            <article className="stat-card">
              <p>Needs More Attention</p>
              <h3>{needsAttentionClass.className}</h3>
              <p>GPA {needsAttentionClass.gpa.toFixed(2)}</p>
            </article>
          </div>

          <h3 className="admin-list-gap pt-5">Average GPA by Class</h3>
          <svg
            className="class-performance-chart"
            viewBox={`0 0 440 ${classPerformance.length * 36 + 10}`}
            role="img"
            aria-label="Average GPA by class"
          >
            {classPerformance.map((item, index) => {
              const barWidth = (item.gpa / maxGpa) * 280
              const y = index * 36
              return (
                <g key={item.className}>
                  <text x="0" y={y + 18} className="chart-label">
                    {item.className}
                  </text>
                  <rect x="90" y={y + 6} width={barWidth} height="20" rx="4" className="chart-bar" />
                  <text x={90 + barWidth + 8} y={y + 21} className="chart-value">
                    {item.gpa.toFixed(2)}
                  </text>
                </g>
              )
            })}
          </svg>
        </>
      )}

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
