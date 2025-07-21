'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { PetService } from '@/services/petService';
import { Pet } from '@/types';
import {
  Heart,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Share2,
  Edit,
  Trash2,
  ArrowLeft,
  User,
  Clock,
} from 'lucide-react';

interface PetDetailClientProps {
  petId: string;
}

export default function PetDetailClient({ petId }: PetDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const petService = new PetService();

  useEffect(() => {
    if (petId) {
      fetchPet();
    }
  }, [petId]);

  const fetchPet = async () => {
    try {
      setLoading(true);
      const petData = await petService.getPetById(petId);
      setPet(petData);
    } catch (error) {
      console.error('獲取寵物資訊失敗:', error);
      toast({
        title: '錯誤',
        description: '無法載入寵物資訊，請稍後再試',
        variant: 'destructive',
      });
      router.push('/pets');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    // 檢查是否在瀏覽器環境中
    if (typeof window === 'undefined') return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `協尋 ${pet?.name}`,
          text: `請幫忙協尋 ${pet?.name}！`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('分享失敗:', error);
      }
    } else {
      // 備用方案：複製到剪貼板
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: '已複製',
          description: '連結已複製到剪貼板',
        });
      } catch (error) {
        console.error('複製失敗:', error);
        toast({
          title: '錯誤',
          description: '無法複製連結',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!pet || (typeof window !== 'undefined' && !window.confirm('確定要刪除這個協尋案例嗎？此操作無法復原。'))) {
      return;
    }
    
    // 如果在服務器端，直接返回
    if (typeof window === 'undefined') return;

    try {
      setDeleting(true);
      await petService.deletePet(pet._id);
      toast({
        title: '成功',
        description: '協尋案例已刪除',
      });
      router.push('/pets/my');
    } catch (error) {
      console.error('刪除失敗:', error);
      toast({
        title: '錯誤',
        description: '刪除失敗，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center space-x-4 mb-8'>
            <Skeleton className='h-10 w-10' />
            <Skeleton className='h-8 w-48' />
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='space-y-6'>
              <Skeleton className='h-96 w-full rounded-lg' />
              <div className='grid grid-cols-3 gap-4'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className='h-24 w-full rounded-lg' />
                ))}
              </div>
            </div>
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <Skeleton className='h-8 w-32' />
                  <Skeleton className='h-6 w-24' />
                </CardHeader>
                <CardContent className='space-y-4'>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className='flex justify-between'>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-4 w-32' />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
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
            您要查看的協尋案例不存在或已被刪除
          </p>
          <Button asChild>
            <Link href='/pets'>瀏覽其他協尋案例</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner =
    user &&
    ((typeof pet.owner === 'object' && pet.owner._id === user.id) ||
      (typeof pet.owner === 'string' && pet.owner === user.id));

  const ownerName =
    typeof pet.owner === 'object' ? pet.owner.name : pet.contactName;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'found':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        {/* 返回按鈕和操作按鈕 */}
        <div className='flex items-center justify-between mb-8'>
          <Button variant='outline' size='icon' asChild>
            <Link href='/pets'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm' onClick={handleShare}>
              <Share2 className='h-4 w-4 mr-2' />
              分享
            </Button>
            {isOwner && (
              <>
                <Button variant='outline' size='sm' asChild>
                  <Link href={`/pets/${pet._id}/edit`}>
                    <Edit className='h-4 w-4 mr-2' />
                    編輯
                  </Link>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleDelete}
                  disabled={deleting}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  {deleting ? '刪除中...' : '刪除'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* 圖片區域 */}
          <div className='space-y-6'>
            {/* 主圖片 */}
            <div className='relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'>
              {pet.images && pet.images.length > 0 ? (
                <Image
                  src={pet.images[0]}
                  alt={pet.name}
                  fill
                  className='object-cover'
                  priority
                />
              ) : (
                <div className='flex items-center justify-center h-full'>
                  <Heart className='h-16 w-16 text-muted-foreground' />
                </div>
              )}
            </div>

            {/* 縮圖 */}
            {pet.images && pet.images.length > 1 && (
              <div className='grid grid-cols-3 gap-4'>
                {pet.images.slice(1, 4).map((image, index) => (
                  <div
                    key={index}
                    className='relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
                  >
                    <Image
                      src={image}
                      alt={`${pet.name} ${index + 2}`}
                      fill
                      className='object-cover'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 資訊區域 */}
          <div className='space-y-6'>
            {/* 基本資訊 */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-2xl'>{pet.name}</CardTitle>
                  <Badge className={getStatusColor(pet.status)}>
                    {getStatusText(pet.status)}
                  </Badge>
                </div>
                <p className='text-muted-foreground'>
                  {pet.type === 'dog'
                    ? '狗'
                    : pet.type === 'cat'
                    ? '貓'
                    : '其他'}
                  {pet.breed && ` • ${pet.breed}`}
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                {pet.gender && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>性別</span>
                    <span>
                      {pet.gender === 'male'
                        ? '公'
                        : pet.gender === 'female'
                        ? '母'
                        : '未知'}
                    </span>
                  </div>
                )}
                {pet.age && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>年齡</span>
                    <span>{pet.age} 歲</span>
                  </div>
                )}
                {pet.size && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>體型</span>
                    <span>
                      {pet.size === 'small'
                        ? '小型'
                        : pet.size === 'medium'
                        ? '中型'
                        : '大型'}
                    </span>
                  </div>
                )}
                {pet.color && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>顏色</span>
                    <span>{pet.color}</span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>發布時間</span>
                  <span className='flex items-center'>
                    <Clock className='h-4 w-4 mr-1' />
                    {formatDate(pet.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 最後出現地點 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <MapPin className='h-5 w-5 mr-2' />
                  最後出現地點
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  {typeof pet.lastSeenLocation === 'string'
                    ? pet.lastSeenLocation
                    : pet.lastSeenLocation?.address || '未提供地址'}
                </p>
                {pet.lastSeenDate && (
                  <p className='text-sm text-muted-foreground mt-2 flex items-center'>
                    <Calendar className='h-4 w-4 mr-1' />
                    {formatDate(pet.lastSeenDate)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 描述 */}
            {pet.description && (
              <Card>
                <CardHeader>
                  <CardTitle>詳細描述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='whitespace-pre-wrap'>{pet.description}</p>
                </CardContent>
              </Card>
            )}

            {/* 聯絡資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <User className='h-5 w-5 mr-2' />
                  聯絡資訊
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>聯絡人</span>
                  <span>{ownerName || '未提供'}</span>
                </div>
                {pet.contactPhone && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground flex items-center'>
                      <Phone className='h-4 w-4 mr-1' />
                      電話
                    </span>
                    <a
                      href={`tel:${pet.contactPhone}`}
                      className='text-blue-600 hover:text-blue-700 dark:text-blue-400'
                    >
                      {pet.contactPhone}
                    </a>
                  </div>
                )}
                {pet.contactEmail && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground flex items-center'>
                      <Mail className='h-4 w-4 mr-1' />
                      信箱
                    </span>
                    <a
                      href={`mailto:${pet.contactEmail}`}
                      className='text-blue-600 hover:text-blue-700 dark:text-blue-400'
                    >
                      {pet.contactEmail}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 溫馨提示 */}
        <div className='mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
          <h3 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
            💡 協尋提示
          </h3>
          <ul className='text-sm text-blue-700 dark:text-blue-300 space-y-1'>
            <li>• 如果您看到這隻寵物，請立即聯繫飼主</li>
            <li>• 請不要驚嚇或追趕走失的寵物</li>
            <li>• 可以用食物或玩具吸引寵物注意</li>
            <li>• 分享此協尋資訊給更多人，增加找到的機會</li>
          </ul>
        </div>
      </div>
    </div>
  );
}