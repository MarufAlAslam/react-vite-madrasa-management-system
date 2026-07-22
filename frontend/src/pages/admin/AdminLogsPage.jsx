import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getLogs } from '../../services/backendApi'

function AdminLogsPage() {
  const { token } = useAuth()
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState(null)

  useEffect(() => {
    getLogs(token)
      .then(setLogs)
      .catch((error) => setLogsError(error.message))
      .finally(() => setLogsLoading(false))
  }, [token])

  return (
    <section className="panel">
      <p className="section-eyebrow">Activity Log</p>
      <h2>Who Did What</h2>

      {logsLoading && <div className="empty-state">Loading activity log...</div>}
      {logsError && <p className="error-text">{logsError}</p>}
      {!logsLoading && !logsError && logs.length === 0 && <div className="empty-state">No activity recorded yet.</div>}

      <div className="notice-vertical-list admin-list-gap">
        {logs.map((entry) => (
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
    </section>
  )
}

export default AdminLogsPage
