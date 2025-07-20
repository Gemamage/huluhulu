'use client';

import Link from 'next/link';
import {
  Heart,
  MapPin,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallToActionProps {
  className?: string;
}

const actionCards = [
  {
    id: 'report-lost',
    title: '我的寵物走失了',
    description: '立即發布協尋資訊，讓更多人幫助您找回毛孩',
    icon: <Heart className='w-8 h-8' />,
    href: '/pets',
    color: 'from-red-500 to-pink-500',
    hoverColor: 'from-red-600 to-pink-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    features: [
      '免費發布協尋資訊',
      'AI 智能匹配相似寵物',
      '社群分享擴大搜尋範圍',
      '即時通知相關資訊',
    ],
  },
  {
    id: 'report-found',
    title: '我發現了寵物',
    description: '幫助走失的毛孩找到回家的路',
    icon: <MapPin className='w-8 h-8' />,
    href: '/pets/new',
    color: 'from-green-500 to-emerald-500',
    hoverColor: 'from-green-600 to-emerald-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
    features: [
      '快速上傳發現資訊',
      '精準地理位置定位',
      '自動匹配走失寵物',
      '安全的聯絡方式',
    ],
  },
  {
    id: 'join-community',
    title: '加入愛心社群',
    description: '成為志工，一起幫助更多毛孩回家',
    icon: <Users className='w-8 h-8' />,
    href: '/community',
    color: 'from-blue-500 to-purple-500',
    hoverColor: 'from-blue-600 to-purple-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    features: ['參與協尋活動', '分享協尋資訊', '提供專業建議', '建立愛心網絡'],
  },
];

const trustIndicators = [
  {
    icon: <Shield className='w-6 h-6' />,
    title: '安全可靠',
    description: '嚴格的資料保護機制',
  },
  {
    icon: <Clock className='w-6 h-6' />,
    title: '24/7 服務',
    description: '全天候協助您的需求',
  },
  {
    icon: <Sparkles className='w-6 h-6' />,
    title: 'AI 技術',
    description: '智能匹配提高成功率',
  },
];

export function CallToAction({ className }: CallToActionProps) {
  return (
    <section
      className={cn('py-16 sm:py-24 relative overflow-hidden', className)}
    >
      {/* 背景裝飾 */}
      <div className='absolute inset-0 bg-grid-pattern opacity-5' />
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob' />
      <div className='absolute top-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000' />
      <div className='absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000' />

      <div className='relative container mx-auto px-4'>
        {/* 主標題區塊 */}
        <div className='text-center mb-16'>
          <h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-zinc-700'>
            立即
            <span className='text-amber-600'>開始行動</span>
          </h2>
          <p className='text-xl max-w-3xl mx-auto mb-8 text-zinc-700'>
            每一秒都很珍貴，讓我們一起為毛孩們創造回家的機會
          </p>

          {/* 信任指標 */}
          <div className='flex flex-wrap justify-center gap-8 mb-8'>
            {trustIndicators.map((indicator, i) => (
              <div
                key={i}
                className='flex items-center gap-2 text-zinc-700'
              >
                <div className='text-amber-600'>{indicator.icon}</div>
                <div className='text-left'>
                  <div className='font-semibold text-sm'>{indicator.title}</div>
                  <div className='text-xs opacity-75'>
                    {indicator.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 行動卡片 */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16'>
          {actionCards.map((card) => (
            <div
              key={card.id}
              className='group relative bg-white rounded-3xl p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-4'
            >
              {/* 圖示 */}
              <div className='inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 bg-amber-600'>
                <div className='text-white'>{card.icon}</div>
              </div>

              {/* 標題和描述 */}
              <h3 className='text-2xl font-bold mb-4 text-zinc-700'>
                {card.title}
              </h3>
              <p className='mb-6 leading-relaxed text-zinc-600'>
                {card.description}
              </p>

              {/* 功能列表 */}
              <ul className='space-y-3 mb-8'>
                {card.features.map((feature, index) => (
                  <li
                    key={index}
                    className='flex items-center gap-3 text-sm text-zinc-600'
                  >
                    <div className='w-2 h-2 rounded-full flex-shrink-0 bg-amber-600' />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* 行動按鈕 */}
              <Link
                href={card.href}
                className='group/btn inline-flex items-center justify-center w-full px-6 py-4 font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg bg-amber-600 text-white hover:bg-amber-700'
              >
                立即開始
                <ArrowRight className='w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform' />
              </Link>
            </div>
          ))}
        </div>

        {/* 統計數據和鼓勵文字 */}
        <div className='text-center'>
          <div className='bg-white rounded-3xl p-8 border border-gray-200 shadow-xl'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8'>
              <div>
                <div className='text-3xl font-bold mb-2 text-amber-600'>
                  87%
                </div>
                <div className='text-zinc-600'>協尋成功率</div>
              </div>
              <div>
                <div className='text-3xl font-bold mb-2 text-amber-600'>
                  3.5天
                </div>
                <div className='text-zinc-600'>平均找回時間</div>
              </div>
              <div>
                <div className='text-3xl font-bold mb-2 text-amber-600'>
                  1,234+
                </div>
                <div className='text-zinc-600'>成功案例</div>
              </div>
            </div>

            <div className='border-t border-gray-200 pt-8'>
              <p className='text-lg mb-4 text-zinc-700'>
                <span className='font-semibold text-amber-600'>
                  每一個成功的故事
                </span>
                都始於一個簡單的行動
              </p>
              <p className='text-zinc-600'>
                加入我們，成為毛孩回家路上的那道光
              </p>
            </div>
          </div>
        </div>

        {/* 緊急協助提示 */}
        <div className='mt-12 text-center'>
          <div className='inline-flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-2xl shadow-lg'>
            <div className='w-3 h-3 rounded-full animate-pulse bg-amber-600' />
            <span className='font-medium text-zinc-700'>
              緊急情況？請立即撥打 24 小時協助專線：
              <a
                href='tel:0800-123-456'
                className='font-bold underline ml-1 text-amber-600'
              >
                0800-123-456
              </a>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
