'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import PetCard from '@/components/PetCard';
import { petService } from '@/services/petService';
import {
  SearchFilters,
  AdvancedSearchResponse,
  SearchAnalytics,
  ElasticsearchHealth,
} from '@/types/search';
import { Pet } from '@/types';

interface SearchState {
  query: string;
  filters: SearchFilters;
  results: Pet[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  suggestions: string[];
  analytics: SearchAnalytics | null;
  health: ElasticsearchHealth | null;
  isMockService: boolean;
}

export default function AdvancedSearchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<SearchState>({
    query: searchParams?.get('q') || '',
    filters: {
      ...(searchParams?.get('type') && { type: searchParams?.get('type')! }),
      ...(searchParams?.get('status') && {
        status: searchParams?.get('status')!,
      }),
      ...(searchParams?.get('breed') && { breed: searchParams?.get('breed')! }),
      ...(searchParams?.get('location') && {
        location: searchParams?.get('location')!,
      }),
    },
    results: [],
    total: 0,
    page: 1,
    loading: false,
    error: null,
    suggestions: [],
    analytics: null,
    health: null,
    isMockService: false,
  });

  // 載入搜尋分析和健康狀態
  useEffect(() => {
    loadAnalytics();
    checkHealth();
  }, []);

  // 初始搜尋
  useEffect(() => {
    if (state.query || Object.values(state.filters).some(v => v)) {
      handleSearch();
    }
  }, [state.query, state.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = async () => {
    try {
      const analytics = await petService.getSearchAnalytics('7d');
      setState(prev => ({ ...prev, analytics }));
    } catch (error) {
      // 載入搜尋分析失敗，靜默處理
      setState(prev => ({ ...prev, analytics: null }));
    }
  };

  const checkHealth = async () => {
    try {
      const healthData = await petService.checkSearchHealth();
      setState(prev => ({
        ...prev,
        health: healthData.data.elasticsearch,
        isMockService: false,
      }));
    } catch (error) {
      // 健康檢查失敗，設置為離線狀態
      setState(prev => ({ ...prev, health: null, isMockService: true }));
    }
  };

  const handleSearch = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const searchParams = {
        ...state.filters,
        page: state.page,
        limit: 12,
      };
      const response: AdvancedSearchResponse<Pet> =
        await petService.advancedSearch(state.query, searchParams);

      setState(prev => ({
        ...prev,
        results: response.items,
        total: response.total,
        loading: false,
        isMockService: 'mock' in response ? Boolean(response.mock) : false,
      }));

      // 更新 URL
      const params = new URLSearchParams();
      if (state.query) params.set('q', state.query);
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });

      const newUrl = `/advanced-search${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '搜尋失敗，請稍後再試',
      }));
    }
  };

  const handleQueryChange = async (newQuery: string) => {
    setState(prev => ({ ...prev, query: newQuery }));

    // 獲取搜尋建議
    if (newQuery.length >= 2) {
      try {
        const suggestions = await petService.getSearchSuggestions(newQuery);
        setState(prev => ({ ...prev, suggestions }));
      } catch (error) {
        // 獲取搜尋建議失敗，清空建議列表
        setState(prev => ({ ...prev, suggestions: [] }));
      }
    } else {
      setState(prev => ({ ...prev, suggestions: [] }));
    }
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setState(prev => ({ ...prev, filters: newFilters }));
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      query: '',
      filters: {},
      results: [],
      total: 0,
      page: 1,
      error: null,
      suggestions: [],
    }));

    router.push('/advanced-search');
  };

  const getActiveFiltersCount = () => {
    return Object.values(state.filters).filter(v => v !== undefined && v !== '')
      .length;
  };

  return (
    <div className='container mx-auto px-4 py-8 max-w-7xl'>
      {/* 頁面標題 */}
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Search className='h-6 w-6 text-blue-600' />
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>進階搜尋</h1>
            <p className='text-gray-600 mt-1'>
              使用 {state.isMockService ? '模擬' : 'Elasticsearch'}{' '}
              搜尋引擎，提供更精確的寵物協尋結果
            </p>
          </div>
        </div>

        {/* 服務狀態指示器 */}
        {state.health && (
          <div className='flex items-center gap-2 mb-4'>
            <Badge
              variant={
                state.health.status === 'green' ? 'default' : 'destructive'
              }
              className='flex items-center gap-1'
            >
              {state.health.status === 'green' ? (
                <>
                  <Zap className='h-3 w-3' />
                  {state.isMockService ? '模擬服務' : 'Elasticsearch'} 運行中
                </>
              ) : (
                <>
                  <AlertCircle className='h-3 w-3' />
                  搜尋服務離線
                </>
              )}
            </Badge>

            {state.analytics && (
              <Badge variant='outline' className='flex items-center gap-1'>
                <TrendingUp className='h-3 w-3' />
                今日搜尋: {state.analytics.totalSearches}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* 左側：搜尋表單 */}
        <div className='lg:col-span-1 space-y-6'>
          {/* 搜尋輸入框 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>關鍵字搜尋</CardTitle>
              <CardDescription>輸入寵物名稱、品種、特徵或地點</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <SearchSuggestions
                  value={state.query}
                  onChange={handleQueryChange}
                  onSearch={handleSearch}
                  suggestions={state.suggestions}
                  placeholder='例：黃金獵犬、台北市、走失的貓咪...'
                />

                <Button
                  onClick={handleSearch}
                  className='w-full'
                  disabled={state.loading}
                >
                  {state.loading ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      搜尋中...
                    </>
                  ) : (
                    <>
                      <Search className='h-4 w-4 mr-2' />
                      搜尋
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 進階篩選 */}
          <AdvancedSearch
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </div>

        {/* 右側：搜尋結果 */}
        <div className='lg:col-span-3'>
          {/* 錯誤訊息 */}
          {state.error && (
            <Alert className='mb-6' variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* 搜尋結果統計 */}
          {(state.results.length > 0 || state.loading) && (
            <div className='mb-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <h2 className='text-xl font-semibold'>
                    搜尋結果 {!state.loading && `(${state.total} 筆)`}
                  </h2>

                  {getActiveFiltersCount() > 0 && (
                    <Badge variant='secondary'>
                      {getActiveFiltersCount()} 個篩選條件
                    </Badge>
                  )}
                </div>

                {state.results.length > 0 && (
                  <Button variant='outline' size='sm' onClick={handleReset}>
                    清除所有條件
                  </Button>
                )}
              </div>

              <Separator />
            </div>
          )}

          {/* 載入中 */}
          {state.loading && (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
                <p className='text-gray-600'>正在搜尋寵物資訊...</p>
              </div>
            </div>
          )}

          {/* 搜尋結果 */}
          {!state.loading && state.results.length > 0 && (
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
              {state.results.map(pet => (
                <PetCard
                  key={pet._id}
                  pet={pet}
                  {...(user?.id && { currentUserId: user.id })}
                />
              ))}
            </div>
          )}

          {/* 無結果 */}
          {!state.loading &&
            state.results.length === 0 &&
            (state.query || getActiveFiltersCount() > 0) && (
              <div className='text-center py-12'>
                <div className='max-w-md mx-auto'>
                  <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    找不到符合條件的寵物
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    請嘗試調整搜尋關鍵字或篩選條件
                  </p>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-500'>建議：</p>
                    <ul className='text-sm text-gray-500 space-y-1'>
                      <li>• 使用更通用的關鍵字</li>
                      <li>• 減少篩選條件</li>
                      <li>• 檢查拼字是否正確</li>
                      <li>• 嘗試搜尋相關的品種或地區</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          {/* 初始狀態 */}
          {!state.loading &&
            state.results.length === 0 &&
            !state.query &&
            getActiveFiltersCount() === 0 && (
              <div className='text-center py-12'>
                <div className='max-w-md mx-auto'>
                  <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    開始您的進階搜尋
                  </h3>
                  <p className='text-gray-600'>
                    輸入關鍵字或設定篩選條件來尋找走失的寵物
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
