const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token')
  
  // Check if body is FormData to avoid setting Content-Type
  const isFormData = options.body instanceof FormData
  
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('API Error:', res.status, data)
    const message = data?.error || `Request failed with status ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

export function setSession(token, user) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getUser() {
  const raw = localStorage.getItem('user')
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}


