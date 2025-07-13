'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxFileSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'pet');

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload/single`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('圖片上傳失敗');
    }

    const result = await response.json();
    return result.data.imageUrl;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // 檢查檔案數量限制
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: '檔案數量超過限制',
        description: `最多只能上傳 ${maxImages} 張圖片`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const newImages: string[] = [];
      
      for (const file of fileArray) {
        // 檢查檔案類型
        if (!acceptedTypes.includes(file.type)) {
          toast({
            title: '檔案類型不支援',
            description: `請上傳 ${acceptedTypes.join(', ')} 格式的圖片`,
            variant: 'destructive',
          });
          continue;
        }

        // 檢查檔案大小
        if (file.size > maxFileSize * 1024 * 1024) {
          toast({
            title: '檔案過大',
            description: `檔案大小不能超過 ${maxFileSize}MB`,
            variant: 'destructive',
          });
          continue;
        }

        try {
          // 上傳到伺服器並獲取 URL
          const imageUrl = await uploadImageToServer(file);
          newImages.push(imageUrl);
        } catch (error) {
          console.error('單個檔案上傳失敗:', error);
          toast({
            title: '檔案上傳失敗',
            description: `${file.name} 上傳失敗`,
            variant: 'destructive',
          });
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        
        toast({
          title: '圖片上傳成功',
          description: `已成功上傳 ${newImages.length} 張圖片`,
        });
      }
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      toast({
        title: '上傳失敗',
        description: '圖片上傳過程中發生錯誤，請重試',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* 上傳區域 */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Upload className="h-8 w-8 text-gray-600" />
            </div>
            
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">
                拖曳照片到此處，或點擊上傳
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支援 JPG、PNG、WebP 格式，單檔最大 {maxFileSize}MB
              </p>
              <p className="text-sm text-gray-500">
                最多可上傳 {maxImages} 張照片
              </p>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              disabled={isUploading}
              onClick={(e) => e.stopPropagation()}
            >
              {isUploading ? '上傳中...' : '選擇檔案'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 隱藏的檔案輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 圖片預覽 */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            已選擇的照片 ({images.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`預覽圖片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* 刪除按鈕 */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* 圖片編號 */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}