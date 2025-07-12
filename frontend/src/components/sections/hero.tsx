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
    <>
      {/* 橫幅插畫區域 */}
      <section className={cn('relative overflow-hidden bg-gradient-to-br from-orange-200 via-orange-300 to-orange-400', className)} style={{backgroundColor: '#FDBA74'}}>
      {/* 背景裝飾 - 暖色調 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="text-center">
          {/* 主標題 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="block">找回你的</span>
            <span className="block text-white drop-shadow-lg">
              毛孩夥伴
            </span>
          </h1>

          {/* 副標題 */}
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            呼嚕寵物協尋網站，運用 AI 技術幫助您快速找回走失的寵物，
            <br className="hidden sm:block" />
            讓每個毛孩都能安全回家。
          </p>

          {/* 統計數據 */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-white/90">
              <Heart className="w-5 h-5 text-white" />
              <span className="font-semibold">1,234+</span>
              <span>成功協尋</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Users className="w-5 h-5 text-white" />
              <span className="font-semibold">5,678+</span>
              <span>註冊用戶</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-5 h-5 text-white" />
              <span className="font-semibold">全台</span>
              <span>服務範圍</span>
            </div>
          </div>

          {/* 搜尋表單 */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-zinc-700 placeholder-gray-500"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-zinc-700 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* 搜尋按鈕 */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  開始搜尋
                </button>
                <Link
                  href="/pets/lost"
                  className="flex-1 bg-white border-2 border-amber-600 text-amber-600 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 text-center"
                >
                  瀏覽走失寵物
                </Link>
              </div>
            </div>
          </form>
       </div>
      </div>
    </section>

    {/* 行動呼籲區塊 */}
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-8 mt-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pets/new"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
          >
            <MapPin className="w-5 h-5 mr-2" />
            我發現了寵物
          </Link>
          <Link
            href="/pets/new"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
          >
            <Heart className="w-5 h-5 mr-2" />
            我的寵物走失了
          </Link>
        </div>
      </div>
    </section>
  </>
  );
}