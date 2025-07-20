import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Share2, MapPin, Calendar, Heart } from 'lucide-react';
import { petService } from '@/services/petService';
import { useToast } from '@/hooks/use-toast';
import { Pet } from '@/types';

// 擴展 Pet 類型以包含收藏相關屬性
interface ExtendedPet extends Pet {
  favoritedBy?: string[];
  favoriteCount?: number;
}

interface PetCardProps {
  pet: ExtendedPet;
  onClick?: (pet: ExtendedPet) => void;
  currentUserId?: string;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onClick, currentUserId }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(pet.favoriteCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // 檢查當前用戶是否已收藏此寵物
    if (currentUserId && pet.favoritedBy) {
      setIsFavorited(pet.favoritedBy.includes(currentUserId));
    }
  }, [currentUserId, pet.favoritedBy]);

  const getStatusText = (status: ExtendedPet['status']) => {
    switch (status) {
      case 'lost':
        return '走失';
      case 'found':
        return '已找到';
      case 'adopted':
        return '已領養';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ExtendedPet['status']) => {
    switch (status) {
      case 'lost':
        return 'destructive';
      case 'found':
        return 'default';
      case 'adopted':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSizeText = (size: ExtendedPet['size']) => {
    switch (size) {
      case 'small':
        return '小型';
      case 'medium':
        return '中型';
      case 'large':
        return '大型';
      default:
        return size;
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(pet);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發卡片點擊事件

    if (!currentUserId) {
      toast({
        title: '請先登入',
        description: '您需要登入才能收藏寵物',
        variant: 'destructive',
      });
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      if (isFavorited) {
        await petService.unfavoritePet(pet._id);
        setIsFavorited(false);
        setFavoriteCount(prev => Math.max(0, prev - 1));
        toast({
          title: '取消收藏',
          description: '已取消收藏此寵物',
        });
      } else {
        await petService.favoritePet(pet._id);
        setIsFavorited(true);
        setFavoriteCount(prev => prev + 1);
        toast({
          title: '收藏成功',
          description: '已將此寵物加入收藏',
        });
      }
    } catch (error) {
      console.error('收藏操作失敗:', error);
      toast({
        title: '操作失敗',
        description: '收藏操作失敗，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className='cursor-pointer hover:shadow-lg transition-shadow duration-200'
      onClick={handleCardClick}
      role='article'
    >
      <CardHeader className='p-0'>
        <div className='relative w-full aspect-[3/4]'>
          {pet.images && pet.images.length > 0 ? (
            <Image
              src={pet.images[0] || '/placeholder-pet.jpg'}
              alt={pet.name}
              fill={true}
              className='object-cover rounded-t-lg'
            />
          ) : (
            <div className='h-full w-full bg-gray-200 rounded-t-lg flex items-center justify-center'>
              <span className='text-gray-500'>無圖片</span>
            </div>
          )}
          <div className='absolute top-2 right-2 flex flex-col gap-2'>
            <Badge variant={getStatusColor(pet.status)}>
              {getStatusText(pet.status)}
            </Badge>
            {currentUserId && (
              <Button
                variant='ghost'
                size='sm'
                className={`h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 ${
                  isFavorited ? 'text-red-500' : 'text-gray-500'
                }`}
                onClick={handleFavoriteClick}
                disabled={isLoading}
                data-testid='favorite-button'
              >
                <Heart
                  className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-4'>
        <div className='space-y-2'>
          <div className='flex justify-between items-start'>
            <h3 className='text-lg font-semibold'>{pet.name}</h3>
            <div
              className='flex items-center space-x-1'
              data-testid='pet-gender'
            >
              <span className='text-sm text-gray-600'>
                {pet.gender === 'male'
                  ? '♂'
                  : pet.gender === 'female'
                    ? '♀'
                    : '?'}
              </span>
            </div>
          </div>

          {pet.breed && <p className='text-sm text-gray-600'>{pet.breed}</p>}

          {pet.age && <p className='text-sm text-gray-600'>{pet.age}歲</p>}

          <p className='text-sm text-gray-600'>{getSizeText(pet.size)}</p>

          <div className='flex items-center space-x-1 text-sm text-gray-600'>
            <MapPin className='h-4 w-4' />
            <span>{pet.lastSeenLocation ? (typeof pet.lastSeenLocation === 'string' ? pet.lastSeenLocation : pet.lastSeenLocation?.address || '未知地點') : '未知地點'}</span>
          </div>

          <div className='flex justify-between items-center pt-2'>
            <div className='flex items-center space-x-4 text-sm text-gray-500'>
              <div className='flex items-center space-x-1'>
                <Eye className='h-4 w-4' />
                <span>{pet.viewCount}</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Share2 className='h-4 w-4' />
                <span>{pet.shareCount}</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Heart className='h-4 w-4' />
                <span>{favoriteCount}</span>
              </div>
            </div>

            <div className='flex items-center space-x-1 text-xs text-gray-400'>
              <Calendar className='h-3 w-3' />
              <span>{new Date(pet.createdAt).toLocaleDateString('zh-TW')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetCard;
