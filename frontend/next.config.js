/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'via.placeholder.com',
      // 未來可能會用到的圖片域名
      'cloudinary.com',
      'amazonaws.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  // 啟用嚴格模式
  reactStrictMode: true,
  // 啟用 SWC minify
  swcMinify: true,
  // 編譯時的 ESLint 檢查
  eslint: {
    dirs: ['src'],
  },
  // TypeScript 錯誤處理
  typescript: {
    ignoreBuildErrors: false,
  },
  // 輸出設定
  output: 'standalone',
  // 壓縮設定
  compress: true,
  // 效能優化
  poweredByHeader: false,
  // 重定向設定
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Headers 設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;