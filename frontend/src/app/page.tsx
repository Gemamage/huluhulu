import { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { RecentPosts } from '@/components/sections/recent-posts';
import { Statistics } from '@/components/sections/statistics';
import { CallToAction } from '@/components/sections/call-to-action';

export const metadata: Metadata = {
  title: '首頁',
  description: '呼嚕寵物協尋網站 - 幫助您找回心愛的寵物夥伴',
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className='flex-1'>
        {/* 主視覺區塊 */}
        <Hero />
        
        {/* 統計數據區塊 */}
        <Statistics />
        
        {/* 功能特色區塊 */}
        <Features />
        
        {/* 最新協尋案例 */}
        <RecentPosts />
        
        {/* 行動呼籲區塊 */}
        <CallToAction />
      </main>
      
      {/* 頁腳 */}
      <Footer />
    </>
  );
}