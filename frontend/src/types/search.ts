// 搜尋相關類型定義
// 這個文件提供前端測試所需的搜尋類型定義

export interface SearchFilters {
  type?: string;
  status?: string;
  breed?: string;
  location?: string;
  size?: string;
  gender?: string;
  color?: string;
  age?: number;
  radius?: number;
  latitude?: number;
  longitude?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isUrgent?: boolean;
  hasReward?: boolean;
  minReward?: number;
  maxReward?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface SearchParams extends SearchFilters {
  q?: string;
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
  took?: number;
  maxScore?: number;
}

// Elasticsearch 搜尋建議
export interface SearchSuggestion {
  text: string;
  score: number;
  type: 'breed' | 'location' | 'description' | 'name';
}

// 搜尋分析數據
export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{
    query: string;
    count: number;
  }>;
  popularFilters: {
    types: Array<{ key: string; count: number }>;
    locations: Array<{ key: string; count: number }>;
    breeds: Array<{ key: string; count: number }>;
  };
  searchTrends: Array<{
    date: string;
    count: number;
  }>;
  averageResponseTime: number;
  successRate: number;
}

// Elasticsearch 健康狀態
export interface ElasticsearchHealth {
  status: 'green' | 'yellow' | 'red';
  cluster_name: string;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

// 進階搜尋回應
export interface AdvancedSearchResponse<T> extends SearchResult<T> {
  suggestions?: SearchSuggestion[];
  aggregations?: {
    types?: Array<{ key: string; doc_count: number }>;
    locations?: Array<{ key: string; doc_count: number }>;
    breeds?: Array<{ key: string; doc_count: number }>;
    status?: Array<{ key: string; doc_count: number }>;
  };
  highlights?: { [key: string]: string[] };
}