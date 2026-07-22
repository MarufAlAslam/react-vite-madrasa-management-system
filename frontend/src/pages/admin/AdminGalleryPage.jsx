import { useRef, useState } from 'react'
import { useData } from '../../context/DataContext'

function AdminGalleryPage() {
  const { gallery, backendError, addGalleryItem, editGalleryItem, removeGalleryItem } = useData()

  const [galleryForm, setGalleryForm] = useState({ title: '' })
  const [galleryPhoto, setGalleryPhoto] = useState(null)
  const [galleryFormError, setGalleryFormError] = useState(null)
  const [gallerySubmitting, setGallerySubmitting] = useState(false)
  const galleryPhotoInputRef = useRef(null)

  const [galleryEdits, setGalleryEdits] = useState({})
  const [galleryEditPhotos, setGalleryEditPhotos] = useState({})
  const [galleryRowErrors, setGalleryRowErrors] = useState({})
  const [galleryRowBusy, setGalleryRowBusy] = useState({})

  async function handleGallerySubmit(event) {
    event.preventDefault()

    if (!galleryPhoto) {
      setGalleryFormError('Please choose a photo to upload.')
      return
    }

    setGallerySubmitting(true)
    setGalleryFormError(null)

    try {
      const formData = new FormData()
      formData.append('title', galleryForm.title)
      formData.append('photo', galleryPhoto)

      await addGalleryItem(formData)
      setGalleryForm({ title: '' })
      setGalleryPhoto(null)
      if (galleryPhotoInputRef.current) galleryPhotoInputRef.current.value = ''
    } catch (error) {
      setGalleryFormError(error.message)
    } finally {
      setGallerySubmitting(false)
    }
  }

  function handleGalleryFieldChange(id, field, value, currentItem) {
    setGalleryEdits((prev) => ({
      ...prev,
      [id]: {
        title: prev[id]?.title ?? currentItem.title,
        [field]: value,
      },
    }))
  }

  function handleGalleryEditPhotoChange(id, file) {
    setGalleryEditPhotos((prev) => ({ ...prev, [id]: file }))
  }

  async function handleGalleryUpdate(id, currentItem) {
    const title = galleryEdits[id]?.title ?? currentItem.title

    setGalleryRowBusy((prev) => ({ ...prev, [id]: true }))
    setGalleryRowErrors((prev) => ({ ...prev, [id]: null }))

    try {
      const formData = new FormData()
      formData.append('title', title)
      if (galleryEditPhotos[id]) {
        formData.append('photo', galleryEditPhotos[id])
      }

      await editGalleryItem(id, formData)
      setGalleryEdits((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setGalleryEditPhotos((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      setGalleryRowErrors((prev) => ({ ...prev, [id]: error.message }))
    } finally {
      setGalleryRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  async function handleGalleryDelete(id) {
    if (!window.confirm('Delete this gallery photo? This cannot be undone.')) return

    setGalleryRowBusy((prev) => ({ ...prev, [id]: true }))
    setGalleryRowErrors((prev) => ({ ...prev, [id]: null }))

    try {
      await removeGalleryItem(id)
      setGalleryEdits((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      setGalleryRowErrors((prev) => ({ ...prev, [id]: error.message }))
      setGalleryRowBusy((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Update Gallery</p>
      <h2>Gallery Manager</h2>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleGallerySubmit}>
        <input
          type="text"
          placeholder="Image title"
          value={galleryForm.title}
          onChange={(event) => setGalleryForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <label className="file-input-label">
          <span>Photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={galleryPhotoInputRef}
            onChange={(event) => setGalleryPhoto(event.target.files[0] || null)}
            required
          />
        </label>
        {galleryFormError && <p className="error-text">{galleryFormError}</p>}
        <button type="submit" disabled={gallerySubmitting}>
          {gallerySubmitting ? 'Adding...' : 'Add to Gallery'}
        </button>
      </form>

      <div className="admin-gallery-list admin-list-gap">
        {gallery.map((item) => {
          const edited = galleryEdits[item.id]
          const busy = Boolean(galleryRowBusy[item.id])

          return (
            <article className="gallery-manage-card" key={item.id}>
              <img
                src={galleryEditPhotos[item.id] ? URL.createObjectURL(galleryEditPhotos[item.id]) : item.photoUrl}
                alt={item.title}
              />
              <div className="gallery-manage-fields">
                <input
                  type="text"
                  value={edited?.title ?? item.title}
                  onChange={(event) => handleGalleryFieldChange(item.id, 'title', event.target.value, item)}
                  className="inline-edit-input"
                  aria-label="Edit gallery title"
                />
                <label className="file-input-label">
                  <span>Replace photo (optional)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => handleGalleryEditPhotoChange(item.id, event.target.files[0] || null)}
                  />
                </label>
                {galleryRowErrors[item.id] && <p className="error-text">{galleryRowErrors[item.id]}</p>}
                <div className="gallery-manage-actions">
                  <button type="button" disabled={busy} onClick={() => handleGalleryUpdate(item.id, item)}>
                    {busy ? 'Saving...' : 'Save Update'}
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    disabled={busy}
                    onClick={() => handleGalleryDelete(item.id)}
                  >
                    {busy ? 'Working...' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AdminGalleryPage
