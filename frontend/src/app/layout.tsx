import type { Metadata } from 'next';
import { Inter, Noto_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import DifyChatbotLoader from '@/components/DifyChatbotLoader';

const inter = Inter({ subsets: ['latin'] });
const notoSansTC = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '呼嚕寵物協尋網站',
    template: '%s | 呼嚕寵物協尋網站',
  },
  description: '專為寵物走失協尋而設計的全端網站應用程式',
  keywords: [
    '寵物協尋',
    '走失寵物',
    '寵物找回',
    '寵物社群',
    '台灣寵物',
    '狗狗協尋',
    '貓咪協尋',
  ],
  authors: [{ name: '程式小白' }],
  creator: '程式小白',
  publisher: '呼嚕寵物協尋網站',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pet-finder.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://pet-finder.com',
    title: '呼嚕寵物協尋網站',
    description: '專為寵物走失協尋而設計的全端網站應用程式',
    siteName: '呼嚕寵物協尋網站',
  },
  twitter: {
    card: 'summary_large_image',
    title: '呼嚕寵物協尋網站',
    description: '專為寵物走失協尋而設計的全端網站應用程式',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='zh-TW' suppressHydrationWarning>
      <body
        className={`${inter.className} ${notoSansTC.variable} bg-stone-50 text-zinc-700`}
      >
        <Providers>
          <div className='relative flex min-h-screen flex-col'>
            <div className='flex-1'>
              <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
                {children}
              </div>
            </div>
          </div>
          <Toaster />
          <DifyChatbotLoader />
        </Providers>

        {/* Dify 聊天機器人腳本 */}
        <script
          src='https://udify.app/embed.min.js'
          id='FKpA4O7UI8g4LQaf'
          defer
        />
      </body>
    </html>
  );
}
