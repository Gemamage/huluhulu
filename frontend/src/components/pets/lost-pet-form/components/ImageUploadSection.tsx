'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, X, Upload } from 'lucide-react';
import { LostPetFormData } from '../types';

interface ImageUploadSectionProps {
  formData: LostPetFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof LostPetFormData, value: any) => void;
}

export function ImageUploadSection({
  formData,
  errors,
  onInputChange,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = [...formData.images, ...files].slice(0, 5); // 最多5張圖片
      onInputChange('images', newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    onInputChange('images', newImages);
  };

  const getImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Camera className='h-5 w-5' />
          寵物照片
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <Label>上傳寵物照片 *</Label>
          <p className='text-sm text-gray-600 mb-4'>
            請上傳清晰的寵物照片，有助於他人辨識（最多5張）
          </p>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {formData.images.map((image, index) => (
              <div key={index} className='relative group'>
                <img
                  src={typeof image === 'string' ? image : getImagePreview(image)}
                  alt={`寵物照片 ${index + 1}`}
                  className='w-full h-24 object-cover rounded-lg border'
                />
                <button
                  type='button'
                  onClick={() => removeImage(index)}
                  className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            ))}

            {formData.images.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className='w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors'
              >
                <Upload className='h-6 w-6 text-gray-400 mb-1' />
                <span className='text-xs text-gray-500'>上傳照片</span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            onChange={handleImageUpload}
            className='hidden'
          />

          {formData.images.length < 5 && (
            <Button
              type='button'
              variant='outline'
              onClick={() => fileInputRef.current?.click()}
              className='mt-4 w-full'
            >
              <Camera className='h-4 w-4 mr-2' />
              選擇照片
            </Button>
          )}

          {errors.images && (
            <p className='text-red-500 text-sm mt-2'>{errors.images}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
