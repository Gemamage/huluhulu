'use client';

import { useEffect, useState } from 'react';
import { Heart, Users, MapPin, Clock, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsProps {
  className?: string;
}

interface StatItem {
  id: string;
  icon: React.ReactNode;
  value: number;
  label: string;
  description: string;
  color: string;
  suffix?: string;
}

const statisticsData: StatItem[] = [
  {
    id: 'success-cases',
    icon: <Heart className="w-8 h-8" />,
    value: 1234,
    label: '成功協尋',
    description: '已成功幫助寵物回家',
    color: 'text-red-500',
    suffix: '+',
  },
  {
    id: 'registered-users',
    icon: <Users className="w-8 h-8" />,
    value: 5678,
    label: '註冊用戶',
    description: '活躍的愛心用戶',
    color: 'text-blue-500',
    suffix: '+',
  },
  {
    id: 'coverage-cities',
    icon: <MapPin className="w-8 h-8" />,
    value: 22,
    label: '服務縣市',
    description: '全台灣服務範圍',
    color: 'text-green-500',
  },
  {
    id: 'average-time',
    icon: <Clock className="w-8 h-8" />,
    value: 3.5,
    label: '平均協尋時間',
    description: '快速找回毛孩',
    color: 'text-purple-500',
    suffix: '天',
  },
  {
    id: 'success-rate',
    icon: <Award className="w-8 h-8" />,
    value: 87,
    label: '成功率',
    description: '高效的協尋成果',
    color: 'text-yellow-500',
    suffix: '%',
  },
  {
    id: 'monthly-growth',
    icon: <TrendingUp className="w-8 h-8" />,
    value: 15,
    label: '月成長率',
    description: '持續成長的社群',
    color: 'text-indigo-500',
    suffix: '%',
  },
];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('statistics-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2秒動畫
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setCount(current);

      if (step >= steps) {
        clearInterval(timer);
        setCount(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  const formatNumber = (num: number) => {
    if (suffix === '%' || suffix === '天') {
      return num.toFixed(1);
    }
    return Math.floor(num).toLocaleString();
  };

  return (
    <span className="font-bold text-3xl sm:text-4xl">
      {formatNumber(count)}{suffix}
    </span>
  );
}

export function Statistics({ className }: StatisticsProps) {
  return (
    <section
      id="statistics-section"
      className={cn(
        'py-16 sm:py-24 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800',
        className
      )}
    >
      <div className="container mx-auto px-4">
        {/* 標題區塊 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            我們的
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              成果
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            透過科技與愛心，我們已經幫助無數家庭重新團聚
          </p>
        </div>

        {/* 統計數據網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {statisticsData.map((stat, index) => (
            <div
              key={stat.id}
              className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* 背景裝飾 */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full -translate-y-10 translate-x-10 opacity-50 group-hover:opacity-70 transition-opacity" />
              
              {/* 圖示 */}
              <div className={cn('mb-4', stat.color)}>
                {stat.icon}
              </div>

              {/* 數值 */}
              <div className="mb-2">
                <AnimatedCounter 
                  value={stat.value} 
                  {...(stat.suffix && { suffix: stat.suffix })}
                />
              </div>

              {/* 標籤 */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {stat.label}
              </h3>

              {/* 描述 */}
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {stat.description}
              </p>

              {/* 懸停效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* 底部說明 */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              數據持續更新中，每一個數字都代表著一個溫暖的故事
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}