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
    icon: <Heart className='w-8 h-8' />,
    value: 1234,
    label: '成功協尋',
    description: '已成功幫助寵物回家',
    color: 'text-red-500',
    suffix: '+',
  },
  {
    id: 'registered-users',
    icon: <Users className='w-8 h-8' />,
    value: 5678,
    label: '註冊用戶',
    description: '活躍的愛心用戶',
    color: 'text-blue-500',
    suffix: '+',
  },
  {
    id: 'coverage-cities',
    icon: <MapPin className='w-8 h-8' />,
    value: 22,
    label: '服務縣市',
    description: '全台灣服務範圍',
    color: 'text-green-500',
  },
  {
    id: 'average-time',
    icon: <Clock className='w-8 h-8' />,
    value: 3.5,
    label: '平均協尋時間',
    description: '快速找回毛孩',
    color: 'text-purple-500',
    suffix: '天',
  },
  {
    id: 'success-rate',
    icon: <Award className='w-8 h-8' />,
    value: 87,
    label: '成功率',
    description: '高效的協尋成果',
    color: 'text-yellow-500',
    suffix: '%',
  },
  {
    id: 'monthly-growth',
    icon: <TrendingUp className='w-8 h-8' />,
    value: 15,
    label: '月成長率',
    description: '持續成長的社群',
    color: 'text-indigo-500',
    suffix: '%',
  },
];

function AnimatedCounter({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}) {
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
    <span className='font-bold text-4xl text-zinc-700'>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export function Statistics({ className }: StatisticsProps) {
  return (
    <section
      id='statistics-section'
      className={cn('py-16 sm:py-24', className)}
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {/* 標題區塊 */}
        <div className='text-center mb-16'>
          <h2 class='text-3xl font-bold text-gray-800 mb-4'>
            我們的<span class='text-primary'>成果</span>
          </h2>
          <p class='text-lg text-zinc-600 max-w-3xl mx-auto mb-8'>
            透過「<span class='text-primary font-semibold'>科技</span>」與「
            <span class='text-primary font-semibold'>愛心</span>
            」，我們已經幫助無數家庭重新團聚
          </p>
        </div>

        {/* 統計數據網格 */}
        <div className='grid grid-cols-2 md:grid-cols-3 gap-8'>
          {statisticsData.map((stat, index) => (
            <div
              key={stat.id}
              className='bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center p-8'
            >
              {/* 圖示 */}
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-amber-100'>
                <div className='text-amber-500'>{stat.icon}</div>
              </div>

              {/* 數值 */}
              <div className='mb-4'>
                <AnimatedCounter
                  value={stat.value}
                  {...(stat.suffix && { suffix: stat.suffix })}
                />
              </div>

              {/* 標籤 */}
              <h3 className='text-lg font-semibold mb-2 text-zinc-700'>
                {stat.label}
              </h3>

              {/* 描述 */}
              <p className='leading-relaxed text-zinc-600'>
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* 底部說明 */}
        <div className='mt-16 text-center'>
          <div className='inline-flex items-center gap-2 px-6 py-3 bg-amber-50 rounded-full border border-amber-200'>
            <TrendingUp className='w-5 h-5 text-amber-600' />
            <span className='text-amber-800 font-medium'>
              數據持續更新中，每一個數字都代表著一個溫暖的故事
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
