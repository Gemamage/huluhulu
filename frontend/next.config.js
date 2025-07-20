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
    unoptimized: false, // Netlify 支援圖片優化
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
    ignoreDuringBuilds: false,
  },
  // TypeScript 錯誤處理
  typescript: {
    ignoreBuildErrors: false,
  },
  // 靜態導出設定 - 適用於 Netlify 部署
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // 壓縮設定
  compress: true,
  // 效能優化
  poweredByHeader: false,
  generateEtags: false,
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
  // Headers 設定 - 支援 Dify 聊天機器人
  async headers() {
    const cspHeader = `
      script-src 'self' 'unsafe-inline' 'unsafe-eval' *.dify.dev *.dify.ai *.udify.app udify.app https://www.gstatic.com;
      script-src-elem 'self' 'unsafe-inline' *.dify.dev *.dify.ai *.udify.app udify.app https://www.gstatic.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data:;
      connect-src 'self' http://localhost:3001 https://localhost:3001 localhost:3001 *.dify.dev *.dify.ai *.udify.app udify.app https://*.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://fcm.googleapis.com;
      frame-src 'self' *.dify.dev *.dify.ai *.udify.app udify.app;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN', // 改為 SAMEORIGIN 以支援 iframe
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;