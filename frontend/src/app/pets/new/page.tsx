'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FoundPetForm } from '@/components/pets/found-pet-form';
import { petService, PetData } from '@/services/petService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function NewPetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      // 轉換表單數據格式以符合後端 API
      const petData = {
        name: formData.name || '未知',
        type: formData.type,
        breed: formData.breed || '未知',
        age: formData.estimatedAge === 'unknown' ? undefined : formData.estimatedAge,
        gender: formData.gender === 'unknown' ? undefined : formData.gender,
        size: formData.size === 'unknown' ? undefined : formData.size,
        color: formData.color,
        description: formData.description,
        specialMarks: formData.specialMarks,
        behaviorNotes: formData.behaviorNotes,
        healthCondition: formData.healthCondition,
        hasCollar: formData.hasCollar,
        collarDescription: formData.collarDescription,
        isInjured: formData.isInjured,
        images: formData.images,
        status: 'found' as const,
        location: {
          address: formData.foundLocation.address,
          latitude: formData.foundLocation.latitude,
          longitude: formData.foundLocation.longitude,
        },
        foundDate: formData.foundDate,
        foundTime: formData.foundTime,
        contact: {
          name: formData.finderContact.name,
          phone: formData.finderContact.phone,
          email: formData.finderContact.email,
          preferredContact: formData.finderContact.preferredContact,
        },
      };
      
      const response = await petService.createPet(petData);
      
      if (response.success && response.data) {
        toast({
          title: '拾獲通報發布成功',
          description: '感謝您的愛心，拾獲通報已成功發布',
        });
        
        // 跳轉到新建立的寵物詳情頁面
        router.push(`/pets/${response.data.pet.id}`);
      }
    } catch (error) {
      console.error('發布拾獲通報失敗:', error);
      toast({
        title: '發布失敗',
        description: error instanceof Error ? error.message : '發生未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 返回按鈕 */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/pets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回寵物列表
          </Link>
        </Button>
      </div>

      {/* 頁面標題 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            拾獲通報
          </CardTitle>
          <CardDescription>
            感謝您的愛心，請填寫以下資訊，為牠建立一個回家的機會
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 表單 */}
      <Card>
        <CardContent className="pt-6">
          <FoundPetForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="發布拾獲通報"
          />
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">溫馨提示</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 請提供清晰的寵物照片，有助於他人識別</li>
          <li>• 詳細描述寵物的特徵和最後出現地點</li>
          <li>• 保持聯絡方式暢通，以便好心人士聯繫</li>
          <li>• 定期更新案例狀態，找到寵物後請及時標記為已找到</li>
        </ul>
      </div>
    </div>
  );
}