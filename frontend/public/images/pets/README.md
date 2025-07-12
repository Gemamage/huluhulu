# 寵物圖片資料夾

這個資料夾用來存放寵物的示範圖片。

## 使用方式

1. 將您的寵物圖片放在這個資料夾中
2. 建議的圖片格式：JPG、PNG、WebP
3. 建議的圖片尺寸：至少 400x400 像素
4. 檔案命名建議：使用英文和數字，例如：
   - dog-01.jpg
   - cat-02.png
   - pet-sample-03.webp

## 在程式碼中使用

在 React 元件中，您可以這樣引用圖片：

```jsx
// 方法1：直接使用 public 路徑
<img src="/images/pets/dog-01.jpg" alt="狗狗示範圖" />

// 方法2：使用 Next.js Image 元件（推薦）
import Image from 'next/image';

<Image 
  src="/images/pets/dog-01.jpg" 
  alt="狗狗示範圖"
  width={400}
  height={400}
/>
```

## 注意事項

- public 資料夾中的檔案可以直接透過網址存取
- 圖片檔案大小建議控制在 1MB 以下以提升載入速度
- 可以使用線上工具壓縮圖片以減少檔案大小
