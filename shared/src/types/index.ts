// Shared types for both frontend and backend

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notebook {
  id: string;
  userId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  children?: Notebook[];
  _count?: {
    notes: number;
    children?: number;
  };
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    notes: number;
  };
}

export interface Note {
  id: string;
  userId: string;
  notebookId?: string | null;
  title: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  notebook?: Notebook | null;
  tags?: Tag[];
}

// 笔记排序选项
export type NoteSortBy = 'updatedAt' | 'createdAt' | 'title';
export type NoteSortOrder = 'asc' | 'desc';

// 笔记查询参数
export interface NoteQueryParams {
  search?: string;
  notebookId?: string;
  tagIds?: string[];
  sortBy?: NoteSortBy;
  sortOrder?: NoteSortOrder;
  page?: number;
  limit?: number;
}

// AI 相关类型
export interface AIConfig {
  id: string;
  userId: string;
  provider: string;
  apiKey: string;
  model: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  model?: string | null;
  scenarioDialogId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: string;
  content: string;
  model?: string | null;
  tokens?: number | null;
  createdAt: Date | string;
}

export interface TokenUsage {
  id: string;
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  createdAt: Date | string;
}

export interface ScenarioDialog {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  prompt: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}


