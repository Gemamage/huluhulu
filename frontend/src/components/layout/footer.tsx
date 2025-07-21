'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className='bg-stone-100 py-12 mt-16'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {/* 多欄式連結區 */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          {/* 關於我們 */}
          <div>
            <h3 className='text-base font-semibold text-zinc-800 mb-4'>
              關於我們
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/about'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  我們的故事
                </Link>
              </li>
              <li>
                <Link
                  href='/team'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  團隊介紹
                </Link>
              </li>
              <li>
                <Link
                  href='/mission'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  使命願景
                </Link>
              </li>
              <li>
                <Link
                  href='/news'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  最新消息
                </Link>
              </li>
            </ul>
          </div>

          {/* 服務項目 */}
          <div>
            <h3 className='text-base font-semibold text-zinc-800 mb-4'>
              服務項目
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/pets/found'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  拾獲通報
                </Link>
              </li>
              <li>
                <Link
                  href='/pets/lost'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  走失尋找
                </Link>
              </li>
              <li>
                <Link
                  href='/pets/search'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  智能搜尋
                </Link>
              </li>
              <li>
                <Link
                  href='/pets/map'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  地圖搜尋
                </Link>
              </li>
            </ul>
          </div>

          {/* 幫助中心 */}
          <div>
            <h3 className='text-base font-semibold text-zinc-800 mb-4'>
              幫助中心
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/help/guide'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  使用指南
                </Link>
              </li>
              <li>
                <Link
                  href='/help/faq'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  常見問題
                </Link>
              </li>
              <li>
                <Link
                  href='/help/tips'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  協尋技巧
                </Link>
              </li>
              <li>
                <Link
                  href='/help/safety'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  安全須知
                </Link>
              </li>
            </ul>
          </div>

          {/* 聯絡我們 */}
          <div>
            <h3 className='text-base font-semibold text-zinc-800 mb-4'>
              聯絡我們
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/contact'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  聯絡方式
                </Link>
              </li>
              <li>
                <Link
                  href='/feedback'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  意見回饋
                </Link>
              </li>
              <li>
                <Link
                  href='/partnership'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  合作提案
                </Link>
              </li>
              <li>
                <Link
                  href='/volunteer'
                  className='text-zinc-600 hover:text-amber-600 transition-colors'
                >
                  志工招募
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 版權宣告區 */}
        <div className='mt-12 border-t border-stone-200 pt-8'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <div className='text-center md:text-left text-sm text-zinc-500'>
              © 2025 呼嚕 (Hūlū). All Rights Reserved.
            </div>
            <div className='flex items-center space-x-4 text-sm text-zinc-500'>
              <Link
                href='/privacy'
                className='hover:text-amber-600 transition-colors'
              >
                隱私政策
              </Link>
              <Link
                href='/terms'
                className='hover:text-amber-600 transition-colors'
              >
                服務條款
              </Link>
              <div className='flex items-center space-x-1'>
                <span>Made with</span>
                <Heart className='h-4 w-4 text-red-500' />
                <span>for pets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
