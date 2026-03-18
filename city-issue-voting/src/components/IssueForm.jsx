import { useState } from 'react'

const CATEGORIES = ['Roads', 'Sanitation', 'Lighting', 'Safety', 'Drainage', 'Parks', 'Water', 'Other']

export default function IssueForm({ onSubmit, onCancel }) {
  const [title,    setTitle]    = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Roads')
  const [image,    setImage]    = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [errors,   setErrors]   = useState({})

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const e = {}
    if (!title.trim())    e.title    = 'Title is required'
    if (!location.trim()) e.location = 'Location is required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({ title: title.trim(), location: location.trim(), category, image: preview })
  }

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      <div className="form-group">
        <label>Issue Title *</label>
        <input
          className={`input ${errors.title ? 'error' : ''}`}
          placeholder="e.g. Pothole on 5th Avenue"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
        />
        {errors.title && <span className="error-msg">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label>Location *</label>
        <input
          className={`input ${errors.location ? 'error' : ''}`}
          placeholder="e.g. Main Street, Block 4"
          value={location}
          onChange={(e) => { setLocation(e.target.value); setErrors(p => ({ ...p, location: '' })) }}
        />
        {errors.location && <span className="error-msg">{errors.location}</span>}
      </div>

      <div className="form-group">
        <label>Category</label>
        <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Image (optional)</label>
        <label className="file-upload">
          📷 {image ? image.name : 'Choose image'}
          <input type="file" accept="image/*" onChange={handleImage} hidden />
        </label>
        {preview && <img src={preview} alt="preview" className="img-preview" />}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Submit Issue</button>
      </div>
    </form>
  )
}
