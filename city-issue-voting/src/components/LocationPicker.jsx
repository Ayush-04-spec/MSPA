import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Custom Royal Blue SVG pin icon ──
const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
  <defs>
    <radialGradient id="g" cx="40%" cy="30%">
      <stop offset="0%" stop-color="#7aa3f5"/>
      <stop offset="100%" stop-color="#2a55c8"/>
    </radialGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#4A78E0" flood-opacity="0.5"/>
    </filter>
  </defs>
  <circle cx="16" cy="16" r="14" fill="url(#g)" filter="url(#shadow)" stroke="#F4F6FA" stroke-width="1.5"/>
  <circle cx="16" cy="16" r="5" fill="#F4F6FA" opacity="0.9"/>
  <line x1="16" y1="30" x2="16" y2="44" stroke="#4A78E0" stroke-width="2.5" stroke-linecap="round"/>
</svg>`

const pinIcon = L.divIcon({
  html: PIN_SVG,
  className: '',
  iconSize:   [32, 44],
  iconAnchor: [16, 44],
  popupAnchor:[0, -44],
})

const pinDraggingIcon = L.divIcon({
  html: PIN_SVG.replace('dy="4"', 'dy="10"').replace('flood-opacity="0.5"', 'flood-opacity="0.8"'),
  className: 'pin-dragging',
  iconSize:   [32, 44],
  iconAnchor: [16, 48],  // slightly higher = "hovering"
  popupAnchor:[0, -48],
})

// ── Reverse geocode via Nominatim (free, no key needed) ──
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || a.town || a.city || 'Unknown Area'
    const road = a.road || a.pedestrian || a.footway || ''
    return { area, road, display: road ? `${road}, ${area}` : area, full: data.display_name }
  } catch {
    return { area: 'Unknown', road: '', display: 'Location selected', full: '' }
  }
}

// ── Sonar pulse component ──
function SonarPulse({ position }) {
  const map = useMap()
  const [point, setPoint] = useState(null)

  useEffect(() => {
    if (!position) return
    const p = map.latLngToContainerPoint(position)
    setPoint(p)
    const timer = setTimeout(() => setPoint(null), 2200)
    return () => clearTimeout(timer)
  }, [position, map])

  if (!point) return null
  return (
    <div style={{ position: 'absolute', left: point.x, top: point.y, zIndex: 1000, pointerEvents: 'none', transform: 'translate(-50%,-50%)' }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="sonar-ring" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}
    </div>
  )
}

// ── Draggable marker with floating label ──
function DraggableMarker({ position, onMove, label, scanning }) {
  const [dragging, setDragging] = useState(false)
  const markerRef = useRef(null)

  const eventHandlers = {
    dragstart() { setDragging(true) },
    async dragend() {
      setDragging(false)
      const m = markerRef.current
      if (m) {
        const { lat, lng } = m.getLatLng()
        // haptic thud on PWA
        if (navigator.vibrate) navigator.vibrate([40, 20, 60])
        onMove(lat, lng)
      }
    },
  }

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={dragging ? pinDraggingIcon : pinIcon}
      draggable
      eventHandlers={eventHandlers}
    >
      {/* Floating glassmorphic label */}
      <div className="pin-label-wrap" style={{
        position: 'absolute', bottom: 52, left: '50%',
        transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 1000,
      }}>
        <div className={`pin-label ${scanning ? 'pin-label-scanning' : ''}`}>
          {scanning ? '⟳ Scanning…' : label || 'Drag to adjust'}
        </div>
      </div>
    </Marker>
  )
}

// ── Click-to-place handler ──
function ClickHandler({ onPlace }) {
  useMapEvents({ click(e) { onPlace(e.latlng.lat, e.latlng.lng) } })
  return null
}

// ── MLA assignment card ──
function MlaCard({ area, mlaName }) {
  return (
    <motion.div
      className="mla-assign-card"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      exit={{    y: 20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <span className="mla-assign-icon">📍</span>
      <div>
        <p className="mla-assign-area">Area identified: <strong>{area}</strong></p>
        <p className="mla-assign-mla">Assigning to MLA: <strong>{mlaName}</strong></p>
      </div>
      <span className="mla-assign-check">✓</span>
    </motion.div>
  )
}

// ── Main component ──
export default function LocationPicker({ value, onChange }) {
  const DEFAULT = { lat: 19.9975, lng: 73.7898 }
  const [pos,      setPos]      = useState(value?.lat ? { lat: value.lat, lng: value.lng } : DEFAULT)
  const [label,    setLabel]    = useState(value?.area || '')
  const [scanning, setScanning] = useState(false)
  const [sonarPos, setSonarPos] = useState(null)
  const [locating, setLocating] = useState(false)
  const [mlaInfo,  setMlaInfo]  = useState(null)
  const mapRef = useRef(null)

  const doGeocode = useCallback(async (lat, lng) => {
    setScanning(true)
    setMlaInfo(null)
    const geo = await reverseGeocode(lat, lng)
    setLabel(geo.display)
    setScanning(false)
    // Simulate MLA assignment (in production: POST to /api/mla-for-location)
    const mlas = ['Rajesh Kumar', 'Priya Sharma', 'Anil Mehta', 'Sunita Rao']
    setMlaInfo({ area: geo.area, mla: mlas[Math.floor(Math.random() * mlas.length)] })
    onChange?.({ lat, lng, location: geo.display, area: geo.area })
  }, [onChange])

  const handleMove = useCallback((lat, lng) => {
    setPos({ lat, lng })
    doGeocode(lat, lng)
  }, [doGeocode])

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setPos({ lat, lng })
        setSonarPos({ lat, lng })
        mapRef.current?.flyTo([lat, lng], 16, { duration: 1.2 })
        doGeocode(lat, lng)
        setLocating(false)
        if (navigator.vibrate) navigator.vibrate([30, 10, 30])
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div className="location-picker">
      {/* Detect button */}
      <button type="button" className="locate-btn" onClick={detectLocation} disabled={locating}>
        {locating
          ? <><span className="locate-spinner" /> Detecting…</>
          : <><span className="locate-icon">◎</span> Detect My Location</>
        }
      </button>

      {/* Map */}
      <div className="map-wrap">
        <MapContainer
          center={[pos.lat, pos.lng]}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <ClickHandler onPlace={handleMove} />
          <DraggableMarker position={[pos.lat, pos.lng]} onMove={handleMove} label={label} scanning={scanning} />
          {sonarPos && <SonarPulse position={sonarPos} />}
        </MapContainer>

        <div className="map-hint">Click map or drag pin to set location</div>
      </div>

      {/* MLA assignment card */}
      <AnimatePresence>
        {mlaInfo && <MlaCard area={mlaInfo.area} mlaName={mlaInfo.mla} />}
      </AnimatePresence>

      {/* Coordinates display */}
      {label && (
        <div className="location-display">
          <span className="location-display-icon">📍</span>
          <span className="location-display-text">{label}</span>
          <span className="location-display-coords">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</span>
        </div>
      )}
    </div>
  )
}
