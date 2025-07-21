/** @type {import('next').NextConfig} */

// GitHub Pages 配置
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const repoName = process.env.REPO_NAME || 'huluhulu'

const nextConfig = {
  // 圖片配置
  images: {
    unoptimized: true, // 靜態導出模式需要禁用圖片優化
  },
  // 環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-value',
  },
  // React 嚴格模式
  reactStrictMode: true,
  // 編譯時忽略錯誤
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 靜態導出設定 - GitHub Pages 需要
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  // GitHub Pages 路徑設定
  basePath: isGitHubPages ? `/${repoName}` : '',
  assetPrefix: isGitHubPages ? `/${repoName}/` : '',
};

module.exports = nextConfig;