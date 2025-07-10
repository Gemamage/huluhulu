// 搜尋相關類型定義
// 這個文件提供前端測試所需的搜尋類型定義

export interface SearchFilters {
  type: string;
  status: string;
  breed: string;
  location: string;
  size: string;
  gender: string;
}

export interface SearchParams extends SearchFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}