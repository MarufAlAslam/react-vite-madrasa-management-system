import { useMemo, useRef, useState } from 'react'
import { useConfirm } from '../../context/ConfirmContext'
import { useData } from '../../context/DataContext'

function groupIntoAlbums(gallery) {
  const map = new Map()
  gallery.forEach((item) => {
    const key = item.albumTitle || `legacy:${item.title || item.id}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    albumTitle: items[0].albumTitle || '',
    displayTitle: items[0].albumTitle || items[0].title || 'Untitled',
    items,
    featured: items.some((item) => item.featured),
    isLegacy: !items[0].albumTitle,
  }))
}

function AdminGalleryPage() {
  const { gallery, backendError, addGalleryAlbum, editGalleryAlbum, removeGalleryAlbum, removeGalleryItem } = useData()
  const confirm = useConfirm()

  const [albumTitle, setAlbumTitle] = useState('')
  const [featured, setFeatured] = useState(false)
  const [photos, setPhotos] = useState([])
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const photosInputRef = useRef(null)

  const [renameDrafts, setRenameDrafts] = useState({})
  const [addPhotosDrafts, setAddPhotosDrafts] = useState({})
  const [albumBusy, setAlbumBusy] = useState({})
  const [albumError, setAlbumError] = useState({})
  const [imageBusy, setImageBusy] = useState({})

  const albums = useMemo(() => groupIntoAlbums(gallery), [gallery])

  async function handleCreateAlbum(event) {
    event.preventDefault()

    if (!albumTitle.trim()) {
      setFormError('Album title is required.')
      return
    }
    if (photos.length === 0) {
      setFormError('Choose at least one photo.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const formData = new FormData()
      formData.append('albumTitle', albumTitle.trim())
      formData.append('featured', String(featured))
      photos.forEach((file) => formData.append('photos', file))

      await addGalleryAlbum(formData)
      setAlbumTitle('')
      setFeatured(false)
      setPhotos([])
      if (photosInputRef.current) photosInputRef.current.value = ''
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleFeatured(album) {
    setAlbumBusy((prev) => ({ ...prev, [album.key]: true }))
    setAlbumError((prev) => ({ ...prev, [album.key]: null }))
    try {
      await editGalleryAlbum(album.albumTitle, { featured: !album.featured })
    } catch (error) {
      setAlbumError((prev) => ({ ...prev, [album.key]: error.message }))
    } finally {
      setAlbumBusy((prev) => ({ ...prev, [album.key]: false }))
    }
  }

  async function handleRename(album) {
    const nextTitle = (renameDrafts[album.key] ?? album.displayTitle).trim()
    if (!nextTitle || nextTitle === album.albumTitle) return

    setAlbumBusy((prev) => ({ ...prev, [album.key]: true }))
    setAlbumError((prev) => ({ ...prev, [album.key]: null }))
    try {
      await editGalleryAlbum(album.albumTitle, { albumTitle: nextTitle })
      setRenameDrafts((prev) => {
        const next = { ...prev }
        delete next[album.key]
        return next
      })
    } catch (error) {
      setAlbumError((prev) => ({ ...prev, [album.key]: error.message }))
    } finally {
      setAlbumBusy((prev) => ({ ...prev, [album.key]: false }))
    }
  }

  async function handleDeleteAlbum(album) {
    if (
      !(await confirm(`Delete the "${album.displayTitle}" album and all ${album.items.length} photo(s) in it?`, {
        danger: true,
      }))
    ) {
      return
    }

    setAlbumBusy((prev) => ({ ...prev, [album.key]: true }))
    setAlbumError((prev) => ({ ...prev, [album.key]: null }))
    try {
      await removeGalleryAlbum(album.albumTitle)
    } catch (error) {
      setAlbumError((prev) => ({ ...prev, [album.key]: error.message }))
      setAlbumBusy((prev) => ({ ...prev, [album.key]: false }))
    }
  }

  async function handleAddPhotos(album) {
    const files = addPhotosDrafts[album.key]
    if (!files || files.length === 0) return

    setAlbumBusy((prev) => ({ ...prev, [album.key]: true }))
    setAlbumError((prev) => ({ ...prev, [album.key]: null }))
    try {
      const formData = new FormData()
      formData.append('albumTitle', album.albumTitle)
      formData.append('featured', String(album.featured))
      files.forEach((file) => formData.append('photos', file))

      await addGalleryAlbum(formData)
      setAddPhotosDrafts((prev) => {
        const next = { ...prev }
        delete next[album.key]
        return next
      })
    } catch (error) {
      setAlbumError((prev) => ({ ...prev, [album.key]: error.message }))
    } finally {
      setAlbumBusy((prev) => ({ ...prev, [album.key]: false }))
    }
  }

  async function handleDeleteImage(imageId) {
    if (!(await confirm('Delete this photo? This cannot be undone.', { danger: true }))) return

    setImageBusy((prev) => ({ ...prev, [imageId]: true }))
    try {
      await removeGalleryItem(imageId)
    } catch (error) {
      setImageBusy((prev) => ({ ...prev, [imageId]: false }))
      window.alert(error.message)
    }
  }

  return (
    <section className="panel">
      <p className="section-eyebrow">Update Gallery</p>
      <h2>Gallery Manager</h2>
      <p className="helper-text">
        Create an album, upload one or more photos to it, and mark it Featured to show it on the public Gallery page.
      </p>

      {backendError && <p className="error-text">Could not reach the data server: {backendError}</p>}

      <form className="admin-form" onSubmit={handleCreateAlbum}>
        <input
          type="text"
          placeholder="Album title"
          value={albumTitle}
          onChange={(event) => setAlbumTitle(event.target.value)}
        />
        <label className="file-input-label">
          <span>Photos (you can select multiple)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            ref={photosInputRef}
            onChange={(event) => setPhotos(Array.from(event.target.files || []))}
          />
        </label>
        <label className="checkbox-inline">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
          Featured (shows on the public Gallery page)
        </label>
        {formError && <p className="error-text">{formError}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Album'}
        </button>
      </form>

      {albums.length === 0 && <div className="empty-state">No gallery albums yet.</div>}

      <div className="gallery-album-list admin-list-gap">
        {albums.map((album) => {
          const busy = Boolean(albumBusy[album.key])

          return (
            <article key={album.key} className="gallery-album-card">
              <div className="gallery-album-header">
                {album.isLegacy ? (
                  <h3>{album.displayTitle}</h3>
                ) : (
                  <input
                    type="text"
                    className="inline-edit-input"
                    value={renameDrafts[album.key] ?? album.displayTitle}
                    onChange={(event) => setRenameDrafts((prev) => ({ ...prev, [album.key]: event.target.value }))}
                    onBlur={() => handleRename(album)}
                    aria-label="Album title"
                  />
                )}
                {album.featured && <span className="subject-pill featured-badge">Featured</span>}
                {album.isLegacy && <span className="subject-pill">Legacy photo</span>}
              </div>

              <div className="gallery-album-grid">
                {album.items.map((item, index) => (
                  <div className="gallery-album-thumb" key={item.id}>
                    <img src={item.photoUrl} alt={`${album.displayTitle}-img-${index + 1}`} />
                    <button
                      type="button"
                      className="thumb-delete-btn"
                      disabled={Boolean(imageBusy[item.id])}
                      onClick={() => handleDeleteImage(item.id)}
                      aria-label="Delete photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {albumError[album.key] && <p className="error-text">{albumError[album.key]}</p>}

              {!album.isLegacy && (
                <div className="gallery-manage-actions">
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={album.featured}
                      disabled={busy}
                      onChange={() => handleToggleFeatured(album)}
                    />
                    Featured
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) =>
                      setAddPhotosDrafts((prev) => ({ ...prev, [album.key]: Array.from(event.target.files || []) }))
                    }
                  />
                  <button type="button" disabled={busy || !addPhotosDrafts[album.key]?.length} onClick={() => handleAddPhotos(album)}>
                    {busy ? 'Working...' : 'Add Photos'}
                  </button>
                  <button type="button" className="danger-btn" disabled={busy} onClick={() => handleDeleteAlbum(album)}>
                    {busy ? 'Working...' : 'Delete Album'}
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AdminGalleryPage
