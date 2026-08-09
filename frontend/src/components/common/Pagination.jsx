function range(start, end) {
  const items = []
  for (let value = start; value <= end; value += 1) items.push(value)
  return items
}

function getPageItems(current, total, siblingCount = 1) {
  const totalVisible = siblingCount * 2 + 5 // first + last + current + siblings + 2 ellipses

  if (total <= totalVisible) return range(1, total)

  const leftSibling = Math.max(current - siblingCount, 1)
  const rightSibling = Math.min(current + siblingCount, total)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < total - 1

  if (!showLeftDots && showRightDots) {
    const leftRange = range(1, 3 + siblingCount * 2)
    return [...leftRange, 'dots-right', total]
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = range(total - (3 + siblingCount * 2) + 1, total)
    return [1, 'dots-left', ...rightRange]
  }

  return [1, 'dots-left', ...range(leftSibling, rightSibling), 'dots-right', total]
}

function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null

  const items = getPageItems(page, pageCount)

  return (
    <div className="pagination-row">
      <button type="button" className="cta-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>

      <div className="pagination-pages">
        {items.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              className={`pagination-page-btn ${item === page ? 'is-active' : ''}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="pagination-dots">
              &hellip;
            </span>
          ),
        )}
      </div>

      <button type="button" className="cta-btn" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  )
}

export default Pagination
