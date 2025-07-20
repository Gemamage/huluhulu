'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { PetService } from '@/services/petService';
import {
  Heart,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Eye,
  Share2,
} from 'lucide-react';
import { Pet } from '@/types/pet';

function PetCard({
  pet,
  onEdit,
  onDelete,
}: {
  pet: Pet;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'found':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'lost':
        return '走失';
      case 'found':
        return '找到';
      default:
        return '未知';
    }
  };

  return (
    <Card className='overflow-hidden hover:shadow-lg transition-shadow'>
      <div className='relative'>
        {pet.images && pet.images.length > 0 ? (
          <img
            src={pet.images[0]}
            alt={pet.name}
            className='w-full h-48 object-cover'
          />
        ) : (
          <div className='w-full h-48 bg-gray-200 flex items-center justify-center'>
            <Heart className='h-12 w-12 text-gray-400' />
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 ${getStatusColor(pet.status)}`}
        >
          {getStatusText(pet.status)}
        </Badge>
      </div>

      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-lg'>{pet.name}</CardTitle>
            <p className='text-sm text-muted-foreground'>{pet.breed}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-2 mb-4'>
          <div className='flex items-center text-sm text-muted-foreground'>
            <MapPin className='h-4 w-4 mr-1' />
            <span className='truncate'>
              {pet.lastSeenLocation?.address || '未提供位置'}
            </span>
          </div>
          <div className='flex items-center text-sm text-muted-foreground'>
            <Calendar className='h-4 w-4 mr-1' />
            <span>
              {pet.lastSeenDate 
                ? new Date(pet.lastSeenDate).toLocaleDateString('zh-TW')
                : '未提供日期'
              }
            </span>
          </div>
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground mb-4'>
          <div className='flex items-center space-x-3'>
            <div className='flex items-center'>
              <Eye className='h-3 w-3 mr-1' />
              <span>{pet.views || 0}</span>
            </div>
            <div className='flex items-center'>
              <Share2 className='h-3 w-3 mr-1' />
              <span>{pet.shares || 0}</span>
            </div>
          </div>
          <span>
            發布於 {new Date(pet.createdAt).toLocaleDateString('zh-TW')}
          </span>
        </div>

        <Separator className='mb-4' />

        <div className='flex space-x-2'>
          <Button variant='outline' size='sm' className='flex-1' asChild>
            <Link href={`/pets/${pet._id}`}>查看詳情</Link>
          </Button>
          <Button variant='outline' size='sm' onClick={() => onEdit(pet._id)}>
            <Edit className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onDelete(pet._id)}
            className='text-red-600 hover:text-red-700'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PetCardSkeleton() {
  return (
    <Card className='overflow-hidden'>
      <Skeleton className='w-full h-48' />
      <CardHeader className='pb-3'>
        <Skeleton className='h-6 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-2 mb-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
        <div className='flex space-x-2'>
          <Skeleton className='h-8 flex-1' />
          <Skeleton className='h-8 w-10' />
          <Skeleton className='h-8 w-10' />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyPetsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const petService = new PetService();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPets();
    }
  }, [isAuthenticated]);

  const fetchMyPets = async () => {
    try {
      setLoading(true);
      const response = await petService.getMyPets();
      setPets(response.data.pets);
    } catch (error) {
      console.error('獲取我的協尋案例失敗:', error);
      toast({
        title: '錯誤',
        description: '無法載入您的協尋案例，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    // 導航到編輯頁面
    window.location.href = `/pets/${id}/edit`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個協尋案例嗎？此操作無法復原。')) {
      return;
    }

    try {
      setDeleting(id);
      await petService.deletePet(id);
      setPets(pets.filter(pet => pet._id !== id));
      toast({
        title: '成功',
        description: '協尋案例已刪除',
      });
    } catch (error) {
      console.error('刪除協尋案例失敗:', error);
      toast({
        title: '錯誤',
        description: '刪除失敗，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <Heart className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h1 className='text-2xl font-bold mb-2'>請先登入</h1>
          <p className='text-muted-foreground mb-6'>
            您需要登入才能查看自己的協尋案例
          </p>
          <Button asChild>
            <Link href='/auth/login'>前往登入</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* 頁面標題 */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>我的協尋案例</h1>
          <p className='text-muted-foreground mt-2'>管理您發布的寵物協尋案例</p>
        </div>
        <Button asChild>
          <Link href='/pets/new'>
            <Plus className='h-4 w-4 mr-2' />
            發布新協尋
          </Link>
        </Button>
      </div>

      {/* 寵物列表 */}
      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, index) => (
            <PetCardSkeleton key={index} />
          ))}
        </div>
      ) : pets.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {pets.map(pet => (
            <PetCard
              key={pet._id}
              pet={pet}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <Heart className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h2 className='text-xl font-semibold mb-2'>還沒有協尋案例</h2>
          <p className='text-muted-foreground mb-6'>
            您還沒有發布任何寵物協尋案例
          </p>
          <Button asChild>
            <Link href='/pets/new'>
              <Plus className='h-4 w-4 mr-2' />
              發布第一個協尋案例
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
