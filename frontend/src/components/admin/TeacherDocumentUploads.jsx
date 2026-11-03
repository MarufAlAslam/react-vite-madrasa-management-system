import { MAX_DOCUMENT_SIZE_MB, TEACHER_DOCUMENTS } from '../../constants/admin'

// `files` / `removed` are keyed by document field; `teacher` (edit only) supplies the already-uploaded links.
function TeacherDocumentUploads({ teacher, files, setFiles, removed = {}, setRemoved }) {
  function chooseFile(field, file) {
    if (file && file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
      window.alert(`${file.name} is larger than ${MAX_DOCUMENT_SIZE_MB} MB.`)
      return false
    }
    setFiles((prev) => ({ ...prev, [field]: file }))
    return true
  }

  return (
    <>
      {TEACHER_DOCUMENTS.map(({ field, label }) => {
        const existingUrl = teacher?.[`${field}Url`]
        const isRemoved = Boolean(removed[field])

        return (
          <label className="file-input-label" key={field}>
            <span>
              {label} (PDF or image, optional)
              {existingUrl && !files[field] && !isRemoved && (
                <>
                  {' '}
                  — <a href={existingUrl} target="_blank" rel="noreferrer">View current</a>
                  {setRemoved && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => setRemoved((prev) => ({ ...prev, [field]: true }))}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </>
              )}
              {isRemoved && ' — will be removed on save'}
            </span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files[0] || null
                if (!chooseFile(field, file)) event.target.value = ''
                else if (file && setRemoved) setRemoved((prev) => ({ ...prev, [field]: false }))
              }}
            />
          </label>
        )
      })}
    </>
  )
}

export default TeacherDocumentUploads
