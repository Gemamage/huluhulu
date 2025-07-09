'use client';

import { useState, useEffect } from 'react';
import { petService } from '@/services/petService';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { History, Search, Trash2, Clock, MapPin, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface SearchHistoryItem {
  _id: string;
  searchQuery: string;
  filters: {
    type?: string;
    status?: string;
    location?: string;
    breed?: string;
    radius?: number;
  };
  resultCount: number;
  searchedAt: string;
}

interface SearchHistoryProps {
  onSearchSelect?: (query: string, filters: any) => void;
  limit?: number;
}

export function SearchHistory({ onSearchSelect, limit = 10 }: SearchHistoryProps) {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadSearchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await petService.getSearchHistory(limit);
      
      if (response.success && response.data) {
        setSearchHistory(response.data.searchHistory);
      }
    } catch (error) {
      console.error('載入搜尋歷史失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入搜尋歷史，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      setClearing(true);
      const response = await petService.clearSearchHistory();
      
      if (response.success) {
        setSearchHistory([]);
        toast({
          title: '清除成功',
          description: '搜尋歷史已清除',
        });
      }
    } catch (error) {
      console.error('清除搜尋歷史失敗:', error);
      toast({
        title: '清除失敗',
        description: '無法清除搜尋歷史，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  const handleSearchSelect = (item: SearchHistoryItem) => {
    if (onSearchSelect) {
      onSearchSelect(item.searchQuery, item.filters);
    }
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      lost: '走失',
      found: '尋獲',
      reunited: '團聚',
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    loadSearchHistory();
  }, [user, limit]);

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <History className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            請登入以查看搜尋歷史
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              搜尋歷史
            </CardTitle>
            <CardDescription>
              查看您最近的搜尋記錄
            </CardDescription>
          </div>
          
          {searchHistory.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={clearing}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認清除搜尋歷史</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作將永久刪除您的所有搜尋歷史記錄，且無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearHistory}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    確認清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {searchHistory.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              尚無搜尋歷史
            </p>
            <p className="text-sm text-gray-500 mt-2">
              開始搜尋寵物協尋案例，您的搜尋記錄將會顯示在這裡
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchHistory.map((item) => (
              <div
                key={item._id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleSearchSelect(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Search className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {item.searchQuery || '無關鍵字搜尋'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(item.searchedAt), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </span>
                      <span>•</span>
                      <span>{item.resultCount} 個結果</span>
                    </div>
                  </div>
                </div>
                
                {/* 篩選條件 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.filters.type && (
                    <Badge variant="secondary" className="text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      {getTypeText(item.filters.type)}
                    </Badge>
                  )}
                  
                  {item.filters.status && (
                    <Badge variant="secondary" className="text-xs">
                      {getStatusText(item.filters.status)}
                    </Badge>
                  )}
                  
                  {item.filters.location && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.filters.location}
                    </Badge>
                  )}
                  
                  {item.filters.breed && (
                    <Badge variant="secondary" className="text-xs">
                      品種: {item.filters.breed}
                    </Badge>
                  )}
                  
                  {item.filters.radius && item.filters.radius !== 10 && (
                    <Badge variant="secondary" className="text-xs">
                      範圍: {item.filters.radius}km
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}