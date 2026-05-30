import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    const msg = err.response?.data?.error || err.response?.data?.message || '请求失败'
    toast.error(msg)
    return Promise.reject(err)
  }
)

export default api

export const authApi = {
  register: (data: { phone: string; password: string; nickname: string; grade_level: string }) =>
    api.post('/auth/register', data),
  login: (data: { phone: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: FormData | Record<string, string>) =>
    api.put('/auth/profile', data),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put('/auth/password', data),
}

export const mistakeApi = {
  create: (data: FormData) => api.post('/mistakes', data),
  getList: (params: Record<string, string | number>) =>
    api.get('/mistakes', { params }),
  getById: (id: string) => api.get(`/mistakes/${id}`),
  update: (id: string, data: FormData) => api.put(`/mistakes/${id}`, data),
  remove: (id: string) => api.delete(`/mistakes/${id}`),
  batchRemove: (ids: string[]) =>
    api.post('/mistakes/batch-delete', { ids }),
  analyze: (id: string) => api.post(`/mistakes/${id}/analyze`),
  generateVariants: (id: string) => api.post(`/mistakes/${id}/variants`),
  markMastered: (id: string) => api.post(`/mistakes/${id}/mark-mastered`),
}

export const subjectApi = {
  getAll: () => api.get('/subjects'),
  create: (data: { name: string; icon?: string }) =>
    api.post('/subjects', data),
  update: (id: string, data: { name: string; icon?: string }) =>
    api.put(`/subjects/${id}`, data),
  remove: (id: string) => api.delete(`/subjects/${id}`),
  getChapters: (subjectId: string) =>
    api.get(`/subjects/${subjectId}/chapters`),
  createChapter: (subjectId: string, data: { name: string; parent_id?: string }) =>
    api.post(`/subjects/${subjectId}/chapters`, data),
}

export const tagApi = {
  getAll: () => api.get('/tags'),
  create: (data: { name: string; color?: string }) =>
    api.post('/tags', data),
  update: (id: string, data: { name: string; color?: string }) =>
    api.put(`/tags/${id}`, data),
  remove: (id: string) => api.delete(`/tags/${id}`),
}

export const reviewApi = {
  getToday: () => api.get('/review/today'),
  complete: (id: string, feedback: string) =>
    api.post(`/review/${id}/complete`, { feedback }),
  getSchedule: () => api.get('/review/schedule'),
}

export const statsApi = {
  getSummary: () => api.get('/stats/summary'),
  getTrend: (params?: { period?: string; subject_id?: string }) =>
    api.get('/stats/trend', { params }),
  getErrorTypes: (params?: { subject_id?: string }) =>
    api.get('/stats/error-types', { params }),
  getKnowledgeWeakness: (params?: { subject_id?: string }) =>
    api.get('/stats/knowledge-weakness', { params }),
}

export const variantApi = {
  getById: (id: string) => api.get(`/variants/${id}`),
  submitAnswer: (id: string, my_answer: string) =>
    api.post(`/variants/${id}/answer`, { my_answer }),
}

export const ocrApi = {
  recognize: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return api.post('/ocr/recognize', form)
  },
}
