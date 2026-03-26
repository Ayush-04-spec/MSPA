import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Lightbox({ images, index, onClose, onNav }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft')  onNav(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onNav])

  return createPortal(
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>

      {images.length > 1 && (
        <button
          className="lightbox-nav left"
          onClick={e => { e.stopPropagation(); onNav(-1) }}
          aria-label="Previous"
        >‹</button>
      )}

      <img
        src={images[index]}
        alt={`Image ${index + 1}`}
        className="lightbox-img"
        onClick={e => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          className="lightbox-nav right"
          onClick={e => { e.stopPropagation(); onNav(1) }}
          aria-label="Next"
        >›</button>
      )}

      {images.length > 1 && (
        <div className="lightbox-dots">
          {images.map((_, i) => (
            <span
              key={i}
              className={`lightbox-dot ${i === index ? 'active' : ''}`}
              onClick={e => { e.stopPropagation(); onNav(i - index) }}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
