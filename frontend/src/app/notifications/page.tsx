import { Metadata } from 'next';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { NotificationCenter } from '@/components/notifications';

export const metadata: Metadata = {
  title: '通知中心',
  description: '管理您的通知設定和查看通知歷史',
};

export default function NotificationsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">通知中心</h1>
            <p className="mt-2 text-gray-600">
              管理您的通知偏好設定，查看通知歷史和統計資訊
            </p>
          </div>
          
          <NotificationCenter />
        </div>
      </main>
      <Footer />
    </>
  );
}