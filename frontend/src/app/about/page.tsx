import React from 'react';
import { Heart, MapPin, Users, Zap } from 'lucide-react';
import { Statistics } from '@/components/sections/statistics';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 主視覺區塊 */}
      <div className="relative bg-gradient-to-r from-orange-50 to-amber-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <Heart className="h-16 w-16 text-primary mr-4" />
              <h1 className="text-5xl font-bold text-gray-800">關於我們</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              守護每一個毛孩子回家的路
            </p>
          </div>
        </div>
        
        {/* 裝飾性圖案 */}
        <div className="absolute top-10 left-10 opacity-20">
          <div className="w-20 h-20 bg-orange-200 rounded-full"></div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-20">
          <div className="w-16 h-16 bg-amber-200 rounded-full"></div>
        </div>
        <div className="absolute top-1/2 left-1/4 opacity-10">
          <div className="w-12 h-12 bg-orange-300 rounded-full"></div>
        </div>
      </div>

      {/* 品牌故事區塊 */}
      <div className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">品牌<span className="text-primary">故事</span></h2>
              <p className="text-lg text-zinc-600 max-w-3xl mx-auto mb-8">「<span className="text-primary font-semibold">呼嚕</span>」是生命最深沉、最安心的共鳴。我們致力於守護這份代表「<span className="text-primary font-semibold">家</span>」的安心頻率。</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                「呼嚕 (Hūlū)」是一個專為台灣地區設計的寵物協尋平台，透過地理位置定位、AI 圖像識別和社群協作功能，幫助失蹤寵物與主人快速重聚。
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                我們秉持「<span className="font-semibold text-primary">守護安心頻率</span>」的核心價值，目標是在寵物失蹤的黃金 72 小時內，最大化尋回成功率。
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                每年台灣有數萬隻寵物走失，我們相信透過科技的力量和社群的溫暖，能夠為每一個焦急的家庭帶來希望，讓每一隻毛孩子都能安全回到溫暖的家。
              </p>
            </div>

            {/* 我們的成果與里程碑 */}
            <Statistics />

            {/* 分隔線 */}
            <div className="border-b border-gray-200 my-16"></div>

            {/* 核心價值 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI 智能配對</h3>
                <p className="text-gray-600">運用先進的圖像識別技術，自動比對失蹤與發現的寵物</p>
              </div>
              
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">精準定位</h3>
                <p className="text-gray-600">基於 GPS 的即時地理通知系統，提供精確的位置資訊</p>
              </div>
              
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">社群協作</h3>
                <p className="text-gray-600">建立在地化的寵物協尋社群，凝聚愛心志工的力量</p>
              </div>
              
              <div className="text-center">
                <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">溫暖守護</h3>
                <p className="text-gray-600">每一次協尋都是愛的傳遞，守護每個家庭的完整</p>
              </div>
            </div>

            {/* 使命宣言 */}
            <div className="bg-gradient-to-r from-primary to-amber-400 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">我們的使命</h3>
              <p className="text-lg leading-relaxed">
                成為台灣最友善的寵物協尋平台，運用 AI 技術提升協尋成功率，
                建立可持續發展的寵物服務生態系統，讓科技成為愛的橋樑。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}