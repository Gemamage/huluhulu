/**
 * 圖片路徑工具函數
 * 處理 GitHub Pages 部署時的路徑前綴問題
 */

/**
 * 檢查是否為 GitHub Pages 環境
 */
function isGitHubPages(): boolean {
  if (typeof window === 'undefined') {
    // 服務端渲染時，檢查環境變數
    return process.env.GITHUB_PAGES === 'true';
  }
  // 客戶端檢查
  return window.location.hostname.includes('github.io');
}

/**
 * 獲取正確的圖片路徑
 * 在 GitHub Pages 環境下添加 /huluhulu/ 前綴
 */
export function getImagePath(imagePath: string): string {
  // 如果是絕對 URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 確保路徑以 / 開頭
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // 在 GitHub Pages 環境下添加 basePath 前綴
  if (isGitHubPages()) {
    return `/huluhulu${normalizedPath}`;
  }
  
  return normalizedPath;
}

/**
 * 獲取 Next.js Image 組件的 src 屬性
 * 專門用於 Next.js Image 組件
 */
export function getNextImageSrc(imagePath: string): string {
  return getImagePath(imagePath);
}