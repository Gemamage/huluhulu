'use client';

import { useState, useEffect, useRef } from 'react';
import { petService } from '@/services/petService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  query: string;
  count: number;
  type: 'history' | 'popular';
}

interface SearchSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export function SearchSuggestions({
  value,
  onChange,
  onSearch,
  placeholder = '搜尋寵物名稱、品種、地點...',
  className,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>();

  const loadSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await petService.getSearchSuggestions(query);

      const suggestions: SearchSuggestion[] = response.map((item: string) => ({
        query: item,
        count: 0,
        type: 'popular' as const,
      }));

      setSuggestions(suggestions);
    } catch (error) {
      console.error('載入搜尋建議失敗:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1);

    // 清除之前的 debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 設置新的 debounce
    debounceRef.current = setTimeout(() => {
      loadSuggestions(newValue);
    }, 300) as NodeJS.Timeout;
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.query);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch();
        setShowSuggestions(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          onSearch();
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (value.trim()) {
      loadSuggestions(value);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // 延遲隱藏建議，讓用戶有時間點擊建議項目
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
    setShowSuggestions(false);
  };

  // 清理 debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className='relative'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            ref={inputRef}
            type='text'
            value={value}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className='pl-10 pr-10'
          />
          {value && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100'
              onClick={handleClear}
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </form>

      {/* 搜尋建議下拉選單 */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <Card
          ref={suggestionsRef}
          className='absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border'
        >
          <CardContent className='p-0'>
            {loading ? (
              <div className='p-4 text-center text-sm text-gray-500'>
                搜尋中...
              </div>
            ) : (
              <div className='max-h-64 overflow-y-auto'>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.query}`}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
                      'hover:bg-gray-50',
                      selectedIndex === index &&
                        'bg-blue-50 border-l-2 border-blue-500'
                    )}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className='flex items-center gap-3 flex-1'>
                      {suggestion.type === 'history' ? (
                        <Clock className='h-4 w-4 text-gray-400' />
                      ) : (
                        <TrendingUp className='h-4 w-4 text-blue-500' />
                      )}

                      <span className='text-sm'>{suggestion.query}</span>

                      {suggestion.type === 'popular' && (
                        <Badge variant='secondary' className='text-xs'>
                          熱門
                        </Badge>
                      )}
                    </div>

                    <div className='text-xs text-gray-500'>
                      {suggestion.count} 次
                    </div>
                  </div>
                ))}

                {suggestions.length === 0 && !loading && (
                  <div className='p-4 text-center text-sm text-gray-500'>
                    無相關搜尋建議
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
