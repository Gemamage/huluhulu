'use client';

import { useState, useEffect } from 'react';
import { petService, Pet, PetSearchParams } from '@/services/petService';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus, MapPin, Calendar, Phone, Mail, Eye, Share2, DollarSign, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History, TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { SearchFilters } from '@/shared/types';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { SearchHistory } from '@/components/search/search-history';
import { PopularSearches } from '@/components/search/popular-searches';

interface PetCardProps {
  pet: Pet;
}

function PetCard({ pet }: PetCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{pet.name}</CardTitle>
            <CardDescription className="mt-1">
              {getTypeText(pet.type)} {pet.breed && `• ${pet.breed}`}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant={getStatusColor(pet.status)}>
              {getStatusText(pet.status)}
            </Badge>
            {pet.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                緊急
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {pet.images && pet.images.length > 0 && (
          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
            <img
              src={pet.images[0]}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{pet.lastSeenLocation.address}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>最後見到: {formatDate(pet.lastSeenDate)}</span>
          </div>
          
          {pet.description && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {pet.description}
            </p>
          )}
          
          {pet.reward && pet.reward > 0 && (
            <div className="text-sm font-medium text-green-600">
              懸賞金額: NT$ {pet.reward.toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>瀏覽 {pet.viewCount}</span>
            <span>分享 {pet.shareCount}</span>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/pets/${pet.id}`}>
                查看詳情
              </Link>
            </Button>
            
            <Button size="sm" variant="outline">
              <Phone className="h-4 w-4" />
            </Button>
            
            {pet.contactInfo.email && (
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4" />
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Skeleton className="aspect-video w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function PetsPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<PetSearchParams>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const loadPets = async (params: PetSearchParams) => {
    try {
      setLoading(true);
      const response = await petService.getPets(params);
      
      if (response.success && response.data) {
        setPets(response.data.pets);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('載入寵物列表失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入寵物列表，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets(searchParams);
  }, [searchParams]);

  const handleSearch = (query?: string) => {
    const searchQuery = query !== undefined ? query : searchText;
    const newParams = {
      ...searchParams,
      ...filters,
      page: 1,
      search: searchQuery || undefined
    };
    setSearchParams(newParams);
    setSearchText(searchQuery);
    loadPets(newParams);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    };
    setFilters(newFilters);
    
    const newParams = {
      ...searchParams,
      ...newFilters,
      page: 1,
      search: searchText || undefined
    };
    setSearchParams(newParams);
    loadPets(newParams);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    
    const newParams = {
      ...searchParams,
      ...newFilters,
      page: 1,
      search: searchText || undefined
    };
    setSearchParams(newParams);
    loadPets(newParams);
  };

  const handleResetFilters = () => {
    const resetFilters: SearchFilters = {};
    setFilters(resetFilters);
    setSearchText('');
    
    const newParams = {
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };
    setSearchParams(newParams);
    loadPets(newParams);
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
    <div className="container mx-auto px-4 py-8">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">寵物協尋</h1>
          <p className="text-gray-600 mt-2">
            幫助走失的寵物回家，或為尋獲的寵物找到主人
          </p>
        </div>
        
        <Button asChild>
          <Link href="/pets/new">
            <Plus className="h-4 w-4 mr-2" />
            發布協尋
          </Link>
        </Button>
      </div>

      {/* 搜尋區域 */}
      <div className="mb-6 space-y-4">
        {/* 主要搜尋輸入框 */}
        <div className="flex gap-2">
          <SearchSuggestions
            value={searchText}
            onChange={setSearchText}
            onSearch={handleSearch}
            className="flex-1"
          />
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            <Filter className="h-4 w-4 mr-2" />
            進階搜尋
            {showAdvancedSearch ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          {user && (
            <Button 
              variant="outline" 
              onClick={() => setShowSearchHistory(!showSearchHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              歷史
              {showSearchHistory ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </div>

        {/* 進階搜尋 */}
        <Collapsible open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
          <CollapsibleContent>
            <AdvancedSearch
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearch={() => handleSearch()}
              onReset={handleResetFilters}
              className="mb-4"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* 搜尋歷史和熱門搜尋 */}
        <Collapsible open={showSearchHistory} onOpenChange={setShowSearchHistory}>
          <CollapsibleContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <SearchHistory
                onSearchSelect={handleSearchSelect}
                limit={5}
              />
              <PopularSearches
                onSearchSelect={(query) => handleSearchSelect(query)}
                limit={8}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 寵物列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <PetCardSkeleton key={index} />
            ))
          : pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}
      </div>

      {/* 分頁 */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            上一頁
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            下一頁
          </Button>
        </div>
      )}

      {/* 空狀態 */}
      {!loading && pets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            沒有找到相關的寵物協尋案例
          </h3>
          <p className="text-gray-600 mb-6">
            嘗試調整搜尋條件或篩選器，或者發布新的協尋案例
          </p>
          <Button asChild>
            <Link href="/pets/new">
              <Plus className="h-4 w-4 mr-2" />
              發布協尋
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}