import axios from 'axios'
import { ApiResponse, Note, User, Notebook, Tag } from '@shared/types'

// 支持通过环境变量配置 API 基础 URL，生产环境可以使用完整 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
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

// 全局logout回调，由AuthContext设置
let logoutCallback: (() => void) | null = null

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 调用logout回调以同步AuthContext状态
      if (logoutCallback) {
        logoutCallback()
      }
      // 延迟跳转，确保状态已更新
      setTimeout(() => {
        window.location.href = '/login'
      }, 0)
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
    tagIds?: string | string[]
  }) => {
    const queryParams: any = { ...params }
    if (queryParams.tagIds && Array.isArray(queryParams.tagIds)) {
      queryParams.tagIds = queryParams.tagIds.join(',')
    }
    const response = await api.get<ApiResponse<Note[]>>('/notes', { params: queryParams })
    return response.data
  },
  getNote: async (id: string) => {
    const response = await api.get<ApiResponse<Note>>(`/notes/${id}`)
    return response.data
  },
  createNote: async (data: { title: string; content?: string; notebookId?: string | null; tagIds?: string[] }) => {
    const response = await api.post<ApiResponse<Note>>('/notes', data)
    return response.data
  },
  updateNote: async (id: string, data: { title?: string; content?: string; notebookId?: string | null; tagIds?: string[] }) => {
    const response = await api.put<ApiResponse<Note>>(`/notes/${id}`, data)
    return response.data
  },
  deleteNote: async (id: string) => {
    await api.delete(`/notes/${id}`)
  },
  searchNotes: async (params: { search: string; notebookId?: string; tagIds?: string[] }) => {
    const queryParams: any = { ...params }
    if (queryParams.tagIds && Array.isArray(queryParams.tagIds)) {
      queryParams.tagIds = queryParams.tagIds.join(',')
    }
    const response = await api.get<ApiResponse<Note[]>>('/notes/search', { params: queryParams })
    return response.data
  },
  getTags: async () => {
    const response = await api.get<ApiResponse<Tag[]>>('/tags')
    return response.data
  },
}

export const notebookApi = {
  getNotebooks: async () => {
    const response = await api.get<ApiResponse<Notebook[]>>('/notebooks')
    return response.data
  },
  getNotebook: async (id: string) => {
    const response = await api.get<ApiResponse<Notebook>>(`/notebooks/${id}`)
    return response.data
  },
  createNotebook: async (data: { name: string; description?: string; color?: string; icon?: string; parentId?: string | null }) => {
    const response = await api.post<ApiResponse<Notebook>>('/notebooks', data)
    return response.data
  },
  updateNotebook: async (id: string, data: { name?: string; description?: string; color?: string; icon?: string }) => {
    const response = await api.put<ApiResponse<Notebook>>(`/notebooks/${id}`, data)
    return response.data
  },
  deleteNotebook: async (id: string) => {
    await api.delete(`/notebooks/${id}`)
  },
}

export const tagApi = {
  getTags: async () => {
    const response = await api.get<ApiResponse<Tag[]>>('/tags')
    return response.data
  },
  getTag: async (id: string) => {
    const response = await api.get<ApiResponse<Tag>>(`/tags/${id}`)
    return response.data
  },
  createTag: async (data: { name: string; color?: string }) => {
    const response = await api.post<ApiResponse<Tag>>('/tags', data)
    return response.data
  },
  updateTag: async (id: string, data: { name?: string; color?: string }) => {
    const response = await api.put<ApiResponse<Tag>>(`/tags/${id}`, data)
    return response.data
  },
  deleteTag: async (id: string) => {
    await api.delete(`/tags/${id}`)
  },
}

export const userApi = {
  getProfile: async () => {
    const response = await api.get<ApiResponse<User>>('/user/profile')
    return response.data
  },
  updateProfile: async (data: { name?: string }) => {
    const response = await api.put<ApiResponse<User>>('/user/profile', data)
    return response.data
  },
  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<ApiResponse<void>>('/user/password', data)
    return response.data
  },
  deleteAccount: async () => {
    await api.delete('/user/account')
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<ApiResponse<{ avatar: string; user: User }>>('/user/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  deleteAvatar: async () => {
    await api.delete('/user/avatar')
  },
}

export const aiApi = {
  getConfig: async () => {
    const response = await api.get<ApiResponse<any>>('/ai/config')
    return response.data
  },
  updateConfig: async (data: { provider?: string; apiKey?: string; model?: string }) => {
    const response = await api.put<ApiResponse<any>>('/ai/config', data)
    return response.data
  },
  getSessions: async (params?: { type?: string }) => {
    const response = await api.get<ApiResponse<any[]>>('/ai/sessions', { params })
    return response.data
  },
  createSession: async (data: { title: string; scenarioDialogId?: string }) => {
    const response = await api.post<ApiResponse<any>>('/ai/sessions', data)
    return response.data
  },
  getSession: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/ai/sessions/${id}`)
    return response.data
  },
  deleteSession: async (id: string) => {
    await api.delete(`/ai/sessions/${id}`)
  },
  sendMessage: async (sessionId: string, message: string, model?: string): Promise<ReadableStream<Uint8Array>> => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ sessionId, message, model }),
    })
    
    if (!response.ok) {
      // 处理401/403错误
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (logoutCallback) {
          logoutCallback()
        }
        setTimeout(() => {
          window.location.href = '/login'
        }, 0)
      }
      
      let errorMessage = '发送消息失败'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        // 如果响应不是JSON，使用默认错误消息
      }
      throw new Error(errorMessage)
    }
    
    if (!response.body) {
      throw new Error('无法获取响应流')
    }
    
    return response.body
  },
  getTokenStats: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get<ApiResponse<any>>('/ai/tokens', { params })
    return response.data
  },
}

export const scenarioDialogApi = {
  getScenarioDialogs: async () => {
    const response = await api.get<ApiResponse<any[]>>('/scenario-dialogs')
    return response.data
  },
  getEnabledScenarioDialogs: async () => {
    const response = await api.get<ApiResponse<any[]>>('/scenario-dialogs/enabled')
    return response.data
  },
  createScenarioDialog: async (data: {
    name: string
    description?: string
    prompt: string
    enabled?: boolean
    sortOrder?: number
  }) => {
    const response = await api.post<ApiResponse<any>>('/scenario-dialogs', data)
    return response.data
  },
  updateScenarioDialog: async (id: string, data: {
    name?: string
    description?: string
    prompt?: string
    enabled?: boolean
    sortOrder?: number
  }) => {
    const response = await api.patch<ApiResponse<any>>(`/scenario-dialogs/${id}`, data)
    return response.data
  },
  deleteScenarioDialog: async (id: string) => {
    await api.delete(`/scenario-dialogs/${id}`)
  },
}

