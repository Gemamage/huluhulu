/**
 * 圖片路徑工具函數
 * 處理 GitHub Pages 環境下的圖片路徑問題
 */

/**
 * 獲取正確的圖片路徑
 * 在 GitHub Pages 環境下自動添加 basePath 前綴
 */
export function getImagePath(imagePath: string): string {
  // 如果是絕對 URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 檢查是否為 GitHub Pages 環境
  const isGitHubPages = 
    // 服務器端渲染時檢查環境變數
    (typeof process !== 'undefined' && process.env.GITHUB_PAGES === 'true') || 
    // 客戶端渲染時檢查 hostname
    (typeof window !== 'undefined' && window.location.hostname.includes('github.io'));
  
  // 確保路徑以 / 開頭
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // 在 GitHub Pages 環境下添加 basePath 前綴
  if (isGitHubPages) {
    // 從 URL 路徑中獲取 repo 名稱，或使用默認值
    let repoName = 'huluhulu';
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      if (pathParts.length > 1 && pathParts[1]) {
        repoName = pathParts[1];
      }
    } else if (typeof process !== 'undefined' && process.env.REPO_NAME) {
      repoName = process.env.REPO_NAME;
    }
    
    return `/${repoName}${normalizedPath}`;
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