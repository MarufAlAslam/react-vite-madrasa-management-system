import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../../components/common/Pagination'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'
import { getNextClass, sortStudents } from '../../constants/admin'

const PAGE_SIZE = 12

function AdminStudentListPage() {
  const { students, classes, backendError, bulkPromoteStudents } = useData()
  const confirm = useConfirm()
  const classNames = useMemo(() => classes.map((item) => item.className), [classes])

  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [promoteFromClass, setPromoteFromClass] = useState('')
  const [promoting, setPromoting] = useState(false)
  const [promoteError, setPromoteError] = useState(null)
  const [promoteMessage, setPromoteMessage] = useState(null)

  useEffect(() => {
    if (!promoteFromClass && classNames.length > 0) {
      setPromoteFromClass(classNames[0])
    }
  }, [classNames, promoteFromClass])

  const promoteToClass = getNextClass(classNames, promoteFromClass)

  const filteredStudents = useMemo(() => {
    const matching = students.filter((student) => {
      const matchesClass = classFilter === 'all' || student.className === classFilter
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !term || student.name.toLowerCase().includes(term) || String(student.roll).toLowerCase().includes(term)
      return matchesClass && matchesSearch
    })
    return sortStudents(matching, classNames)
  }, [students, classNames, classFilter, searchTerm])

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function handleBulkPromote() {
    if (!promoteToClass) return
    if (
      !(await confirm(
        `Promote every student currently in "${promoteFromClass}" to "${promoteToClass}"? This cannot be undone.`,
      ))
    ) {
      return
    }

    setPromoting(true)
    setPromoteError(null)
    setPromoteMessage(null)

    try {
      const result = await bulkPromoteStudents(promoteFromClass, promoteToClass)
      setPromoteMessage(`Promoted ${result.count} student(s) from ${promoteFromClass} to ${promoteToClass}.`)
    } catch (error) {
      setPromoteError(error.message)
    } finally {
      setPromoting(false)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Student List</p>
      <h2>All Students</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="panel finance-filter-row promote-panel">
        <label htmlFor="promote-from-class">Promote class:</label>
        <select id="promote-from-class" value={promoteFromClass} onChange={(event) => setPromoteFromClass(event.target.value)}>
          {classNames.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
        <button type="button" className="cta-btn" disabled={!promoteToClass || promoting} onClick={handleBulkPromote}>
          {promoting ? 'Promoting...' : promoteToClass ? `Promote all to ${promoteToClass}` : 'No next class'}
        </button>
      </div>
      {promoteError && <p className="error-text">{promoteError}</p>}
      {promoteMessage && <p className="helper-text">{promoteMessage}</p>}

      <div className="finance-filter-row">
        <label htmlFor="student-search">Search:</label>
        <input
          id="student-search"
          type="search"
          placeholder="Name or roll number"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <label htmlFor="student-class-filter">Class:</label>
        <select id="student-class-filter" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
          <option value="all">All classes</option>
          {classNames.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      <div className="teachers-grid admin-list-gap">
        {pagedStudents.map((student) => (
          <Link key={student.id} to={`/admin/dashboard/students/${student.id}`} className="teacher-card card-link">
            <img src={student.photoUrl} alt={student.name} />
            <h3>{student.name}</h3>
            <p className="subject-pill">{student.className}</p>
            <p>Roll: {student.roll}</p>
            <p>{student.contact}</p>
          </Link>
        ))}
        {filteredStudents.length === 0 && <div className="empty-state">No students match this filter.</div>}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </section>
  )
}

export default AdminStudentListPage
