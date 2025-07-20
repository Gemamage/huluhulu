'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, Camera, Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import { MultiSelectTags } from '@/components/ui/multi-select-tags';
import {
  CascadingLocationSelect,
  LocationData,
} from '@/components/ui/cascading-location-select';

interface FoundPetFormData {
  // 基本資訊（選填或未知選項）
  name?: string;
  type:
    | 'dog'
    | 'cat'
    | 'bird'
    | 'rabbit'
    | 'hamster'
    | 'fish'
    | 'reptile'
    | 'other'
    | 'unknown';
  breed: string[]; // 改為多選標籤
  gender: 'male' | 'female' | 'unknown';
  estimatedAge?: 'puppy' | 'young' | 'adult' | 'senior' | 'unknown';
  size?: 'small' | 'medium' | 'large' | 'unknown';
  color: string[]; // 改為多選標籤

  // 重點資訊
  description: string[]; // 外觀特徵改為多選標籤
  foundLocation: LocationData; // 改為層級式地點選擇
  foundDate: string;
  foundTime?: string;

  // 拾獲者聯絡資訊
  finderContact: {
    name: string;
    phone: string;
    email?: string;
    preferredContact: 'phone' | 'email';
  };

  // 照片
  images: string[];

  // 其他資訊
  specialMarks?: string;
  behaviorNotes: string[]; // 個性特徵改為多選標籤
  healthCondition?: string;
  isInjured: boolean;
  hasCollar: boolean;
  collarDescription?: string;
}

interface FoundPetFormProps {
  initialData?: Partial<FoundPetFormData>;
  onSubmit: (data: FoundPetFormData) => Promise<void>;
  isLoading?: boolean;
}

export function FoundPetForm({
  initialData,
  onSubmit,
  isLoading = false,
}: FoundPetFormProps) {
  const [formData, setFormData] = useState<FoundPetFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'unknown',
    breed: initialData?.breed || [],
    gender: initialData?.gender || 'unknown',
    estimatedAge: initialData?.estimatedAge || 'unknown',
    size: initialData?.size || 'unknown',
    color: initialData?.color || [],
    description: initialData?.description || [],
    foundLocation: initialData?.foundLocation || {
      city: '',
      district: '',
      address: '',
    },
    foundDate: initialData?.foundDate || new Date().toISOString().split('T')[0],
    foundTime: initialData?.foundTime || '',
    finderContact: {
      name: initialData?.finderContact?.name || '',
      phone: initialData?.finderContact?.phone || '',
      email: initialData?.finderContact?.email || '',
      preferredContact: initialData?.finderContact?.preferredContact || 'phone',
    },
    images: initialData?.images || [],
    specialMarks: initialData?.specialMarks || '',
    behaviorNotes: initialData?.behaviorNotes || [],
    healthCondition: initialData?.healthCondition || '',
    isInjured: initialData?.isInjured || false,
    hasCollar: initialData?.hasCollar || false,
    collarDescription: initialData?.collarDescription || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 預設標籤選項
  const breedOptions = {
    dog: [
      '米克斯',
      '柴犬',
      '柯基',
      '貴賓/泰迪',
      '博美',
      '臘腸',
      '吉娃娃',
      '法鬥',
      '黃金獵犬',
      '拉布拉多',
      '雪納瑞',
    ],
    cat: ['米克斯', '美國短毛貓', '英國短毛貓', '布偶貓', '波斯貓', '橘貓'],
    reptile: ['巴西龜', '斑龜', '蘇卡達象龜', '陸龜', '水龜'],
    rabbit: ['家兔', '道奇兔', '獅子兔', '垂耳兔'],
    other: [],
  };

  const colorOptions = [
    '黑色',
    '白色',
    '灰色',
    '黃色',
    '橘色',
    '棕色',
    '奶油色',
    '虎斑',
    '三花',
    '玳瑁',
    '賓士貓',
    '斑點',
    '雙色',
    '重點色',
  ];

  const appearanceOptions = [
    '垂耳',
    '立耳',
    '摺耳',
    '大耳朵',
    '小耳朵',
    '長毛',
    '短毛',
    '捲毛',
    '長尾',
    '短尾/麒麟尾',
    '斷尾',
    '藍眼',
    '綠眼',
    '黃眼',
    '異色瞳',
    '大臉',
    '尖臉',
  ];

  const personalityOptions = [
    '親人',
    '膽小',
    '怕生',
    '貪吃',
    '愛叫',
    '穩定',
    '活潑',
    '好奇',
    '懶洋洋',
    '會握手',
  ];

  // 根據動物類型獲取品種選項
  const getCurrentBreedOptions = () => {
    const typeKey = formData.type as keyof typeof breedOptions;
    return breedOptions[typeKey] || breedOptions.other;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof FoundPetFormData],
            [keys[1]]: value,
          },
        };
      }
      return prev;
    });

    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 必填欄位驗證
    if (!formData.type || formData.type === 'unknown') {
      newErrors.type = '請選擇動物類型';
    }

    if (!formData.description || formData.description.length === 0) {
      newErrors.description = '請選擇或輸入動物的外觀特徵';
    }

    if (!formData.foundLocation.city || !formData.foundLocation.district) {
      newErrors.foundLocation = '請選擇拾獲地點的縣市和行政區';
    }

    if (!formData.foundDate) {
      newErrors.foundDate = '請選擇拾獲日期';
    }

    // 聯絡資訊驗證
    if (!formData.finderContact.name.trim()) {
      newErrors.finderName = '請填寫聯絡人姓名';
    }

    if (!formData.finderContact.phone.trim()) {
      newErrors.finderPhone = '請填寫聯絡電話';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.finderContact.phone)) {
      newErrors.finderPhone = '請填寫有效的電話號碼';
    }

    if (
      formData.finderContact.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.finderContact.email)
    ) {
      newErrors.finderEmail = '請填寫有效的電子郵件';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: '表單驗證失敗',
        description: '請檢查並填寫所有必填欄位',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('表單提交失敗:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* 基本資訊 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <AlertCircle className='h-5 w-5' />
          基本資訊（如不確定可選擇「未知」）
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='name'>動物名稱（如有項圈標示）</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder='如項圈上有名字請填寫，否則可留空'
            />
          </div>

          <div>
            <Label htmlFor='type'>動物類型</Label>
            <select
              id='type'
              value={formData.type}
              onChange={e => handleInputChange('type', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='unknown'>不確定</option>
              <option value='dog'>狗</option>
              <option value='cat'>貓</option>
              <option value='bird'>鳥</option>
              <option value='rabbit'>兔子</option>
              <option value='hamster'>倉鼠</option>
              <option value='fish'>魚</option>
              <option value='reptile'>爬蟲類</option>
              <option value='other'>其他</option>
            </select>
          </div>

          <div>
            <Label htmlFor='breed'>品種</Label>
            <MultiSelectTags
              value={formData.breed}
              onChange={value => handleInputChange('breed', value)}
              options={getCurrentBreedOptions()}
              placeholder='選擇或輸入品種'
              error={errors.breed}
            />
          </div>

          <div>
            <Label htmlFor='gender'>性別</Label>
            <select
              id='gender'
              value={formData.gender}
              onChange={e => handleInputChange('gender', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='unknown'>不確定</option>
              <option value='male'>公</option>
              <option value='female'>母</option>
            </select>
          </div>

          <div>
            <Label htmlFor='estimatedAge'>估計年齡</Label>
            <select
              id='estimatedAge'
              value={formData.estimatedAge}
              onChange={e => handleInputChange('estimatedAge', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='unknown'>不確定</option>
              <option value='puppy'>幼體</option>
              <option value='young'>年輕</option>
              <option value='adult'>成年</option>
              <option value='senior'>老年</option>
            </select>
          </div>

          <div>
            <Label htmlFor='size'>體型大小</Label>
            <select
              id='size'
              value={formData.size}
              onChange={e => handleInputChange('size', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='unknown'>不確定</option>
              <option value='small'>小型</option>
              <option value='medium'>中型</option>
              <option value='large'>大型</option>
            </select>
          </div>

          <div className='md:col-span-2'>
            <Label htmlFor='color'>毛色/顏色</Label>
            <MultiSelectTags
              value={formData.color}
              onChange={value => handleInputChange('color', value)}
              options={colorOptions}
              placeholder='選擇或輸入毛色'
              error={errors.color}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 外觀描述 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <AlertCircle className='h-5 w-5' />
          外觀描述 *
        </h3>
        <div>
          <Label htmlFor='description'>外觀特徵 *</Label>
          <MultiSelectTags
            value={formData.description}
            onChange={value => handleInputChange('description', value)}
            options={appearanceOptions}
            placeholder='選擇或輸入外觀特徵'
            error={errors.description}
          />
        </div>
      </div>

      <Separator />

      {/* 動物照片 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <Camera className='h-5 w-5' />
          動物照片
        </h3>
        <ImageUpload
          images={formData.images}
          onImagesChange={images => handleInputChange('images', images)}
          maxImages={5}
          maxFileSize={5}
        />
      </div>

      <Separator />

      {/* 拾獲資訊 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          拾獲資訊 *
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='foundDate'>拾獲日期 *</Label>
            <Input
              id='foundDate'
              type='date'
              value={formData.foundDate}
              onChange={e => handleInputChange('foundDate', e.target.value)}
              className={errors.foundDate ? 'border-red-500' : ''}
            />
            {errors.foundDate && (
              <p className='text-sm text-red-500 mt-1'>{errors.foundDate}</p>
            )}
          </div>

          <div>
            <Label htmlFor='foundTime'>拾獲時間（大約）</Label>
            <Input
              id='foundTime'
              type='time'
              value={formData.foundTime}
              onChange={e => handleInputChange('foundTime', e.target.value)}
            />
          </div>

          <div className='md:col-span-2'>
            <Label htmlFor='foundLocation'>拾獲地點 *</Label>
            <CascadingLocationSelect
              value={formData.foundLocation}
              onChange={value => handleInputChange('foundLocation', value)}
              error={errors.foundLocation}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 聯絡資訊 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold flex items-center gap-2'>
          <User className='h-5 w-5' />
          您的聯絡資訊 *
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='finderName'>您的稱呼 *</Label>
            <Input
              id='finderName'
              value={formData.finderContact.name}
              onChange={e =>
                handleInputChange('finderContact.name', e.target.value)
              }
              placeholder='例如：陳小姐、熱心的王先生'
              className={errors['finderContact.name'] ? 'border-red-500' : ''}
            />
            {errors['finderContact.name'] && (
              <p className='text-sm text-red-500 mt-1'>
                {errors['finderContact.name']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='finderPhone'>聯絡電話 *</Label>
            <Input
              id='finderPhone'
              value={formData.finderContact.phone}
              onChange={e =>
                handleInputChange('finderContact.phone', e.target.value)
              }
              placeholder='請填寫可聯絡的電話號碼'
              className={errors['finderContact.phone'] ? 'border-red-500' : ''}
            />
            {errors['finderContact.phone'] && (
              <p className='text-sm text-red-500 mt-1'>
                {errors['finderContact.phone']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='finderEmail'>電子郵件</Label>
            <Input
              id='finderEmail'
              type='email'
              value={formData.finderContact.email}
              onChange={e =>
                handleInputChange('finderContact.email', e.target.value)
              }
              placeholder='選填，方便聯絡'
            />
          </div>

          <div>
            <Label htmlFor='preferredContact'>偏好聯絡方式</Label>
            <select
              id='preferredContact'
              value={formData.finderContact.preferredContact}
              onChange={e =>
                handleInputChange(
                  'finderContact.preferredContact',
                  e.target.value
                )
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='phone'>電話</option>
              <option value='email'>電子郵件</option>
            </select>
          </div>
        </div>
      </div>

      <Separator />

      {/* 其他資訊 */}
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>其他資訊</h3>

        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='hasCollar'
              checked={formData.hasCollar}
              onChange={e => handleInputChange('hasCollar', e.target.checked)}
              className='rounded border-gray-300'
            />
            <Label htmlFor='hasCollar'>動物有佩戴項圈</Label>
          </div>

          {formData.hasCollar && (
            <div>
              <Label htmlFor='collarDescription'>項圈描述</Label>
              <Input
                id='collarDescription'
                value={formData.collarDescription}
                onChange={e =>
                  handleInputChange('collarDescription', e.target.value)
                }
                placeholder='請描述項圈的顏色、材質、是否有吊牌等'
              />
            </div>
          )}

          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='isInjured'
              checked={formData.isInjured}
              onChange={e => handleInputChange('isInjured', e.target.checked)}
              className='rounded border-gray-300'
            />
            <Label htmlFor='isInjured'>動物看起來有受傷</Label>
          </div>

          <div>
            <Label htmlFor='specialMarks'>特殊標記</Label>
            <Textarea
              id='specialMarks'
              value={formData.specialMarks}
              onChange={e => handleInputChange('specialMarks', e.target.value)}
              placeholder='例如：疤痕、胎記、特殊毛色分布等'
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor='behaviorNotes'>個性特徵</Label>
            <MultiSelectTags
              value={formData.behaviorNotes}
              onChange={value => handleInputChange('behaviorNotes', value)}
              options={personalityOptions}
              placeholder='選擇或輸入個性特徵'
              error={errors.behaviorNotes}
            />
          </div>

          <div>
            <Label htmlFor='healthCondition'>健康狀況</Label>
            <Textarea
              id='healthCondition'
              value={formData.healthCondition}
              onChange={e =>
                handleInputChange('healthCondition', e.target.value)
              }
              placeholder='例如：精神狀況、是否有明顯疾病症狀等'
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* 提交按鈕 */}
      <div className='flex justify-end pt-6'>
        <Button type='submit' disabled={isLoading} className='px-8 py-2'>
          {isLoading ? '提交中...' : '發布拾獲通報'}
        </Button>
      </div>
    </form>
  );
}
