import { useState, lazy, Suspense } from 'react'

// Lazy-load the map to avoid SSR issues and keep initial bundle small
const LocationPicker = lazy(() => import('./LocationPicker'))

const CATEGORIES = ['ROAD', 'WATER', 'ELECTRICITY', 'SANITATION', 'PARKS', 'SAFETY', 'OTHER']
const ALL_TAGS   = ['Road', 'Water', 'Electricity', 'Sanitation', 'Parks', 'Safety', 'Other']

export default function IssueForm({ onSubmit, onCancel }) {
  const [title,    setTitle]    = useState('')
  const [locData,  setLocData]  = useState(null)  // { lat, lng, location, area }
  const [category, setCategory] = useState('ROAD')
  const [images,   setImages]   = useState([])
  const [tags,     setTags]     = useState([])
  const [errors,   setErrors]   = useState({})

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length)
    const newImgs = files.map(f => ({ file: f, url: URL.createObjectURL(f) }))
    setImages(prev => [...prev, ...newImgs].slice(0, 5))
  }

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))

  const toggleTag = (tag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const validate = () => {
    const e = {}
    if (!title.trim())       e.title    = 'Title is required'
    if (!locData?.location)  e.location = 'Pin a location on the map'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      title:      title.trim(),
      location:   locData.location,
      lat:        locData.lat,
      lng:        locData.lng,
      category,
      tags,
      imageFiles: images.map(i => i.file),
      images:     images.map(i => i.url),
      image:      images[0]?.url || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      {/* Title */}
      <div className="form-group">
        <label>Issue Title *</label>
        <input className={`input ${errors.title ? 'error' : ''}`}
          placeholder="e.g. Pothole on 5th Avenue" value={title}
          onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }} />
        {errors.title && <span className="error-msg">{errors.title}</span>}
      </div>

      {/* Map Location Picker */}
      <div className="form-group">
        <label>Pin Location * <span style={{ color: 'var(--muted2)', textTransform: 'none', fontWeight: 400 }}>— drag pin or click map</span></label>
        <Suspense fallback={<div className="map-loading">Loading map…</div>}>
          <LocationPicker
            value={locData}
            onChange={(data) => { setLocData(data); setErrors(p => ({ ...p, location: '' })) }}
          />
        </Suspense>
        {errors.location && <span className="error-msg">{errors.location}</span>}
      </div>

      {/* Category */}
      <div className="form-group">
        <label>Category</label>
        <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {/* Tags */}
      <div className="form-group">
        <label>Tags</label>
        <div className="tag-row">
          {ALL_TAGS.map(t => (
            <button key={t} type="button"
              className={`tag-chip-btn ${tags.includes(t) ? 'active' : ''}`}
              onClick={() => toggleTag(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="form-group">
        <label>Images (up to 5)</label>
        {images.length < 5 && (
          <label className="file-upload">
            📷 Add images ({images.length}/5)
            <input type="file" accept="image/*" multiple onChange={handleImages} hidden />
          </label>
        )}
        {images.length > 0 && (
          <div className="thumb-strip">
            {images.map((img, i) => (
              <div key={i} className="thumb-wrap">
                <img src={img.url} alt={`img ${i+1}`} className="thumb" />
                <button type="button" className="thumb-remove" onClick={() => removeImage(i)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Submit Issue</button>
      </div>
    </form>
  )
}
