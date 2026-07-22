import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'

function GalleryPage() {
  const { gallery, loading } = useData()
  const [selectedImage, setSelectedImage] = useState(null)

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="section-eyebrow">Gallery</p>
        <h2>Islamic Campus Moments</h2>

        {loading && <div className="empty-state">Loading gallery...</div>}
        {!loading && gallery.length === 0 && (
          <div className="empty-state">No gallery photos added yet.</div>
        )}

        {!loading && gallery.length > 0 && (
          <div className="gallery-grid">
            {gallery.map((item) => (
              <button
                type="button"
                className="gallery-card"
                key={item.id}
                onClick={() => setSelectedImage(item)}
                aria-label={`Open ${item.title}`}
              >
                <img src={item.photoUrl} alt={item.title} loading="lazy" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedImage &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
            <article className="modal-panel image-modal" onClick={(event) => event.stopPropagation()}>
              <img src={selectedImage.photoUrl} alt={selectedImage.title} />
              <h3>{selectedImage.title}</h3>
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
