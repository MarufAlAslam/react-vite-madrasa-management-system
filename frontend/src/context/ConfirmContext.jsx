import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setRequest({
        message,
        confirmLabel: options.confirmLabel || 'OK',
        cancelLabel: options.cancelLabel || 'Cancel',
        danger: Boolean(options.danger),
      })
    })
  }, [])

  function handleChoice(result) {
    resolverRef.current?.(result)
    resolverRef.current = null
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request &&
        createPortal(
          <div className="modal-backdrop" onClick={() => handleChoice(false)}>
            <article className="modal-panel confirm-modal" onClick={(event) => event.stopPropagation()}>
              <p>{request.message}</p>
              <div className="card-actions">
                <button
                  type="button"
                  className={request.danger ? 'danger-btn' : undefined}
                  onClick={() => handleChoice(true)}
                >
                  {request.confirmLabel}
                </button>
                <button type="button" onClick={() => handleChoice(false)}>
                  {request.cancelLabel}
                </button>
              </div>
            </article>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used inside ConfirmProvider')
  }
  return context
}
