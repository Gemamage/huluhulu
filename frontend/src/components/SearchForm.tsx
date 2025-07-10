import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, RotateCcw } from 'lucide-react';
import { validateSearchFilters } from '@/utils/validation';

// 搜尋篩選條件類型
export interface SearchFilters {
  type: string;
  status: string;
  breed: string;
  location: string;
  size: string;
  gender: string;
}

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters: SearchFilters;
  required?: boolean;
  loading?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  onSearch, 
  initialFilters,
  required = false,
  loading = false 
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [errors, setErrors] = useState<Partial<SearchFilters>>({});

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!required) return true;

    const newErrors: Partial<Record<keyof SearchFilters, string>> = {};
    
    // 檢查必填欄位
    if (!filters.type || filters.type.trim() === '') {
      newErrors.type = '請選擇寵物類型';
    }

    // 使用 validateSearchFilters 檢查其他驗證規則
    const { isValid: filtersValid, errors: validationErrors } = validateSearchFilters(filters);
    if (!filtersValid) {
      validationErrors.forEach(error => {
        if (error.includes('無效的寵物類型')) {
          newErrors.type = error;
        } else if (error.includes('無效的狀態')) {
          newErrors.status = error;
        } else if (error.includes('無效的體型')) {
          newErrors.size = error;
        } else if (error.includes('無效的性別')) {
          newErrors.gender = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSearch(filters);
    }
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      type: '',
      status: '',
      breed: '',
      location: '',
      size: '',
      gender: ''
    };
    setFilters(resetFilters);
    setErrors({});
    onSearch(resetFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>搜尋寵物</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 寵物類型 */}
            <div className="space-y-2">
              <Label htmlFor="type">寵物類型</Label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">全部</option>
                <option value="dog">狗</option>
                <option value="cat">貓</option>
                <option value="bird">鳥</option>
                <option value="rabbit">兔子</option>
                <option value="hamster">倉鼠</option>
                <option value="fish">魚</option>
                <option value="reptile">爬蟲類</option>
                <option value="other">其他</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            {/* 狀態 */}
            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">全部</option>
                <option value="lost">走失</option>
                <option value="found">已找到</option>
                <option value="adopted">已領養</option>
              </select>
            </div>

            {/* 品種 */}
            <div className="space-y-2">
              <Label htmlFor="breed">品種</Label>
              <Input
                id="breed"
                type="text"
                placeholder="輸入品種"
                value={filters.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
              />
            </div>

            {/* 地點 */}
            <div className="space-y-2">
              <Label htmlFor="location">地點</Label>
              <Input
                id="location"
                type="text"
                placeholder="輸入地點"
                value={filters.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            {/* 體型 */}
            <div className="space-y-2">
              <Label htmlFor="size">體型</Label>
              <select
                id="size"
                value={filters.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">全部</option>
                <option value="tiny">極小型</option>
                <option value="small">小型</option>
                <option value="medium">中型</option>
                <option value="large">大型</option>
                <option value="giant">巨型</option>
              </select>
            </div>

            {/* 性別 */}
            <div className="space-y-2">
              <Label htmlFor="gender">性別</Label>
              <select
                id="gender"
                value={filters.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">全部</option>
                <option value="male">公</option>
                <option value="female">母</option>
                <option value="unknown">未知</option>
              </select>
            </div>
          </div>

          {/* 按鈕區域 */}
          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? '搜尋中...' : '搜尋'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;