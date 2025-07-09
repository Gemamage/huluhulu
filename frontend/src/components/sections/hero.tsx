'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Heart, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroProps {
  className?: string;
}

export function Hero({ className }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 實作搜尋功能
    console.log('搜尋:', { query: searchQuery, location: searchLocation });
  };

  return (
    <section className={cn('relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900', className)}>
      {/* 背景裝飾 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="relative container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center">
          {/* 主標題 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="block">找回你的</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              毛孩夥伴
            </span>
          </h1>

          {/* 副標題 */}
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            呼嚕寵物協尋網站，運用 AI 技術幫助您快速找回走失的寵物，
            <br className="hidden sm:block" />
            讓每個毛孩都能安全回家。
          </p>

          {/* 統計數據 */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-semibold">1,234+</span>
              <span>成功協尋</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">5,678+</span>
              <span>註冊用戶</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <MapPin className="w-5 h-5 text-green-500" />
              <span className="font-semibold">全台</span>
              <span>服務範圍</span>
            </div>
          </div>

          {/* 搜尋表單 */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 搜尋關鍵字 */}
                <div className="md:col-span-2">
                  <label htmlFor="search-query" className="sr-only">
                    搜尋寵物
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="search-query"
                      type="text"
                      placeholder="輸入寵物名稱、品種或特徵..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* 地點 */}
                <div>
                  <label htmlFor="search-location" className="sr-only">
                    搜尋地點
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="search-location"
                      type="text"
                      placeholder="地點"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* 搜尋按鈕 */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  開始搜尋
                </button>
                <Link
                  href="/pets/lost"
                  className="flex-1 bg-white dark:bg-gray-700 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
                >
                  瀏覽走失寵物
                </Link>
              </div>
            </div>
          </form>

          {/* 行動呼籲按鈕 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pets/report-lost"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-lg"
            >
              <Heart className="w-5 h-5 mr-2" />
              我的寵物走失了
            </Link>
            <Link
              href="/pets/report-found"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 rounded-xl transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
            >
              <MapPin className="w-5 h-5 mr-2" />
              我發現了寵物
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}