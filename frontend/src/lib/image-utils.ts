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
  const isGitHubPages = process.env.GITHUB_PAGES === 'true' || 
                       (typeof window !== 'undefined' && 
                        window.location.hostname.includes('github.io'));
  
  const repoName = process.env.REPO_NAME || 'huluhulu';
  
  // 確保路徑以 / 開頭
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // 在 GitHub Pages 環境下添加 basePath 前綴
  if (isGitHubPages) {
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