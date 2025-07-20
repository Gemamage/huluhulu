'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import LostPetForm from '@/components/pets/lost-pet-form';
import { petService } from '@/services/petService';
import { CreatePetData } from '@/types';

export default function LostPetPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    try {
      // 轉換表單數據格式以符合後端 API
      const petData: CreatePetData = {
        name: formData.name,
        type: formData.type,
        breed: formData.breed,
        age: formData.age,
        gender: formData.gender,
        size: formData.size,
        color: formData.color,
        description: formData.description,
        status: 'lost' as const,
        lastSeenLocation: {
          address: formData.lostLocation?.address || '',
          coordinates: [
            formData.lostLocation?.longitude || 0,
            formData.lostLocation?.latitude || 0
          ] as [number, number],
        },
        contactInfo: {
          phone: formData.ownerContact?.phone || '',
          email: formData.ownerContact?.email || '',
          preferredContact: formData.ownerContact?.preferredContact || 'phone',
        },
        images: formData.images || [],
      };

      const result = await petService.createPet(petData);

      toast({
        title: '走失協尋發布成功',
        description: '您的走失協尋已成功發布，我們會盡力幫助您找回寶貝',
      });

      // 導向到寵物詳情頁面
      router.push(`/pets/${result.id}`);
    } catch (error) {
      console.error('發布走失協尋失敗:', error);
      toast({
        title: '發布失敗',
        description: '發布走失協尋時發生錯誤，請稍後再試',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 py-8'>
        {/* 頁面標題區域 */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-4 p-0 h-auto font-normal text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            返回
          </Button>

          <div className='text-center'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              刊登走失協尋
            </h1>
            <p className='text-lg text-gray-600'>
              請詳細填寫您寶貝的資訊，讓我們一起幫助牠回家。
            </p>
          </div>
        </div>

        {/* 表單區域 */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <LostPetForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
