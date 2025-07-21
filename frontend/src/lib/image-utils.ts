/**
 * 圖片路徑工具函數
 * 用於處理不同環境下的圖片路徑
 */

/**
 * 獲取正確的圖片路徑
 * @param imagePath - 原始圖片路徑
 * @returns 處理後的圖片路徑
 */
export function getImagePath(imagePath: string): string {
  // 如果是絕對 URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 確保路徑以 / 開頭
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // 檢查是否為 GitHub Pages 環境
  const isGitHubPages = typeof window !== 'undefined' 
    ? window.location.hostname.includes('github.io')
    : process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true';

  if (isGitHubPages) {
    // 從 window.location.pathname 動態獲取倉庫名稱
    let repoName = 'huluhulu'; // 默認值
    
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        repoName = pathSegments[0];
      }
    } else {
      // 服務器端渲染時使用環境變數
      repoName = process.env.GITHUB_REPOSITORY_NAME || 'huluhulu';
    }

    return `/${repoName}${normalizedPath}`;
  }

  // 本地開發環境直接返回路徑
  return normalizedPath;
}

/**
 * 獲取寵物圖片路徑
 * @param petId - 寵物 ID
 * @param imageFileName - 圖片文件名
 * @returns 完整的圖片路徑
 */
export function getPetImagePath(petId: string, imageFileName: string): string {
  const imagePath = `/images/pets/${petId}/${imageFileName}`;
  return getImagePath(imagePath);
}

/**
 * 獲取 Logo 圖片路徑
 * @param logoFileName - Logo 文件名
 * @returns 完整的 Logo 路徑
 */
export function getLogoPath(logoFileName: string): string {
  const imagePath = `/images/logo/${logoFileName}`;
  return getImagePath(imagePath);
}

/**
 * 獲取圖標路徑
 * @param iconFileName - 圖標文件名
 * @returns 完整的圖標路徑
 */
export function getIconPath(iconFileName: string): string {
  const imagePath = `/images/icons/${iconFileName}`;
  return getImagePath(imagePath);
}