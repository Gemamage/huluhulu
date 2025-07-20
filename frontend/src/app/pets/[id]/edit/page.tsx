'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { PetService } from '@/services/petService';
import { PetForm } from '@/components/pets/pet-form';
import { Pet } from '@/types/pet';
import { Heart, ArrowLeft } from 'lucide-react';

// 使用與 PetForm 組件相同的介面定義
interface PetFormData {
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
  breed?: string;
  gender: 'male' | 'female' | 'unknown';
  age?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  status: 'lost' | 'found';
  description?: string;
  lastSeenLocation: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  lastSeenDate: string;
  contactInfo: {
    name: string;
    phone: string;
    email?: string;
    preferredContact: 'phone' | 'email';
  };
  images?: string[];
  reward?: number;
  isUrgent: boolean;
  microchipId?: string;
  vaccinated?: boolean;
  medicalConditions?: string;
  specialMarks?: string;
  personality?: string;
  healthCondition?: string;
  isVaccinated?: boolean;
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

  const petId = params?.id as string;

  useEffect(() => {
    if (isAuthenticated && petId) {
      fetchPet();
    }
  }, [isAuthenticated, petId]);

  const fetchPet = async () => {
    try {
      setLoading(true);
      const petData = await petService.getPetById(petId);

      // 檢查是否為當前用戶的寵物
      if (petData.owner !== user?.id) {
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

      // 準備更新數據 - 只包含有值的屬性
      const updateData: any = {
        name: formData.name,
        status: formData.status,
        description: formData.description,
        lastSeenLocation: formData.lastSeenLocation.latitude && formData.lastSeenLocation.longitude 
          ? {
              address: formData.lastSeenLocation.address,
              coordinates: [formData.lastSeenLocation.longitude, formData.lastSeenLocation.latitude] as [number, number]
            }
          : {
              address: formData.lastSeenLocation.address,
              coordinates: [0, 0] as [number, number] // 預設座標
            },
        contactInfo: {
          phone: formData.contactInfo.phone,
          email: formData.contactInfo.email,
          preferredContact: formData.contactInfo.preferredContact
        }
      };

      // 只添加有值的可選屬性
      if (formData.breed) updateData.breed = formData.breed;
      if (formData.age) updateData.age = formData.age;
      if (formData.gender) updateData.gender = formData.gender;
      if (formData.size) updateData.size = formData.size;
      if (formData.color) updateData.color = formData.color;

      // 更新寵物資訊
      await petService.updatePet(pet._id, updateData);

      // 注意：在編輯模式下，圖片已經存在於伺服器上
      // 如果需要新增或修改圖片，應該通過專門的圖片管理功能來處理
      // 這裡暫時跳過圖片上傳邏輯

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
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <Heart className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h1 className='text-2xl font-bold mb-2'>請先登入</h1>
          <p className='text-muted-foreground mb-6'>
            您需要登入才能編輯協尋案例
          </p>
          <Button asChild>
            <Link href='/auth/login'>前往登入</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto'>
          <div className='flex items-center space-x-4 mb-8'>
            <Skeleton className='h-10 w-10' />
            <div className='space-y-2'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-4 w-64' />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-6'>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
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
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <Heart className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h1 className='text-2xl font-bold mb-2'>找不到協尋案例</h1>
          <p className='text-muted-foreground mb-6'>
            您要編輯的協尋案例不存在或已被刪除
          </p>
          <Button asChild>
            <Link href='/pets/my'>返回我的協尋</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 將 Pet 數據轉換為 PetFormData 格式
  const initialData: PetFormData = {
    name: pet.name,
    type: pet.type as 'dog' | 'cat' | 'other',
    breed: pet.breed || '',
    gender: pet.gender as 'male' | 'female' | 'unknown',
    age: pet.age || 0,
    size: pet.size as 'small' | 'medium' | 'large',
    color: pet.color || '',
    status: pet.status as 'lost' | 'found',
    description: pet.description || '',
    lastSeenLocation: {
      address: typeof pet.lastSeenLocation === 'string'
        ? pet.lastSeenLocation
        : pet.lastSeenLocation?.address || '',
      latitude: typeof pet.lastSeenLocation === 'object' && pet.lastSeenLocation?.coordinates
        ? pet.lastSeenLocation.coordinates[1]
        : 0,
      longitude: typeof pet.lastSeenLocation === 'object' && pet.lastSeenLocation?.coordinates
        ? pet.lastSeenLocation.coordinates[0]
        : 0
    },
    lastSeenDate: pet.lastSeenDate ? new Date(pet.lastSeenDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    contactInfo: {
      name: pet.contactName || '',
      phone: pet.contactPhone || '',
      email: pet.contactEmail || '',
      preferredContact: 'phone' as 'phone' | 'email',
    },
    images: [],
    reward: 0,
    isUrgent: false,
    microchipId: '',
    vaccinated: false,
    medicalConditions: '',
    specialMarks: '',
    personality: '',
    healthCondition: '',
    isVaccinated: false
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-2xl mx-auto'>
        {/* 返回按鈕和標題 */}
        <div className='flex items-center space-x-4 mb-8'>
          <Button variant='outline' size='icon' asChild>
            <Link href={`/pets/${pet._id}`}>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>編輯協尋案例</h1>
            <p className='text-muted-foreground mt-2'>
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
              submitButtonText='更新協尋案例'
            />
          </CardContent>
        </Card>

        {/* 溫馨提示 */}
        <div className='mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
          <h3 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
            💡 編輯提示
          </h3>
          <ul className='text-sm text-blue-700 dark:text-blue-300 space-y-1'>
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
