'use client';

import { useState, useEffect } from 'react';
import { petService } from '@/services/petService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Search, Hash } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PopularSearch {
  _id: string;
  count: number;
}

interface PopularSearchesProps {
  onSearchSelect?: (query: string) => void;
  limit?: number;
}

export function PopularSearches({ onSearchSelect, limit = 10 }: PopularSearchesProps) {
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPopularSearches = async () => {
    try {
      setLoading(true);
      const response = await petService.getPopularSearches(limit);
      
      if (response.success && response.data) {
        setPopularSearches(response.data.popularSearches);
      }
    } catch (error) {
      console.error('載入熱門搜尋失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入熱門搜尋，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSelect = (query: string) => {
    if (onSearchSelect) {
      onSearchSelect(query);
    }
  };

  const getPopularityLevel = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'high';
    if (ratio >= 0.5) return 'medium';
    return 'low';
  };

  const getPopularityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  useEffect(() => {
    loadPopularSearches();
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...popularSearches.map(item => item.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          熱門搜尋
        </CardTitle>
        <CardDescription>
          最近最多人搜尋的關鍵字
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {popularSearches.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              暫無熱門搜尋
            </p>
            <p className="text-sm text-gray-500 mt-2">
              當有更多用戶開始搜尋時，熱門關鍵字將會顯示在這裡
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 標籤雲樣式 */}
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item, index) => {
                const level = getPopularityLevel(item.count, maxCount);
                const colorClass = getPopularityColor(level);
                
                return (
                  <Button
                    key={item._id}
                    variant="outline"
                    size="sm"
                    className={`${colorClass} hover:opacity-80 transition-opacity`}
                    onClick={() => handleSearchSelect(item._id)}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {item._id}
                    <Badge 
                      variant="secondary" 
                      className="ml-2 text-xs bg-white/50"
                    >
                      {item.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
            
            {/* 排行榜樣式 */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                搜尋排行榜
              </h4>
              <div className="space-y-2">
                {popularSearches.slice(0, 5).map((item, index) => (
                  <div
                    key={`rank-${item._id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSearchSelect(item._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                          index === 1 ? 'bg-gray-100 text-gray-800' : 
                          index === 2 ? 'bg-orange-100 text-orange-800' : 
                          'bg-blue-100 text-blue-800'}
                      `}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{item._id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {item.count} 次搜尋
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(item.count / maxCount) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {popularSearches.length > 5 && (
              <div className="text-center pt-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    // 可以擴展為顯示更多熱門搜尋的功能
                    toast({
                      title: '功能開發中',
                      description: '更多熱門搜尋功能即將推出',
                    });
                  }}
                >
                  查看更多熱門搜尋
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}