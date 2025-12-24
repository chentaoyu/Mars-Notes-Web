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
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
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


