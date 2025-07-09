'use client';

import { 
  Brain, 
  Search, 
  MapPin, 
  Bell, 
  Share2, 
  Shield, 
  Clock, 
  Heart,
  Smartphone,
  Users,
  Camera,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturesProps {
  className?: string;
}

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const mainFeatures: Feature[] = [
  {
    id: 'ai-recognition',
    icon: <Brain className="w-8 h-8" />,
    title: 'AI 智能辨識',
    description: '運用先進的人工智慧技術，快速比對寵物特徵，提高協尋成功率',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    id: 'smart-search',
    icon: <Search className="w-8 h-8" />,
    title: '智慧搜尋',
    description: '多維度搜尋功能，包含品種、顏色、大小、地點等條件篩選',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: 'location-tracking',
    icon: <MapPin className="w-8 h-8" />,
    title: '地理定位',
    description: '精準的地理位置服務，幫助您在附近區域快速找到走失寵物',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    id: 'instant-alerts',
    icon: <Bell className="w-8 h-8" />,
    title: '即時通知',
    description: '當有相似寵物資訊時，立即推送通知，不錯過任何協尋機會',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
  {
    id: 'social-sharing',
    icon: <Share2 className="w-8 h-8" />,
    title: '社群分享',
    description: '一鍵分享到各大社群平台，擴大協尋範圍，增加找回機會',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
  },
  {
    id: 'secure-platform',
    icon: <Shield className="w-8 h-8" />,
    title: '安全保障',
    description: '嚴格的資料保護機制，確保用戶隱私和寵物資訊安全',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
  },
];

const additionalFeatures: Feature[] = [
  {
    id: '24-7-service',
    icon: <Clock className="w-6 h-6" />,
    title: '24/7 服務',
    description: '全天候服務，隨時協助您的協尋需求',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
  },
  {
    id: 'community-support',
    icon: <Heart className="w-6 h-6" />,
    title: '愛心社群',
    description: '熱心的寵物愛好者社群，共同協助協尋',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
  },
  {
    id: 'mobile-friendly',
    icon: <Smartphone className="w-6 h-6" />,
    title: '行動優化',
    description: '完美適配手機和平板，隨時隨地使用',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/10',
  },
  {
    id: 'expert-team',
    icon: <Users className="w-6 h-6" />,
    title: '專業團隊',
    description: '經驗豐富的寵物專家提供協助和建議',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
  },
  {
    id: 'photo-analysis',
    icon: <Camera className="w-6 h-6" />,
    title: '照片分析',
    description: '智能照片分析，自動提取寵物特徵',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
  },
  {
    id: 'fast-response',
    icon: <Zap className="w-6 h-6" />,
    title: '快速回應',
    description: '平均 3.5 天內協助找回走失寵物',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/10',
  },
];

export function Features({ className }: FeaturesProps) {
  return (
    <section
      id="features-section"
      className={cn(
        'py-16 sm:py-24 mx-4 my-8 rounded-3xl shadow-lg',
        className
      )}
      style={{backgroundColor: '#FFF0E5'}}
    >
      <div className="container mx-auto px-4">
        {/* 標題區塊 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{color: '#333333'}}>
            為什麼選擇
            <span style={{color: '#FF8C69'}}>
              呼嚕
            </span>
            ？
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{color: '#333333'}}>
            我們結合最新科技與溫暖人心的服務，為每一個走失的毛孩提供最好的協尋機會
          </p>
        </div>

        {/* 主要功能 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {mainFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* 圖示 */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{backgroundColor: '#FF8C69'}}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              
              {/* 內容 */}
              <div>
                <h3 className="text-xl font-semibold mb-3" style={{color: '#333333'}}>
                  {feature.title}
                </h3>
                <p className="leading-relaxed" style={{color: '#666666'}}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 額外功能 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {additionalFeatures.map((feature, index) => (
            <div
              key={feature.id}
              className="group relative p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* 圖示 */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{backgroundColor: '#FF8C69'}}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              
              {/* 內容 */}
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{color: '#333333'}}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{color: '#666666'}}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 底部行動呼籲 */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border border-blue-200 dark:border-blue-800">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              AI 技術持續進化，協尋成功率不斷提升
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}