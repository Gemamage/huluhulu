'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { PetForm } from '@/components/pets/pet-form';
import { PetService } from '@/services/petService';
import { ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  size: 'small' | 'medium' | 'large';
  color: string;
  status: 'lost' | 'found';
  description: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  reward?: number;
  specialMarks?: string;
  personality?: string;
  healthCondition?: string;
  microchipId?: string;
  isVaccinated?: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface PetFormData {
  name: string;
  type: 'dog' | 'cat' | 'other';
  breed: string;
  gender: 'male' | 'female' | 'unknown';
  age: number;
  size: 'small' | 'medium' | 'large';
  color: string;
  status: 'lost' | 'found';
  description: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  reward?: number;
  specialMarks?: string;
  personality?: string;
  healthCondition?: string;
  microchipId?: string;
  isVaccinated?: boolean;
  images: File[];
}

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const petService = new PetService();

  const petId = params.id as string;

  useEffect(() => {
    if (isAuthenticated && petId) {
      fetchPet();
    }
  }, [isAuthenticated, petId]);

  const fetchPet = async () => {
    try {
      setLoading(true);
      const response = await petService.getPetById(petId);
      const petData = response.data;
      
      // 檢查是否為當前用戶的寵物
      if (petData.userId !== user?.id) {
        toast({
          title: '權限不足',
          description: '您只能編輯自己發布的協尋案例',
          variant: 'destructive',
        });
        router.push('/pets/my');
        return;
      }
      
      setPet(petData);
    } catch (error) {
      console.error('獲取寵物資訊失敗:', error);
      toast({
        title: '錯誤',
        description: '無法載入寵物資訊，請稍後再試',
        variant: 'destructive',
      });
      router.push('/pets/my');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: PetFormData) => {
    if (!pet) return;
    
    try {
      setSubmitting(true);
      
      // 準備更新數據
      const updateData = {
        name: formData.name,
        type: formData.type,
        breed: formData.breed,
        gender: formData.gender,
        age: formData.age,
        size: formData.size,
        color: formData.color,
        status: formData.status,
        description: formData.description,
        lastSeenLocation: formData.lastSeenLocation,
        lastSeenDate: formData.lastSeenDate,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        reward: formData.reward,
        specialMarks: formData.specialMarks,
        personality: formData.personality,
        healthCondition: formData.healthCondition,
        microchipId: formData.microchipId,
        isVaccinated: formData.isVaccinated,
      };
      
      // 更新寵物資訊
      await petService.updatePet(pet._id, updateData);
      
      // 如果有新圖片，上傳圖片
      if (formData.images && formData.images.length > 0) {
        await petService.uploadPetImages(pet._id, formData.images);
      }
      
      toast({
        title: '成功',
        description: '協尋案例已更新',
      });
      
      // 跳轉到寵物詳情頁面
      router.push(`/pets/${pet._id}`);
    } catch (error) {
      console.error('更新寵物資訊失敗:', error);
      toast({
        title: '錯誤',
        description: '更新失敗，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">請先登入</h1>
          <p className="text-muted-foreground mb-6">
            您需要登入才能編輯協尋案例
          </p>
          <Button asChild>
            <Link href="/auth/login">前往登入</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">找不到協尋案例</h1>
          <p className="text-muted-foreground mb-6">
            您要編輯的協尋案例不存在或已被刪除
          </p>
          <Button asChild>
            <Link href="/pets/my">返回我的協尋</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 將 Pet 數據轉換為 PetFormData 格式
  const initialData: PetFormData = {
    name: pet.name,
    type: pet.type,
    breed: pet.breed,
    gender: pet.gender,
    age: pet.age,
    size: pet.size,
    color: pet.color,
    status: pet.status,
    description: pet.description,
    lastSeenLocation: pet.lastSeenLocation,
    lastSeenDate: pet.lastSeenDate,
    contactName: pet.contactName,
    contactPhone: pet.contactPhone,
    contactEmail: pet.contactEmail,
    reward: pet.reward,
    specialMarks: pet.specialMarks,
    personality: pet.personality,
    healthCondition: pet.healthCondition,
    microchipId: pet.microchipId,
    isVaccinated: pet.isVaccinated,
    images: [], // 編輯時不預填圖片
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 返回按鈕和標題 */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/pets/${pet._id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">編輯協尋案例</h1>
            <p className="text-muted-foreground mt-2">
              更新 {pet.name} 的協尋資訊
            </p>
          </div>
        </div>

        {/* 編輯表單 */}
        <Card>
          <CardHeader>
            <CardTitle>協尋資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <PetForm
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              submitButtonText="更新協尋案例"
            />
          </CardContent>
        </Card>

        {/* 溫馨提示 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 編輯提示
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 請確保聯絡資訊是最新的，以便好心人能夠聯繫到您</li>
            <li>• 如果寵物已找到，請記得更新狀態為「找到」</li>
            <li>• 詳細的描述和清晰的照片有助於提高找到寵物的機會</li>
            <li>• 更新後的資訊會立即生效，其他用戶將看到最新內容</li>
          </ul>
        </div>
      </div>
    </div>
  );
}