import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'

function AdminStaffListPage() {
  const { staff, backendError, removeStaff } = useData()
  const confirm = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const [rowBusy, setRowBusy] = useState({})
  const [rowError, setRowError] = useState({})

  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return staff
    return staff.filter(
      (member) => member.name.toLowerCase().includes(term) || member.designation?.toLowerCase().includes(term),
    )
  }, [staff, searchTerm])

  async function handleDelete(id) {
    if (!(await confirm('Delete this staff member? This cannot be undone.', { danger: true }))) return

    setRowBusy((prev) => ({ ...prev, [id]: true }))
    setRowError((prev) => ({ ...prev, [id]: null }))

    try {
      await removeStaff(id)
    } catch (error) {
      setRowError((prev) => ({ ...prev, [id]: error.message }))
      setRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Staffs</p>
      <h2>Office Staff</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <div className="finance-filter-row">
        <label htmlFor="staff-search">Search:</label>
        <input
          id="staff-search"
          type="search"
          placeholder="Name or designation"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {staff.length === 0 && <div className="empty-state">No office staff added yet.</div>}

      <div className="teachers-grid admin-list-gap">
        {filteredStaff.map((member) => (
          <article key={member.id} className="teacher-card">
            <img src={member.photoUrl} alt={member.name} />
            <h3>{member.name}</h3>
            <p className="subject-pill">{member.designation}</p>
            <p>{member.phone}</p>

            <div className="card-actions">
              <Link className="cta-btn" to={`/admin/dashboard/staff/${member.id}/edit`}>
                Edit
              </Link>
              <button
                type="button"
                className="cta-btn danger-btn"
                disabled={rowBusy[member.id]}
                onClick={() => handleDelete(member.id)}
              >
                {rowBusy[member.id] ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {rowError[member.id] && <p className="error-text">{rowError[member.id]}</p>}
          </article>
        ))}
        {filteredStaff.length === 0 && staff.length > 0 && <div className="empty-state">No staff match this filter.</div>}
      </div>
    </section>
  )
}

export default AdminStaffListPage
