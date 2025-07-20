'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin, Camera, Phone, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function NewSightingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    petType: '',
    breed: '',
    color: '',
    size: '',
    location: '',
    sightingDate: '',
    sightingTime: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    images: [] as File[],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: files }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: 實作 API 呼叫
      console.log('提交拾獲通報:', formData);

      toast({
        title: '通報成功',
        description: '您的拾獲通報已成功提交，我們會盡快處理。',
      });

      router.push('/pets');
    } catch (error) {
      console.error('提交失敗:', error);
      toast({
        title: '提交失敗',
        description: '無法提交拾獲通報，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      {/* 頁面標題 */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>拾獲寵物通報</h1>
        <p className='text-gray-600'>
          感謝您發現走失的寵物！請填寫以下資訊，幫助我們聯繫寵物主人。
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* 寵物基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-amber-600' />
              寵物基本資訊
            </CardTitle>
            <CardDescription>請盡可能詳細描述您發現的寵物特徵</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='petType'>寵物類型 *</Label>
                <Select
                  value={formData.petType}
                  onValueChange={value => handleInputChange('petType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='選擇寵物類型' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='dog'>狗</SelectItem>
                    <SelectItem value='cat'>貓</SelectItem>
                    <SelectItem value='bird'>鳥</SelectItem>
                    <SelectItem value='rabbit'>兔子</SelectItem>
                    <SelectItem value='hamster'>倉鼠</SelectItem>
                    <SelectItem value='other'>其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='breed'>品種</Label>
                <Input
                  id='breed'
                  value={formData.breed}
                  onChange={e => handleInputChange('breed', e.target.value)}
                  placeholder='例：柴犬、英國短毛貓'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='color'>顏色 *</Label>
                <Input
                  id='color'
                  value={formData.color}
                  onChange={e => handleInputChange('color', e.target.value)}
                  placeholder='例：棕色、黑白相間'
                  required
                />
              </div>

              <div>
                <Label htmlFor='size'>體型 *</Label>
                <Select
                  value={formData.size}
                  onValueChange={value => handleInputChange('size', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='選擇體型' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='small'>小型（5kg以下）</SelectItem>
                    <SelectItem value='medium'>中型（5-20kg）</SelectItem>
                    <SelectItem value='large'>大型（20kg以上）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='description'>詳細描述 *</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder='請詳細描述寵物的外觀特徵、行為表現、是否有項圈等...'
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* 發現地點和時間 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-amber-600' />
              發現地點和時間
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='location'>發現地點 *</Label>
              <Input
                id='location'
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                placeholder='請輸入詳細地址或地標'
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='sightingDate'>發現日期 *</Label>
                <Input
                  id='sightingDate'
                  type='date'
                  value={formData.sightingDate}
                  onChange={e =>
                    handleInputChange('sightingDate', e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor='sightingTime'>發現時間</Label>
                <Input
                  id='sightingTime'
                  type='time'
                  value={formData.sightingTime}
                  onChange={e =>
                    handleInputChange('sightingTime', e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 照片上傳 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Camera className='h-5 w-5 text-amber-600' />
              寵物照片
            </CardTitle>
            <CardDescription>上傳清晰的寵物照片有助於主人辨識</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor='images'>選擇照片</Label>
              <Input
                id='images'
                type='file'
                multiple
                accept='image/*'
                onChange={handleImageUpload}
                className='mt-1'
              />
              <p className='text-sm text-gray-500 mt-1'>
                可上傳多張照片，支援 JPG、PNG 格式
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 聯絡資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Phone className='h-5 w-5 text-amber-600' />
              您的聯絡資訊
            </CardTitle>
            <CardDescription>我們會透過這些資訊與您聯繫</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='contactName'>姓名 *</Label>
              <Input
                id='contactName'
                value={formData.contactName}
                onChange={e => handleInputChange('contactName', e.target.value)}
                placeholder='請輸入您的姓名'
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='contactPhone'>電話號碼 *</Label>
                <Input
                  id='contactPhone'
                  value={formData.contactPhone}
                  onChange={e =>
                    handleInputChange('contactPhone', e.target.value)
                  }
                  placeholder='例：0912345678'
                  required
                />
              </div>

              <div>
                <Label htmlFor='contactEmail'>電子郵件</Label>
                <Input
                  id='contactEmail'
                  type='email'
                  value={formData.contactEmail}
                  onChange={e =>
                    handleInputChange('contactEmail', e.target.value)
                  }
                  placeholder='example@email.com'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交按鈕 */}
        <div className='flex gap-4 justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.back()}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type='submit'
            disabled={loading}
            className='bg-amber-600 hover:bg-amber-700'
          >
            {loading ? '提交中...' : '提交通報'}
          </Button>
        </div>
      </form>
    </div>
  );
}
