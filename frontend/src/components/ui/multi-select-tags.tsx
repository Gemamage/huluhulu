'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface MultiSelectTagsProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
  error?: string;
  required?: boolean;
}

export function MultiSelectTags({
  label,
  value,
  onChange,
  options,
  placeholder = '點擊選擇或輸入自定義標籤...',
  maxTags = 10,
  className = '',
  error,
  required = false
}: MultiSelectTagsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = options.filter(option => 
      option.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(option)
    );
    setFilteredOptions(filtered);
  }, [inputValue, options, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue('');
    }
  };

  const addTag = (tag: string) => {
    if (tag && !value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleOptionClick = (option: string) => {
    addTag(option);
  };

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {/* 輸入框和標籤容器 */}
        <div 
          className={`min-h-[42px] w-full px-3 py-2 border rounded-md bg-white cursor-text flex flex-wrap gap-1 items-center ${
            error ? 'border-red-500' : 'border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          {/* 已選標籤 */}
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          
          {/* 輸入框 */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
            disabled={value.length >= maxTags}
          />
          
          {/* 下拉箭頭 */}
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>

        {/* 下拉選項 */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <div className="py-1">
                {filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2 px-3 text-gray-500 text-sm">
                {inputValue ? (
                  <div>
                    <p>沒有找到匹配的選項</p>
                    <p className="text-xs mt-1">按 Enter 鍵添加「{inputValue}」</p>
                  </div>
                ) : (
                  '開始輸入以搜尋或添加新標籤'
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 錯誤訊息 */}
      {error && <p className="text-sm text-red-500">{error}</p>}
      
      {/* 提示訊息 */}
      <p className="text-xs text-gray-500">
        已選擇 {value.length}/{maxTags} 個標籤
        {value.length < maxTags && ' • 可輸入自定義標籤並按 Enter 鍵添加'}
      </p>
    </div>
  );
}