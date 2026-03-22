import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('token')
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Students
export const studentsAPI = {
  getAll: (params?: object) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: FormData) => api.post('/students', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | object) => {
    const isFormData = data instanceof FormData
    return api.put(`/students/${id}`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
  },
  delete: (id: string) => api.delete(`/students/${id}`),
  exportCSV: () => api.get('/students/export/csv', { responseType: 'blob' }),
}

// Seats
export const seatsAPI = {
  getAll: () => api.get('/seats'),
  initialize: (totalSeats: number) => api.post('/seats/initialize', { totalSeats }),
  assign: (seatId: string, studentId: string) => api.put(`/seats/${seatId}/assign`, { studentId }),
  remove: (seatId: string) => api.put(`/seats/${seatId}/remove`),
}

// Payments
export const paymentsAPI = {
  getAll: (params?: object) => api.get('/payments', { params }),
  create: (data: object) => api.post('/payments', data),
  update: (id: string, data: object) => api.put(`/payments/${id}`, data),
  getMonthlyRevenue: () => api.get('/payments/monthly-revenue'),
  updateOverdue: () => api.post('/payments/update-overdue'),
}

// Attendance
export const attendanceAPI = {
  getAll: (params?: object) => api.get('/attendance', { params }),
  mark: (data: object) => api.post('/attendance/mark', data),
  bulkMark: (data: object) => api.post('/attendance/bulk', data),
  getQR: (studentId: string) => api.get(`/attendance/qr/${studentId}`),
  qrCheckin: (qrData: string) => api.post('/attendance/qr-checkin', { qrData }),
  getStats: (studentId: string, params?: object) => api.get(`/attendance/stats/${studentId}`, { params }),
}

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  sendReminder: (studentId: string, type?: string) => api.post('/notifications/send-reminder', { studentId, type }),
}
