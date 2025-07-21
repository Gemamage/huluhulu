/**
 * 圖片路徑工具函數
 * Next.js 會自動處理 basePath 和 assetPrefix，所以我們只需要返回標準化的路徑
 */

/**
 * 獲取正確的圖片路徑
 * Next.js 配置中的 basePath 會自動處理 GitHub Pages 路徑前綴
 */
export function getImagePath(imagePath: string): string {
  // 如果是絕對 URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 確保路徑以 / 開頭，讓 Next.js 自動處理 basePath
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
}

/**
 * 獲取 Next.js Image 組件的 src 屬性
 * 專門用於 Next.js Image 組件
 */
export function getNextImageSrc(imagePath: string): string {
  return getImagePath(imagePath);
}