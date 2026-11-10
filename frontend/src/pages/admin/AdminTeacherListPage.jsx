import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TeacherCard from '../../components/common/TeacherCard'
import Pagination from '../../components/common/Pagination'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'
import { DESIGNATIONS, sortByDesignation } from '../../constants/admin'

const PAGE_SIZE = 9

function AdminTeacherListPage() {
  const { teachers, backendError, removeTeacher } = useData()
  const confirm = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const [designationFilter, setDesignationFilter] = useState('all')
  const [rowBusy, setRowBusy] = useState({})
  const [rowError, setRowError] = useState({})
  const [page, setPage] = useState(1)

  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = teachers.filter((teacher) => {
      const matchesDesignation = designationFilter === 'all' || teacher.designation === designationFilter
      const matchesSearch = !term || teacher.name.toLowerCase().includes(term) || teacher.subject?.toLowerCase().includes(term)
      return matchesDesignation && matchesSearch
    })
    return sortByDesignation(filtered)
  }, [teachers, designationFilter, searchTerm])

  const pageCount = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedTeachers = filteredTeachers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  async function handleDelete(id) {
    if (!(await confirm('Delete this teacher? This cannot be undone.', { danger: true }))) return

    setRowBusy((prev) => ({ ...prev, [id]: true }))
    setRowError((prev) => ({ ...prev, [id]: null }))

    try {
      await removeTeacher(id)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [id]: error.message }))
      setRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Teacher List</p>
      <h2>All Teachers</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="teacher-search">Search:</label>
        <input
          id="teacher-search"
          type="search"
          placeholder="Name or subject"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <label htmlFor="teacher-designation-filter">Designation:</label>
        <select
          id="teacher-designation-filter"
          value={designationFilter}
          onChange={(event) => setDesignationFilter(event.target.value)}
        >
          <option value="all">All designations</option>
          {DESIGNATIONS.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>
      </div>

      <div className="teachers-grid admin-list-gap">
        {pagedTeachers.map((teacher) => (
          <article key={teacher.id} className="teacher-card">
            <Link to={`/admin/dashboard/teachers/${teacher.id}`} className="teacher-card-link">
              <TeacherCard teacher={teacher} />
            </Link>
            <div className="card-actions">
              <Link className="cta-btn" to={`/admin/dashboard/teachers/${teacher.id}/edit`}>
                Edit
              </Link>
              <button
                type="button"
                className="cta-btn danger-btn"
                disabled={rowBusy[teacher.id]}
                onClick={() => handleDelete(teacher.id)}
              >
                {rowBusy[teacher.id] ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {rowError[teacher.id] && <p className="error-text">{rowError[teacher.id]}</p>}
          </article>
        ))}
        {filteredTeachers.length === 0 && <div className="empty-state">No teachers match this filter.</div>}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </section>
  )
}

export default AdminTeacherListPage
