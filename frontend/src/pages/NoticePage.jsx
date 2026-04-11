import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'

function NoticePage() {
  const { notices, loading } = useData()
  const [query, setQuery] = useState('')
  const [expandedNotice, setExpandedNotice] = useState(null)

  const filteredNotices = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    if (!normalized) return notices

    return notices.filter(
      (notice) =>
        notice.title.toLowerCase().includes(normalized) || notice.short.toLowerCase().includes(normalized),
    )
  }, [notices, query])

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-headline-row vertical">
          <div>
            <p className="section-eyebrow">Notification Board</p>
            <h2>Important Notices</h2>
          </div>
          <label className="search-wrap" htmlFor="notice-search">
            <span>Search Notices</span>
            <input
              id="notice-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type keyword..."
            />
          </label>
        </div>

        <div className="notice-vertical-list">
          {loading && <div className="empty-state">Loading notices...</div>}
          {!loading && filteredNotices.length === 0 && (
            <div className="empty-state">No notice found for your search.</div>
          )}
          {!loading &&
            filteredNotices.map((notice) => (
              <article key={notice.id} className="notice-row-card">
                <div>
                  <p className="notice-date">{notice.date}</p>
                  <h3>{notice.title}</h3>
                  <p>{notice.short}</p>
                </div>
                <button type="button" onClick={() => setExpandedNotice(notice)}>
                  Read More
                </button>
              </article>
            ))}
        </div>
      </section>

      {expandedNotice &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setExpandedNotice(null)}>
            <article className="modal-panel" onClick={(event) => event.stopPropagation()}>
              <p className="notice-date">{expandedNotice.date}</p>
              <h3>{expandedNotice.title}</h3>
              <p>{expandedNotice.full}</p>
              <button type="button" onClick={() => setExpandedNotice(null)}>
                Close
              </button>
            </article>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default NoticePage
