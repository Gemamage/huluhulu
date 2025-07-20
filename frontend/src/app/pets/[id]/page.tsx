'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { petService } from '@/services/petService';
import { Pet } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Share2,
  AlertTriangle,
  Info,
  Award,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';



function PetDetailSkeleton() {
  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <div className='mb-6'>
        <Skeleton className='h-10 w-32' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <div className='flex justify-between items-start'>
                <div className='space-y-2'>
                  <Skeleton className='h-8 w-48' />
                  <Skeleton className='h-4 w-32' />
                </div>
                <Skeleton className='h-6 w-16' />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className='aspect-video w-full mb-4' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-24' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [similarPets] = useState<Pet[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const petId = params?.id as string;

  useEffect(() => {
    if (petId) {
      loadPetDetail(petId);
    }
  }, [petId]);

  const loadSimilarPets = async () => {
    try {
      setLoadingSimilar(true);
      // 暫時註解掉，因為 searchSimilarPets 方法不存在
      // const response = await petService.searchSimilarPets({
      //   type: currentPet.type,
      //   location: currentPet.lastSeenLocation?.address || '',
      //   excludeId: currentPet._id,
      // });

      // if (response.success && response.data) {
      //   setSimilarPets(response.data.similarPets.slice(0, 3));
      // }
    } catch (error) {
      console.error('載入相似寵物失敗:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const loadPetDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await petService.getPetById(id);

      if (response) {
        setPet(response);
        loadSimilarPets(response);
      } else {
        toast({
          title: '載入失敗',
          description: '找不到該寵物資訊',
          variant: 'destructive',
        });
        router.push('/pets');
      }
    } catch (error) {
      console.error('載入寵物詳情失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入寵物詳情，請稍後再試',
        variant: 'destructive',
      });
      router.push('/pets');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!pet) return;

    try {
      setSharing(true);
      // 暫時註解掉，因為 sharePet 方法不存在
      // const response = await petService.sharePet(pet._id);

      // 複製分享連結到剪貼板
      const shareUrl = `${window.location.origin}/pets/${pet._id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: '分享成功',
        description: '分享連結已複製到剪貼板',
      });

      // 更新分享次數
      setPet(prev =>
        prev ? { ...prev, shares: (prev.shares || 0) + 1 } : null
      );
    } catch (error) {
      console.error('分享失敗:', error);
      toast({
        title: '分享失敗',
        description: '無法分享此案例，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!pet) return;

    try {
      setDeleting(true);
      const response = await petService.deletePet(pet._id);

      if (response?.success) {
        toast({
          title: '刪除成功',
          description: '寵物協尋案例已成功刪除',
        });
        router.push('/pets/my');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除此案例，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // 檢查是否為寵物擁有者
  const isOwner = isAuthenticated && user && pet && (pet.owner?._id === user.id || pet.owner === user.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'lost' ? 'destructive' : 'secondary';
  };

  const getStatusText = (status: string) => {
    return status === 'lost' ? '走失' : '尋獲';
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      dog: '狗',
      cat: '貓',
      bird: '鳥',
      rabbit: '兔子',
      hamster: '倉鼠',
      fish: '魚',
      reptile: '爬蟲',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const getSizeText = (size?: string) => {
    const sizeMap: Record<string, string> = {
      small: '小型',
      medium: '中型',
      large: '大型',
    };
    return size ? sizeMap[size] || size : '未知';
  };

  const getGenderText = (gender: string) => {
    const genderMap: Record<string, string> = {
      male: '公',
      female: '母',
      unknown: '未知',
    };
    return genderMap[gender] || gender;
  };

  if (loading) {
    return <PetDetailSkeleton />;
  }

  if (!pet) {
    return (
      <div className='container mx-auto px-4 py-8 text-center'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          找不到寵物資訊
        </h1>
        <Button asChild>
          <Link href='/pets'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            返回寵物列表
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-6xl'>
      {/* 返回按鈕和操作按鈕 */}
      <div className='mb-6 flex justify-between items-center'>
        <Button variant='ghost' asChild>
          <Link href='/pets' className='flex items-center gap-2'>
            <ArrowLeft className='h-4 w-4' />
            返回寵物列表
          </Link>
        </Button>

        {/* 擁有者操作按鈕 */}
        {isOwner && (
          <div className='flex gap-2'>
            <Button variant='outline' asChild>
              <Link
                href={`/pets/${pet._id}/edit`}
                className='flex items-center gap-2'
              >
                <Edit className='h-4 w-4' />
                編輯
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  className='flex items-center gap-2'
                >
                  <Trash2 className='h-4 w-4' />
                  刪除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認刪除</AlertDialogTitle>
                  <AlertDialogDescription>
                    您確定要刪除「{pet.name}」的協尋案例嗎？此操作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className='bg-red-600 hover:bg-red-700'
                  >
                    {deleting ? '刪除中...' : '確認刪除'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* 主要內容 */}
        <div className='lg:col-span-2 space-y-6'>
          {/* 基本資訊 */}
          <Card>
            <CardHeader>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-2xl font-bold flex items-center gap-3'>
                    {pet.name}
                    {pet.isUrgent && (
                      <Badge
                        variant='destructive'
                        className='flex items-center gap-1'
                      >
                        <AlertTriangle className='h-3 w-3' />
                        緊急
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className='text-lg mt-2'>
                    {getTypeText(pet.type)} {pet.breed && `• ${pet.breed}`} •{' '}
                    {getGenderText(pet.gender)}
                    {pet.age && ` • ${pet.age}歲`}
                  </CardDescription>
                </div>
                <Badge
                  variant={getStatusColor(pet.status)}
                  className='text-sm px-3 py-1'
                >
                  {getStatusText(pet.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* 圖片 */}
              {pet.images && pet.images.length > 0 && (
                <div className='space-y-4'>
                  <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                    <img
                      src={pet.images[0]}
                      alt={pet.name}
                      className='w-full h-full object-cover'
                    />
                  </div>

                  {pet.images.length > 1 && (
                    <div className='grid grid-cols-4 gap-2'>
                      {pet.images.slice(1, 5).map((image, index) => (
                        <div
                          key={`${pet._id}-image-${index + 1}`}
                          className='aspect-square bg-gray-100 rounded-md overflow-hidden'
                        >
                          <img
                            src={image}
                            alt={`${pet.name} ${index + 2}`}
                            className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 描述 */}
              {pet.description && (
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    詳細描述
                  </h3>
                  <p className='text-gray-700 leading-relaxed'>
                    {pet.description}
                  </p>
                </div>
              )}

              {/* 特徵資訊 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <h3 className='font-semibold text-gray-900'>基本資訊</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>體型:</span>
                      <span className='font-medium'>
                        {getSizeText(pet.size)}
                      </span>
                    </div>
                    {pet.color && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>顏色:</span>
                        <span className='font-medium'>{pet.color}</span>
                      </div>
                    )}
                    {pet.microchipId && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>晶片號碼:</span>
                        <span className='font-medium font-mono'>
                          {pet.microchipId}
                        </span>
                      </div>
                    )}
                    {pet.vaccinated !== undefined && (
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>疫苗接種:</span>
                        <span className='font-medium'>
                          {pet.vaccinated ? '已接種' : '未接種'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-3'>
                  <h3 className='font-semibold text-gray-900'>其他資訊</h3>
                  <div className='space-y-2 text-sm'>
                    {pet.specialMarks && (
                      <div>
                        <span className='text-gray-600 block mb-1'>
                          特殊標記:
                        </span>
                        <span className='font-medium'>{pet.specialMarks}</span>
                      </div>
                    )}
                    {pet.personality && (
                      <div>
                        <span className='text-gray-600 block mb-1'>
                          性格特點:
                        </span>
                        <span className='font-medium'>{pet.personality}</span>
                      </div>
                    )}
                    {pet.medicalConditions && (
                      <div>
                        <span className='text-gray-600 block mb-1'>
                          健康狀況:
                        </span>
                        <span className='font-medium'>
                          {pet.medicalConditions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 位置和時間資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                位置和時間資訊
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-3'>
                <MapPin className='h-5 w-5 text-gray-500 mt-0.5' />
                <div>
                  <p className='font-medium text-gray-900'>最後出現地點</p>
                  <p className='text-gray-600'>
                    {typeof pet.lastSeenLocation === 'string' ? pet.lastSeenLocation : pet.lastSeenLocation?.address}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Calendar className='h-5 w-5 text-gray-500 mt-0.5' />
                <div>
                  <p className='font-medium text-gray-900'>最後見到時間</p>
                  <p className='text-gray-600'>
                    {pet.lastSeenDate ? formatDate(pet.lastSeenDate) : '未知'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 側邊欄 */}
        <div className='space-y-6'>
          {/* 聯絡資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>聯絡資訊</CardTitle>
              <CardDescription>
                如果您有相關線索，請聯絡以下資訊
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 rounded-full'>
                    <Phone className='h-4 w-4 text-blue-600' />
                  </div>
                  <div>
                    <p className='font-medium'>{pet.contactInfo?.name || '未提供'}</p>
                    <p className='text-sm text-gray-600'>
                      {pet.contactInfo?.phone || '未提供'}
                    </p>
                  </div>
                </div>

                {pet.contactInfo?.email && (
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-green-100 rounded-full'>
                      <Mail className='h-4 w-4 text-green-600' />
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>
                        {pet.contactInfo?.email || '未提供'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className='space-y-2'>
                <Button className='w-full' size='lg'>
                  <Phone className='h-4 w-4 mr-2' />
                  撥打電話
                </Button>

                {pet.contactInfo?.email && (
                  <Button variant='outline' className='w-full'>
                    <Mail className='h-4 w-4 mr-2' />
                    發送郵件
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 懸賞資訊 */}
          {pet.reward && pet.reward > 0 && (
            <Card className='border-yellow-200 bg-yellow-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-yellow-800'>
                  <Award className='h-5 w-5' />
                  懸賞資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-yellow-800'>
                    NT$ {pet.reward.toLocaleString()}
                  </p>
                  <p className='text-sm text-yellow-700 mt-1'>
                    提供有效線索可獲得懸賞
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 統計資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>案例統計</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>瀏覽次數</span>
                <span className='font-medium'>{pet.viewCount || 0}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>分享次數</span>
                <span className='font-medium'>{pet.shareCount || 0}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>發布時間</span>
                <span className='font-medium text-sm'>
                  {formatDate(pet.createdAt.toString())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 分享按鈕 */}
          <Card>
            <CardHeader>
              <CardTitle>幫助分享</CardTitle>
              <CardDescription>分享此案例，讓更多人看到</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className='w-full'
                variant='outline'
                onClick={() => handleShare()}
                disabled={sharing}
              >
                <Share2 className='h-4 w-4 mr-2' />
                {sharing ? '分享中...' : '複製分享連結'}
              </Button>
            </CardContent>
          </Card>

          {/* 相似寵物推薦 */}
          {similarPets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>相似案例</CardTitle>
                <CardDescription>您可能也想關注這些案例</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {loadingSimilar ? (
                  <div className='space-y-3'>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='space-y-2'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-3 w-3/4' />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {similarPets.map(similarPet => (
                      <Link
                        key={similarPet._id}
                        href={`/pets/${similarPet._id}`}
                      >
                        <div className='p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer'>
                          <div className='flex gap-3'>
                            {similarPet.images && similarPet.images[0] && (
                              <div className='w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0'>
                                <img
                                  src={similarPet.images[0]}
                                  alt={similarPet.name}
                                  className='w-full h-full object-cover'
                                />
                              </div>
                            )}
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium text-sm truncate'>
                                {similarPet.name}
                              </p>
                              <p className='text-xs text-gray-600 truncate'>
                                {getTypeText(similarPet.type)} •{' '}
                                {typeof similarPet.lastSeenLocation === 'string' ? similarPet.lastSeenLocation : similarPet.lastSeenLocation?.address}
                              </p>
                              <div className='flex items-center gap-2 mt-1'>
                                <Badge
                                  variant={getStatusColor(similarPet.status)}
                                  className='text-xs px-2 py-0'
                                >
                                  {getStatusText(similarPet.status)}
                                </Badge>
                                {similarPet.isUrgent && (
                                  <Badge
                                    variant='destructive'
                                    className='text-xs px-2 py-0'
                                  >
                                    緊急
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className='pt-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    asChild
                  >
                    <Link
                      href={`/pets?type=${pet.type}&location=${encodeURIComponent(pet.lastSeenLocation?.address || '')}`}
                    >
                      查看更多相似案例
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
