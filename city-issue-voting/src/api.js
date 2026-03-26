const BASE = ''   // Vite proxies /auth, /issues etc. to localhost:4000

let _accessToken = null

export function setAccessToken(t) { _accessToken = t }
export function getAccessToken()  { return _accessToken }

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' })

  // auto-refresh on 401
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${_accessToken}`
      const retry = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' })
      if (!retry.ok) throw await retry.json()
      return retry.json()
    }
    _accessToken = null
    window.dispatchEvent(new Event('auth:logout'))
    throw { error: { code: 'UNAUTHENTICATED', message: 'Session expired' } }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Request failed' } }))
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

async function tryRefresh() {
  try {
    const data = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!data.ok) return false
    const json = await data.json()
    _accessToken = json.accessToken
    return true
  } catch { return false }
}

// ── Auth ──
export const auth = {
  login:     (email, password)  => request('/auth/login',      { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:  (email, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  logout:    ()                 => request('/auth/logout',     { method: 'POST' }),
  me:        ()                 => request('/auth/me'),
  refresh:   ()                 => tryRefresh(),
  otpSend:   (phone)            => request('/auth/otp/send',   { method: 'POST', body: JSON.stringify({ phone }) }),
  otpVerify: (phone, code)      => request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }),
}

// ── Issues ──
export const issues = {
  list: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, v))
    return request(`/issues?${q}`)
  },
  get:    (id)   => request(`/issues/${id}`),
  create: (data) => request('/issues', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id)   => request(`/issues/${id}`, { method: 'DELETE' }),
  flag:   (id, reason) => request(`/issues/${id}/flag`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

// ── Votes ──
export const votes = {
  cast: (issueId, value) => request(`/issues/${issueId}/vote`, { method: 'POST', body: JSON.stringify({ value }) }),
}

// ── Comments ──
export const comments = {
  list:   (issueId)              => request(`/issues/${issueId}/comments`),
  add:    (issueId, text, parentId) => request(`/issues/${issueId}/comments`, { method: 'POST', body: JSON.stringify({ text, parentId }) }),
  delete: (id)                   => request(`/comments/${id}`, { method: 'DELETE' }),
}

// ── Uploads ──
export const uploads = {
  presign: (filename, mimeType, size) => request('/uploads/presign', { method: 'POST', body: JSON.stringify({ filename, mimeType, size }) }),
  async uploadFile(file) {
    const { uploadUrl, objectKey, publicUrl } = await uploads.presign(file.name, file.type, file.size)
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    return { objectKey, publicUrl }
  },
}

// ── Admin ──
export const admin = {
  setStatus: (issueId, status, mlaId, note) =>
    request(`/admin/issues/${issueId}/status`, { method: 'PATCH', body: JSON.stringify({ status, mlaId, note }) }),
  getFlags:    ()   => request('/admin/flags'),
  dismissFlag: (id) => request(`/admin/flags/${id}/dismiss`, { method: 'PATCH' }),
  removeFlag:  (id) => request(`/admin/flags/${id}/remove`,  { method: 'PATCH' }),
  getUsers:    ()   => request('/admin/users'),
  setRole:     (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
}

// ── Leaderboard ──
export const leaderboard = {
  get: () => request('/leaderboard'),
}

// ── WebSocket ──
export function createWS(onMessage) {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
  const ws = new WebSocket(wsUrl)
  ws.onopen = () => {
    if (_accessToken) ws.send(JSON.stringify({ type: 'auth', token: _accessToken }))
  }
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch {}
  }
  ws.onerror = (e) => console.warn('[WS] error', e)
  return ws
}
