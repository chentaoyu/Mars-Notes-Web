import axios from 'axios'
import { ApiResponse, PaginatedResponse, Note, User } from '@note-book/shared'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: async (data: { email: string; password: string; name?: string }) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data)
    return response.data
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data)
    return response.data
  },
}

export const noteApi = {
  getNotes: async (params?: {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    search?: string
    notebookId?: string
    tagIds?: string
  }) => {
    const response = await api.get<PaginatedResponse<Note>>('/notes', { params })
    return response.data
  },
  getNote: async (id: string) => {
    const response = await api.get<ApiResponse<Note>>(`/notes/${id}`)
    return response.data
  },
  createNote: async (data: { title: string; content?: string; notebookId?: string; tagIds?: string[] }) => {
    const response = await api.post<ApiResponse<Note>>('/notes', data)
    return response.data
  },
  updateNote: async (id: string, data: { title?: string; content?: string; notebookId?: string; tagIds?: string[] }) => {
    const response = await api.put<ApiResponse<Note>>(`/notes/${id}`, data)
    return response.data
  },
  deleteNote: async (id: string) => {
    await api.delete(`/notes/${id}`)
  },
}

