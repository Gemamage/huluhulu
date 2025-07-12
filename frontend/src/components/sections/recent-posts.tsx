'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  Eye, 
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

interface RecentPostsProps {
  className?: string;
}

interface PetPost {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  status: 'lost' | 'found' | 'reunited';
  location: string;
  lastSeenDate: string;
  description: string;
  images: string[];
  contactInfo: {
    name: string;
    phone: string;
  };
  reward?: number;
  isUrgent: boolean;
  viewCount: number;
  shareCount: number;
  createdAt: string;
}

// 模擬資料
const mockPosts: PetPost[] = [
  {
    id: '1',
    name: '小白',
    type: 'dog',
    breed: '柴犬',
    status: 'lost',
    location: '台北市大安區',
    lastSeenDate: '2024-01-15T10:30:00Z',
    description: '非常親人的柴犬，會回應名字，額頭有白色愛心形斑紋',
    images: ['/images/pets/dog-01.jpeg'],
    contactInfo: {
      name: '王小明',
      phone: '0912345678',
    },
    reward: 5000,
    isUrgent: true,
    viewCount: 156,
    shareCount: 23,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: '咪咪',
    type: 'cat',
    breed: '英國短毛貓',
    status: 'found',
    location: '新北市板橋區',
    lastSeenDate: '2024-01-14T16:45:00Z',
    description: '灰色英短，很親人，在公園附近發現',
    images: ['/images/pets/cat-02.jpeg'],
    contactInfo: {
      name: '李小華',
      phone: '0987654321',
    },
    isUrgent: false,
    viewCount: 89,
    shareCount: 12,
    createdAt: '2024-01-14T18:00:00Z',
  },
  {
    id: '3',
    name: '球球',
    type: 'dog',
    breed: '黃金獵犬',
    status: 'lost',
    location: '台中市西屯區',
    lastSeenDate: '2024-01-13T14:20:00Z',
    description: '大型黃金獵犬，非常溫馴，脖子上有紅色項圈',
    images: ['/images/pets/dog-03.jpeg'],
    contactInfo: {
      name: '張大明',
      phone: '0923456789',
    },
    reward: 10000,
    isUrgent: true,
    viewCount: 234,
    shareCount: 45,
    createdAt: '2024-01-13T15:00:00Z',
  },
  {
    id: '4',
    name: '小花',
    type: 'cat',
    breed: '三花貓',
    status: 'reunited',
    location: '高雄市左營區',
    lastSeenDate: '2024-01-12T09:15:00Z',
    description: '已找到！感謝大家的幫助',
    images: ['/images/pets/cat-04.jpeg'],
    contactInfo: {
      name: '陳小美',
      phone: '0934567890',
    },
    isUrgent: false,
    viewCount: 178,
    shareCount: 67,
    createdAt: '2024-01-12T10:00:00Z',
  },
  {
    id: '5',
    name: '皮皮',
    type: 'bird',
    breed: '玄鳳鸚鵡',
    status: 'lost',
    location: '桃園市中壢區',
    lastSeenDate: '2024-01-11T11:30:00Z',
    description: '灰色玄鳳鸚鵡，會說話，頭上有黃色冠羽',
    images: ['/images/pets/bird-05.jpeg'],
    contactInfo: {
      name: '林小強',
      phone: '0945678901',
    },
    reward: 2000,
    isUrgent: false,
    viewCount: 67,
    shareCount: 8,
    createdAt: '2024-01-11T12:00:00Z',
  },
  {
    id: '6',
    name: '豆豆',
    type: 'rabbit',
    breed: '荷蘭兔',
    status: 'found',
    location: '台南市東區',
    lastSeenDate: '2024-01-10T13:45:00Z',
    description: '白色荷蘭兔，在學校附近發現，很乖巧',
    images: ['/images/pets/rabit-06.jpeg'],
    contactInfo: {
      name: '黃小芳',
      phone: '0956789012',
    },
    isUrgent: false,
    viewCount: 45,
    shareCount: 5,
    createdAt: '2024-01-10T14:00:00Z',
  },
];

const statusConfig = {
  lost: {
    label: '走失',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: '🔍',
  },
  found: {
    label: '發現',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: '📍',
  },
  reunited: {
    label: '團聚',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: '🎉',
  },
};

const typeConfig = {
  dog: { label: '狗狗', emoji: '🐕' },
  cat: { label: '貓咪', emoji: '🐱' },
  bird: { label: '鳥類', emoji: '🐦' },
  rabbit: { label: '兔子', emoji: '🐰' },
  other: { label: '其他', emoji: '🐾' },
};

export function RecentPosts({ className }: RecentPostsProps) {
  const [filter, setFilter] = useState<'all' | 'lost' | 'found' | 'reunited'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = mockPosts.filter(post => {
    const matchesFilter = filter === 'all' || post.status === filter;
    const matchesSearch = searchTerm === '' || 
      post.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <section className={cn('py-16 sm:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* 標題區塊 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-700 mb-4">
            最新
            <span className="text-amber-600">
              協尋資訊
            </span>
          </h2>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
            即時更新的寵物協尋資訊，讓我們一起幫助毛孩回家
          </p>
        </div>

        {/* 篩選和搜尋 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* 搜尋框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜尋寵物名稱、品種或地點..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-zinc-700 placeholder-gray-500"
            />
          </div>

          {/* 狀態篩選 */}
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-gray-400 mt-3" />
            {(['all', 'lost', 'found', 'reunited'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  filter === status
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? '全部' : statusConfig[status].label}
              </button>
            ))}
          </div>
        </div>

        {/* 貼文網格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className="group bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* 圖片區域 */}
              <div className="relative aspect-[4/5] bg-gray-200">
                {post.images[0] ? (
                  <Image
                    src={post.images[0]}
                    alt={post.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">
                    {typeConfig[post.type].emoji}
                  </div>
                )}
                
                {/* 狀態標籤 */}
                <div className="absolute top-3 left-3">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                    statusConfig[post.status].color
                  )}>
                    <span>{statusConfig[post.status].icon}</span>
                    {statusConfig[post.status].label}
                  </span>
                </div>

                {/* 緊急標籤 */}
                {post.isUrgent && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                      緊急
                    </span>
                  </div>
                )}

                {/* 懸賞金額 */}
                {post.reward && (
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                      懸賞 ${post.reward.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* 內容區域 */}
              <div className="p-6">
                {/* 寵物資訊 */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-zinc-700 mb-1">
                    {post.name} ({post.breed})
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-zinc-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatRelativeTime(post.lastSeenDate)}
                    </div>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-zinc-600 text-sm mb-4 line-clamp-2">
                  {post.description}
                </p>

                {/* 統計資訊 */}
                <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.viewCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      {post.shareCount}
                    </div>
                  </div>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>

                {/* 行動按鈕 */}
                <div className="flex gap-2">
                  <Link
                    href={`/pets/${post.id}`}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-center py-2 px-4 rounded-lg transition-colors font-medium"
                  >
                    查看詳情
                  </Link>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5 text-zinc-600" />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share2 className="w-5 h-5 text-zinc-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 查看更多按鈕 */}
        <div className="text-center">
          <Link
            href="/pets"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            查看所有協尋資訊
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}