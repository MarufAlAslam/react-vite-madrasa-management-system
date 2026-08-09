import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'

function groupFeaturedAlbums(gallery) {
  const featured = gallery.filter((item) => item.featured)
  const map = new Map()
  featured.forEach((item) => {
    const key = item.albumTitle || item.title || 'Untitled'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return Array.from(map.entries()).map(([albumTitle, items]) => ({ albumTitle, items }))
}

function GalleryPage() {
  const { gallery, loading } = useData()
  const [selectedImage, setSelectedImage] = useState(null)

  const albums = useMemo(() => groupFeaturedAlbums(gallery), [gallery])

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Gallery</p>
        <h2>See Our Featured Albums</h2>

        {loading && <div className="empty-state">Loading gallery...</div>}
        {!loading && albums.length === 0 && <div className="empty-state">No featured albums yet.</div>}
      </section>

      {!loading &&
        albums.map((album) => (
          <section className="panel" key={album.albumTitle}>
            <h3>{album.albumTitle}</h3>
            <div className="gallery-grid">
              {album.items.map((item, index) => {
                const alt = `${album.albumTitle}-img-${index + 1}`
                return (
                  <button
                    type="button"
                    className="gallery-card"
                    key={item.id}
                    onClick={() => setSelectedImage({ ...item, alt })}
                    aria-label={`Open ${alt}`}
                  >
                    <img src={item.photoUrl} alt={alt} loading="lazy" />
                  </button>
                )
              })}
            </div>
          </section>
        ))}

      {selectedImage &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
            <article className="modal-panel image-modal" onClick={(event) => event.stopPropagation()}>
              <img src={selectedImage.photoUrl} alt={selectedImage.alt} />
              <button type="button" onClick={() => setSelectedImage(null)}>
                Close
              </button>
            </article>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default GalleryPage
