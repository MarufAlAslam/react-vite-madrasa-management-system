import { useEffect, useMemo, useState } from 'react'
import Pagination from '../../components/common/Pagination'
import { useAuth } from '../../context/AuthContext'
import { getLogs } from '../../services/backendApi'

const PAGE_SIZE = 10

function AdminLogsPage() {
  const { token } = useAuth()
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState(null)
  const [adminFilter, setAdminFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getLogs(token)
      .then(setLogs)
      .catch((error) => setLogsError(error.message))
      .finally(() => setLogsLoading(false))
  }, [token])

  const adminNames = useMemo(() => [...new Set(logs.map((entry) => entry.adminName))].sort(), [logs])

  const filteredLogs = useMemo(() => {
    if (adminFilter === 'all') return logs
    return logs.filter((entry) => entry.adminName === adminFilter)
  }, [logs, adminFilter])

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <section className="panel">
      <p className="section-eyebrow">Activity Log</p>
      <h2>Who Did What</h2>

      {logsLoading && <div className="empty-state">Loading activity log...</div>}
      {logsError && <p className="error-text">{logsError}</p>}

      {!logsLoading && !logsError && logs.length > 0 && (
        <div className="finance-filter-row">
          <label htmlFor="log-admin-filter">Admin:</label>
          <select id="log-admin-filter" value={adminFilter} onChange={(event) => setAdminFilter(event.target.value)}>
            <option value="all">All admins</option>
            {adminNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!logsLoading && !logsError && logs.length === 0 && <div className="empty-state">No activity recorded yet.</div>}
      {!logsLoading && !logsError && logs.length > 0 && filteredLogs.length === 0 && (
        <div className="empty-state">No activity from this admin.</div>
      )}

      <div className="notice-vertical-list admin-list-gap">
        {pagedLogs.map((entry) => (
          <article key={entry.id} className="notice-row-card">
            <div>
              <p className="notice-date">{new Date(entry.timestamp).toLocaleString()}</p>
              <h3>
                {entry.adminName} &mdash; {entry.action}
              </h3>
              <p>{entry.details}</p>
            </div>
          </article>
        ))}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
    </section>
  )
}

export default AdminLogsPage
