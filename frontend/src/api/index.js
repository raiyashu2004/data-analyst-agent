import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({ baseURL: BASE, timeout: 30000 })

// Spring Boot wraps responses: { success, message, data }
api.interceptors.response.use(
  (response) => {
    if (response.data && 'data' in response.data && 'success' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  (error) => Promise.reject(error)
)

export const uploadFile = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const loadSample = (key) => api.get(`/sample/${key}`)

export const startAnalysis = (sessionId, question, provider) => {
  const url = `${BASE}/analyze?session_id=${encodeURIComponent(sessionId)}&question=${encodeURIComponent(question)}&provider=${provider}`
  return new EventSource(url)
}
