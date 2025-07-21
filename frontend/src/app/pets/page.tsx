'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { petService } from '@/services/petService';
import { Pet } from '@/types/index';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

import {
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  History,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';

import { SearchFilters } from '@/types/search';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { SearchHistory } from '@/components/search/search-history';
import { PopularSearches } from '@/components/search/popular-searches';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import { mockPosts } from '@/components/sections/recent-posts';

interface PetCardProps {
  pet: Pet;
  currentUserId?: string;
  onClick?: () => void;
}

function PetCard({ pet, currentUserId, onClick }: PetCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: 實現收藏功能時需要從 API 獲取收藏狀態
    setIsFavorited(false);
    setFavoriteCount(0);
  }, [currentUserId]);

  const handleFavoriteClick = async () => {
    if (!currentUserId) {
      toast({
        title: '請先登入',
        description: '您需要登入才能收藏寵物',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        await petService.unfavoritePet(pet._id);
        setIsFavorited(false);
        setFavoriteCount(prev => prev - 1);
        toast({
          title: '已取消收藏',
          description: '已從您的收藏清單中移除',
        });
      } else {
        await petService.favoritePet(pet._id);
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);
        toast({
          title: '已加入收藏',
          description: '已添加到您的收藏清單',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: '操作失敗',
        description: '請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'lost' ? 'destructive' : 'secondary';
  };

  const getStatusText = (status: string) => {
    return status === 'lost' ? '走失' : '尋獲';
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      dog: '狗',
      cat: '貓',
      bird: '鳥',
      rabbit: '兔子',
      hamster: '倉鼠',
      fish: '魚',
      reptile: '爬蟲',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  return (
    <Card
      className='h-full hover:shadow-lg transition-shadow cursor-pointer'
      onClick={onClick}
    >
      <CardHeader className='pb-3'>
        <div className='flex justify-between items-start'>
          <div className='flex-1'>
            <CardTitle className='text-lg font-semibold'>{pet.name}</CardTitle>
            <CardDescription className='mt-1'>
              {getTypeText(pet.type)} {pet.breed && `• ${pet.breed}`}
            </CardDescription>
          </div>
          <div className='flex flex-col gap-2'>
            <Badge variant={getStatusColor(pet.status)}>
              {getStatusText(pet.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {pet.images && pet.images.length > 0 && (
          <div className='aspect-[3/4] bg-gray-100 rounded-md overflow-hidden relative'>
            <Image
              src={pet.images?.[0] || '/placeholder-pet.jpg'}
              alt={pet.name}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          </div>
        )}

        <div className='space-y-2 text-sm text-gray-600'>
          <div className='flex items-center gap-2'>
            <MapPin className='h-4 w-4' />
            <span className='truncate'>
              {typeof pet.lastSeenLocation === 'string'
                ? pet.lastSeenLocation
                : pet.lastSeenLocation?.address || (pet as any).location}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            <span>
              發布時間: {new Date(pet.createdAt).toLocaleDateString('zh-TW')}
            </span>
          </div>

          {pet.description && (
            <p className='text-sm text-gray-700 line-clamp-2'>
              {pet.description}
            </p>
          )}

          {pet.reward && pet.reward > 0 && (
            <div className='text-sm font-medium text-green-600'>
              懸賞金額: NT$ {pet.reward.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className='pt-3 border-t'>
        <div className='flex justify-between items-center w-full'>
          <div className='flex items-center gap-4 text-xs text-gray-500'>
            <span>瀏覽 {pet.views || 0}</span>
            <span>分享 {pet.shares || 0}</span>
            <span>收藏 {favoriteCount}</span>
          </div>

          <div className='flex gap-2'>
            <Button size='sm' variant='outline' asChild>
              <Link href={`/pets/${pet._id}`}>查看詳情</Link>
            </Button>

            <Button
              size='sm'
              variant='outline'
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className={isFavorited ? 'text-red-500 border-red-500' : ''}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`}
              />
            </Button>

            <Button size='sm' variant='outline'>
              <Phone className='h-4 w-4' />
            </Button>

            {pet.contactInfo?.email && (
              <Button size='sm' variant='outline'>
                <Mail className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function PetCardSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='flex justify-between items-start'>
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-24' />
          </div>
          <Skeleton className='h-6 w-12' />
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        <Skeleton className='aspect-video w-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      </CardContent>

      <CardFooter className='pt-3 border-t'>
        <div className='flex justify-between items-center w-full'>
          <div className='flex gap-4'>
            <Skeleton className='h-3 w-12' />
            <Skeleton className='h-3 w-12' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function PetsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [searchText, setSearchText] = useState('');

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const loadPets = async () => {
    try {
      setLoading(true);

      // 直接使用 mockPosts 範例資料來確保顯示6個案例
      const adaptedMockPosts = mockPosts.map(post => ({
        ...post,
        _id: post.id.toString(),
        lastSeenLocation: { address: post.location, lat: 0, lng: 0 },
        contactInfo: { ...post.contactInfo, email: '' },
        viewCount: post.viewCount || 0,
        shareCount: post.shareCount || 0,
      }));
      setPets(adaptedMockPosts as unknown as Pet[]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: adaptedMockPosts.length,
        hasNext: false,
        hasPrev: false,
      });

      console.log('載入了', adaptedMockPosts.length, '個寵物案例');
    } catch (error) {
      console.error('載入寵物列表失敗:', error);
      // 即使出錯也顯示範例資料
      const adaptedMockPosts = mockPosts.map(post => ({
        ...post,
        _id: post.id.toString(),
        lastSeenLocation: { address: post.location, lat: 0, lng: 0 },
        contactInfo: { ...post.contactInfo, email: '' },
        viewCount: post.viewCount || 0,
        shareCount: post.shareCount || 0,
      }));
      setPets(adaptedMockPosts as unknown as Pet[]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: adaptedMockPosts.length,
        hasNext: false,
        hasPrev: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, [searchParams]);

  const handleSearch = (query?: string) => {
    const searchQuery = query !== undefined ? query : searchText;
    const newParams = {
      ...searchParams,
      ...filters,
      page: 1,
      search: searchQuery || undefined,
    };
    setSearchParams(newParams);
    setSearchText(searchQuery);
    loadPets();
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);

    const newParams = {
      ...searchParams,
      ...newFilters,
      page: 1,
      search: searchText || undefined,
    };
    setSearchParams(newParams);
    loadPets();
  };

  const handleResetFilters = () => {
    const resetFilters: SearchFilters = {};
    setFilters(resetFilters);
    setSearchText('');

    const newParams = {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    };
    setSearchParams(newParams);
    loadPets();
  };

  const handleSearchSelect = (query: string, searchFilters?: any) => {
    setSearchText(query);
    if (searchFilters) {
      setFilters(searchFilters);
    }
    handleSearch(query);
    setShowSearchHistory(false);
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...searchParams, page });
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* 頁面標題 */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>寵物協尋</h1>
          <p className='text-gray-600 mt-2'>
            幫助走失的寵物回家，或為尋獲的寵物找到主人
          </p>
        </div>

        <Button asChild>
          <Link href='/pets/lost'>
            <Plus className='h-4 w-4 mr-2' />
            發布協尋
          </Link>
        </Button>
      </div>

      {/* 搜尋區域 */}
      <div className='mb-6 space-y-4'>
        {/* 主要搜尋輸入框 */}
        <div className='flex gap-2'>
          <div className='flex-1'>
            <SearchSuggestions
              value={searchText}
              onChange={setSearchText}
              onSearch={() => handleSearch()}
              suggestions={[]}
              placeholder='搜尋寵物名稱、品種、地點...'
            />
          </div>
          <Button
            variant='outline'
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <Filter className='h-4 w-4 mr-2' />
            進階搜尋
            {showAdvancedSearch ? (
              <ChevronUp className='h-4 w-4 ml-2' />
            ) : (
              <ChevronDown className='h-4 w-4 ml-2' />
            )}
          </Button>
          {user && (
            <Button
              variant='outline'
              onClick={() => setShowSearchHistory(!showSearchHistory)}
            >
              <History className='h-4 w-4 mr-2' />
              歷史
              {showSearchHistory ? (
                <ChevronUp className='h-4 w-4 ml-2' />
              ) : (
                <ChevronDown className='h-4 w-4 ml-2' />
              )}
            </Button>
          )}
        </div>

        {/* 進階搜尋 */}
        <Collapsible
          open={showAdvancedSearch}
          onOpenChange={setShowAdvancedSearch}
        >
          <CollapsibleContent>
            <AdvancedSearch
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={() => handleSearch()}
              onReset={handleResetFilters}
              className='mb-4'
            />
          </CollapsibleContent>
        </Collapsible>

        {/* 搜尋歷史和熱門搜尋 */}
        <Collapsible
          open={showSearchHistory}
          onOpenChange={setShowSearchHistory}
        >
          <CollapsibleContent>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
              <SearchHistory onSearchSelect={handleSearchSelect} limit={5} />
              <PopularSearches
                onSearchSelect={query => handleSearchSelect(query)}
                limit={8}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 寵物列表 - 上面三則案例 */}
      {!loading && pets.length > 0 && (
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            最新協尋案例
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            {pets.slice(0, 3).map(pet => (
              <PetCard
                key={pet._id}
                pet={pet}
                {...(user?.id && { currentUserId: user.id })}
                onClick={() => router.push(`/pets/${pet._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 寵物列表 - 下面三則案例 */}
      {!loading && pets.length > 3 && (
        <div className='mb-12'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            更多協尋案例
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            {pets.slice(3, 6).map(pet => (
              <PetCard
                key={pet._id}
                pet={pet}
                {...(user?.id && { currentUserId: user.id })}
                onClick={() => router.push(`/pets/${pet._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 載入中的骨架屏 */}
      {loading && (
        <div className='space-y-12'>
          <div>
            <div className='h-8 bg-gray-200 rounded w-48 mb-6'></div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {Array.from({ length: 3 }).map((_, index) => (
                <PetCardSkeleton key={index} />
              ))}
            </div>
          </div>
          <div>
            <div className='h-8 bg-gray-200 rounded w-48 mb-6'></div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {Array.from({ length: 3 }).map((_, index) => (
                <PetCardSkeleton key={`second-${index}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 查看更多按鈕 */}
      {!loading && pets.length > 6 && (
        <div className='text-center mb-8'>
          <Button
            variant='outline'
            size='lg'
            onClick={() => {
              const newParams = {
                ...searchParams,
                limit: searchParams.limit + 6,
              };
              setSearchParams(newParams);
              loadPets();
            }}
          >
            載入更多案例
          </Button>
        </div>
      )}

      {/* 分頁 */}
      {!loading && pagination.totalPages > 1 && (
        <div className='flex justify-center items-center gap-2'>
          <Button
            variant='outline'
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            上一頁
          </Button>

          <div className='flex gap-1'>
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={
                      page === pagination.currentPage ? 'default' : 'outline'
                    }
                    size='sm'
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              }
            )}
          </div>

          <Button
            variant='outline'
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            下一頁
          </Button>
        </div>
      )}

      {/* 空狀態 */}
      {!loading && pets.length === 0 && (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <Search className='h-16 w-16 mx-auto' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            沒有找到相關的寵物協尋案例
          </h3>
          <p className='text-gray-600 mb-6'>
            嘗試調整搜尋條件或篩選器，或者發布新的協尋案例
          </p>
          <Button asChild>
            <Link href='/pets/lost'>
              <Plus className='h-4 w-4 mr-2' />
              發布協尋
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
