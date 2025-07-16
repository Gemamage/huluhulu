'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Filter, X, Search, SlidersHorizontal } from 'lucide-react';
import { SearchFilters } from '@/types/search';

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  className?: string;
}

const PET_TYPES = [
  { value: 'dog', label: '狗' },
  { value: 'cat', label: '貓' },
  { value: 'bird', label: '鳥' },
  { value: 'rabbit', label: '兔子' },
  { value: 'hamster', label: '倉鼠' },
  { value: 'fish', label: '魚' },
  { value: 'reptile', label: '爬蟲' },
  { value: 'other', label: '其他' },
];

const PET_STATUS = [
  { value: 'lost', label: '走失' },
  { value: 'found', label: '尋獲' },
  { value: 'reunited', label: '團聚' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: '相關性' },
  { value: 'date_desc', label: '最新發布' },
  { value: 'date_asc', label: '最早發布' },
  { value: 'distance', label: '距離最近' },
  { value: 'reward_desc', label: '獎金最高' },
  { value: 'createdAt', label: '發布時間' },
  { value: 'lastSeen', label: '最後見到時間' },
  { value: 'views', label: '瀏覽次數' },
];

const SORT_ORDER = [
  { value: 'desc', label: '由高到低' },
  { value: 'asc', label: '由低到高' },
];

const DOG_BREEDS = [
  '黃金獵犬', '拉布拉多', '柴犬', '貴賓犬', '博美犬', '吉娃娃', '哈士奇', '邊境牧羊犬',
  '德國牧羊犬', '法國鬥牛犬', '英國鬥牛犬', '比熊犬', '馬爾濟斯', '約克夏', '西施犬',
  '米格魯', '柯基犬', '薩摩耶', '阿拉斯加雪橇犬', '秋田犬', '其他'
];

const CAT_BREEDS = [
  '英國短毛貓', '美國短毛貓', '波斯貓', '暹羅貓', '緬因貓', '布偶貓', '俄羅斯藍貓',
  '蘇格蘭摺耳貓', '孟加拉貓', '阿比西尼亞貓', '挪威森林貓', '土耳其安哥拉貓',
  '埃及貓', '曼島貓', '加拿大無毛貓', '米克斯', '其他'
];

export function AdvancedSearch({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  className
}: AdvancedSearchProps) {
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('您的瀏覽器不支援地理位置功能');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // 使用 Google Geocoding API 將座標轉換為地址
          // 這裡需要實際的 API 調用，暫時使用模擬數據
          const mockAddress = `台北市信義區 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          
          setCurrentLocation(mockAddress);
          updateFilter('location', mockAddress);
          updateFilter('latitude', latitude);
          updateFilter('longitude', longitude);
        } catch (error) {
          console.error('獲取地址失敗:', error);
          alert('無法獲取當前地址，請手動輸入');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('獲取位置失敗:', error);
        alert('無法獲取當前位置，請檢查位置權限設定');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分鐘
      }
    );
  };

  const getBreedOptions = () => {
    if (filters.type === 'dog') return DOG_BREEDS;
    if (filters.type === 'cat') return CAT_BREEDS;
    return [];
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(v => {
      if (v === undefined || v === '' || v === null) return false;
      if (typeof v === 'object' && Object.keys(v).length === 0) return false;
      return true;
    }).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              進階搜尋
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()} 個篩選條件
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              使用更多條件來精確搜尋寵物協尋案例
            </CardDescription>
          </div>
          
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onReset}
            >
              <X className="h-4 w-4 mr-2" />
              清除篩選
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 寵物類型 */}
        <div className="space-y-2">
          <Label>寵物類型</Label>
          <Select 
            value={filters.type || 'all'} 
            onValueChange={(value) => {
              updateFilter('type', value === 'all' ? undefined : value);
              // 清除品種選擇，因為不同類型的品種不同
              if (value !== filters.type) {
                updateFilter('breed', undefined);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇寵物類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              {PET_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 品種選擇 */}
        {filters.type && (filters.type === 'dog' || filters.type === 'cat') && (
          <div className="space-y-2">
            <Label>品種</Label>
            <Select 
              value={filters.breed || 'all'} 
              onValueChange={(value) => updateFilter('breed', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇品種" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部品種</SelectItem>
                {getBreedOptions().map((breed) => (
                  <SelectItem key={breed} value={breed}>
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 狀態 */}
        <div className="space-y-2">
          <Label>狀態</Label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              {PET_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* 地理位置搜尋 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>地點搜尋</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {gettingLocation ? '定位中...' : '使用當前位置'}
            </Button>
          </div>
          
          <Input
            placeholder="輸入地點 (例: 台北市信義區)"
            value={filters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
          />
          
          {filters.location && (
            <div className="space-y-2">
              <Label>搜尋範圍: {filters.radius || 10} 公里</Label>
              <Slider
                value={[filters.radius || 10]}
                onValueChange={([value]) => updateFilter('radius', value)}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1km</span>
                <span>50km</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* 排序選項 */}
        <div className="space-y-4">
          <Label>排序方式</Label>
          <Select 
            value={filters.sortBy || 'relevance'} 
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onSearch} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            套用篩選
          </Button>
          
          {hasActiveFilters && (
            <Button variant="outline" onClick={onReset}>
              重置
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}