'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, User, Camera, Heart, AlertTriangle, Gift } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import { MultiSelectTags } from '@/components/ui/multi-select-tags';
import { CascadingLocationSelect, LocationData } from '@/components/ui/cascading-location-select';

interface LostPetFormData {
  // 基本資訊（必填）
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
  breed: string[];
  gender: 'male' | 'female' | 'unknown';
  age: 'puppy' | 'young' | 'adult' | 'senior';
  size: 'small' | 'medium' | 'large';
  color: string[];
  weight?: number;
  
  // 詳細特徵
  description: string[];
  specialMarks?: string;
  personality: string[];
  
  // 走失資訊
  lostLocation: LocationData;
  lostDate: string;
  lostTime?: string;
  circumstances?: string; // 走失經過
  
  // 飼主聯絡資訊
  ownerContact: {
    name: string;
    phone: string;
    email?: string;
    preferredContact: 'phone' | 'email';
  };
  
  // 照片（重要）
  images: string[];
  
  // 識別資訊
  microchipId?: string;
  hasCollar: boolean;
  collarDescription?: string;
  
  // 健康資訊
  healthCondition?: string;
  medications?: string;
  veterinarian?: string;
  
  // 獎金
  reward?: number;
  rewardDescription?: string;
  
  // 其他
  additionalNotes?: string;
}

interface LostPetFormProps {
  initialData?: Partial<LostPetFormData>;
  onSubmit: (data: LostPetFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LostPetForm({ initialData, onSubmit, isLoading = false }: LostPetFormProps) {
  const [formData, setFormData] = useState<LostPetFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'dog',
    breed: initialData?.breed || [],
    gender: initialData?.gender || 'unknown',
    age: initialData?.age || 'adult',
    size: initialData?.size || 'medium',
    color: initialData?.color || [],
    weight: initialData?.weight,
    appearance: initialData?.appearance || [],
    specialMarks: initialData?.specialMarks || '',
    personality: initialData?.personality || [],
    lostLocation: initialData?.lostLocation || {
      city: '',
      district: '',
      address: ''
    },
    lostDate: initialData?.lostDate || new Date().toISOString().split('T')[0],
    lostTime: initialData?.lostTime || '',
    circumstances: initialData?.circumstances || '',
    ownerContact: {
      name: initialData?.ownerContact?.name || '',
      phone: initialData?.ownerContact?.phone || '',
      email: initialData?.ownerContact?.email || '',
      preferredContact: initialData?.ownerContact?.preferredContact || 'phone',
    },
    images: initialData?.images || [],
    microchipId: initialData?.microchipId || '',
    hasCollar: initialData?.hasCollar || false,
    collarDescription: initialData?.collarDescription || '',
    healthCondition: initialData?.healthCondition || '',
    medications: initialData?.medications || '',
    rewardAmount: initialData?.rewardAmount,
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 預設標籤選項
  const breedOptions = {
    dog: ['米克斯', '柴犬', '柯基', '貴賓/泰迪', '博美', '臘腸', '吉娃娃', '法鬥', '黃金獵犬', '拉布拉多', '雪納瑞'],
    cat: ['米克斯', '美國短毛貓', '英國短毛貓', '布偶貓', '波斯貓', '橘貓'],
    reptile: ['巴西龜', '斑龜', '蘇卡達象龜', '陸龜', '水龜'],
    rabbit: ['家兔', '道奇兔', '獅子兔', '垂耳兔'],
    other: []
  };

  const colorOptions = [
    '黑色', '白色', '灰色', '黃色', '橘色', '棕色', '奶油色', 
    '虎斑', '三花', '玳瑁', '賓士貓', '斑點', '雙色', '重點色'
  ];

  const appearanceOptions = [
    '垂耳', '立耳', '摺耳', '大耳朵', '小耳朵', '長毛', '短毛', '捲毛',
    '長尾', '短尾/麒麟尾', '斷尾', '藍眼', '綠眼', '黃眼', '異色瞳', '大臉', '尖臉'
  ];

  const personalityOptions = [
    '親人', '膽小', '怕生', '貪吃', '愛叫', '穩定', '活潑', '好奇', '懶洋洋', '會握手'
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
            ...prev[keys[0] as keyof LostPetFormData],
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
    if (!formData.name.trim()) {
      newErrors.name = '請填寫寵物名稱';
    }
    if (!formData.breed || formData.breed.length === 0) {
      newErrors.breed = '請選擇寵物品種';
    }
    if (!formData.color || formData.color.length === 0) {
      newErrors.color = '請選擇寵物毛色';
    }
    if (!formData.description || formData.description.length === 0) {
      newErrors.description = '請選擇或描述寵物的外觀特徵';
    }
    if (!formData.personality || formData.personality.length === 0) {
      newErrors.personality = '請選擇或描述寵物的個性特徵';
    }
    if (!formData.lostLocation.city || !formData.lostLocation.district || !formData.lostLocation.address.trim()) {
      newErrors['lostLocation.address'] = '請完整填寫走失地點';
    }
    if (!formData.lostDate) {
      newErrors.lostDate = '請選擇走失日期';
    }
    if (!formData.ownerContact.name.trim()) {
      newErrors['ownerContact.name'] = '請填寫您的姓名';
    }
    if (!formData.ownerContact.phone.trim()) {
      newErrors['ownerContact.phone'] = '請填寫聯絡電話';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.ownerContact.phone)) {
      newErrors['ownerContact.phone'] = '請填寫有效的電話號碼';
    }
    if (formData.ownerContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerContact.email)) {
      newErrors['ownerContact.email'] = '請填寫有效的電子郵件';
    }
    if (formData.images.length === 0) {
      newErrors.images = '請至少上傳一張寵物照片';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="h-5 w-5" />
          寵物基本資訊 *
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">寵物名稱 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="請填寫寵物的名字"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="type">動物類型 *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dog">狗</option>
              <option value="cat">貓</option>
              <option value="bird">鳥</option>
              <option value="rabbit">兔子</option>
              <option value="hamster">倉鼠</option>
              <option value="fish">魚</option>
              <option value="reptile">爬蟲類</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div>
            <Label htmlFor="breed">品種 *</Label>
            <MultiSelectTags
              value={formData.breed}
              onChange={(value) => handleInputChange('breed', value)}
              options={getCurrentBreedOptions()}
              placeholder="選擇或輸入品種"
              error={errors.breed}
            />
          </div>

          <div>
            <Label htmlFor="gender">性別 *</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">公</option>
              <option value="female">母</option>
            </select>
          </div>

          <div>
            <Label htmlFor="age">年齡 *</Label>
            <select
              id="age"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="puppy">幼體</option>
              <option value="young">年輕</option>
              <option value="adult">成年</option>
              <option value="senior">老年</option>
            </select>
          </div>

          <div>
            <Label htmlFor="size">體型大小 *</Label>
            <select
              id="size"
              value={formData.size}
              onChange={(e) => handleInputChange('size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">小型</option>
              <option value="medium">中型</option>
              <option value="large">大型</option>
            </select>
          </div>

          <div>
            <Label htmlFor="color">毛色/顏色 *</Label>
            <MultiSelectTags
              value={formData.color}
              onChange={(value) => handleInputChange('color', value)}
              options={colorOptions}
              placeholder="選擇或輸入毛色"
              error={errors.color}
            />
          </div>

          <div>
            <Label htmlFor="weight">體重（公斤）</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight || ''}
              onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="例如：5.5"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 外觀與個性描述 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="h-5 w-5" />
          外觀與個性描述 *
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="appearance">外觀特徵 *</Label>
            <MultiSelectTags
              value={formData.appearance}
              onChange={(value) => handleInputChange('appearance', value)}
              options={appearanceOptions}
              placeholder="選擇或輸入外觀特徵"
              error={errors.appearance}
            />
          </div>

          <div>
            <Label htmlFor="personality">個性特徵 *</Label>
            <MultiSelectTags
              value={formData.personality}
              onChange={(value) => handleInputChange('personality', value)}
              options={personalityOptions}
              placeholder="選擇或輸入個性特徵"
              error={errors.personality}
            />
          </div>

          <div>
            <Label htmlFor="specialMarks">特殊標記</Label>
            <Textarea
              id="specialMarks"
              value={formData.specialMarks}
              onChange={(e) => handleInputChange('specialMarks', e.target.value)}
              placeholder="例如：疤痕、胎記、特殊毛色分布、缺失部位等"
              rows={2}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 寵物照片 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          寵物照片 *
        </h3>
        <p className="text-sm text-gray-600">請上傳清晰的寵物照片，有助於他人識別</p>
        <ImageUpload
          images={formData.images}
          onImagesChange={(images) => handleInputChange('images', images)}
          maxImages={8}
          maxFileSize={5}
        />
        {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
      </div>

      <Separator />

      {/* 走失資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          走失資訊 *
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lostDate">走失日期 *</Label>
            <Input
              id="lostDate"
              type="date"
              value={formData.lostDate}
              onChange={(e) => handleInputChange('lostDate', e.target.value)}
              className={errors.lostDate ? 'border-red-500' : ''}
            />
            {errors.lostDate && <p className="text-sm text-red-500 mt-1">{errors.lostDate}</p>}
          </div>

          <div>
            <Label htmlFor="lostTime">走失時間（大約）</Label>
            <Input
              id="lostTime"
              type="time"
              value={formData.lostTime}
              onChange={(e) => handleInputChange('lostTime', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="lostLocation">走失地點 *</Label>
            <CascadingLocationSelect
              value={formData.lostLocation}
              onChange={(value) => handleInputChange('lostLocation', value)}
              error={errors['lostLocation.address']}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="circumstances">走失經過</Label>
            <Textarea
              id="circumstances"
              value={formData.circumstances}
              onChange={(e) => handleInputChange('circumstances', e.target.value)}
              placeholder="請描述走失的經過，例如：散步時掙脫牽繩、開門時跑出等"
              rows={3}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 識別資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">識別資訊</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="microchipId">晶片號碼</Label>
            <Input
              id="microchipId"
              value={formData.microchipId}
              onChange={(e) => handleInputChange('microchipId', e.target.value)}
              placeholder="如有植入晶片請填寫號碼"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasCollar"
              checked={formData.hasCollar}
              onChange={(e) => handleInputChange('hasCollar', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="hasCollar">有佩戴項圈</Label>
          </div>

          {formData.hasCollar && (
            <div>
              <Label htmlFor="collarDescription">項圈描述</Label>
              <Input
                id="collarDescription"
                value={formData.collarDescription}
                onChange={(e) => handleInputChange('collarDescription', e.target.value)}
                placeholder="請描述項圈的顏色、材質、是否有吊牌等"
              />
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* 健康資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">健康資訊</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="healthCondition">健康狀況</Label>
            <Textarea
              id="healthCondition"
              value={formData.healthCondition}
              onChange={(e) => handleInputChange('healthCondition', e.target.value)}
              placeholder="例如：健康良好、有慢性疾病、需要特殊照護等"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="medications">用藥情況</Label>
            <Textarea
              id="medications"
              value={formData.medications}
              onChange={(e) => handleInputChange('medications', e.target.value)}
              placeholder="如有定期用藥請說明藥物名稱和用法"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="veterinarian">常去的獸醫院</Label>
            <Input
              id="veterinarian"
              value={formData.veterinarian}
              onChange={(e) => handleInputChange('veterinarian', e.target.value)}
              placeholder="例如：XX動物醫院（地址）"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 聯絡資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          您的聯絡資訊 *
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ownerName">您的稱呼 *</Label>
            <Input
              id="ownerName"
              value={formData.ownerContact.name}
              onChange={(e) => handleInputChange('ownerContact.name', e.target.value)}
              placeholder="例如：陳小姐、熱心的王先生"
              className={errors['ownerContact.name'] ? 'border-red-500' : ''}
            />
            {errors['ownerContact.name'] && <p className="text-sm text-red-500 mt-1">{errors['ownerContact.name']}</p>}
          </div>

          <div>
            <Label htmlFor="ownerPhone">聯絡電話 *</Label>
            <Input
              id="ownerPhone"
              value={formData.ownerContact.phone}
              onChange={(e) => handleInputChange('ownerContact.phone', e.target.value)}
              placeholder="請填寫可聯絡的電話號碼"
              className={errors['ownerContact.phone'] ? 'border-red-500' : ''}
            />
            {errors['ownerContact.phone'] && <p className="text-sm text-red-500 mt-1">{errors['ownerContact.phone']}</p>}
          </div>

          <div>
            <Label htmlFor="ownerEmail">電子郵件</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={formData.ownerContact.email}
              onChange={(e) => handleInputChange('ownerContact.email', e.target.value)}
              placeholder="選填，方便聯絡"
            />
          </div>

          <div>
            <Label htmlFor="preferredContact">偏好聯絡方式</Label>
            <select
              id="preferredContact"
              value={formData.ownerContact.preferredContact}
              onChange={(e) => handleInputChange('ownerContact.preferredContact', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="phone">電話</option>
              <option value="email">電子郵件</option>
            </select>
          </div>
        </div>
      </div>

      <Separator />

      {/* 獎金資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5" />
          獎金資訊
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reward">獎金金額（新台幣）</Label>
            <Input
              id="reward"
              type="number"
              value={formData.reward || ''}
              onChange={(e) => handleInputChange('reward', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="例如：5000"
            />
          </div>

          <div>
            <Label htmlFor="rewardDescription">獎金說明</Label>
            <Input
              id="rewardDescription"
              value={formData.rewardDescription}
              onChange={(e) => handleInputChange('rewardDescription', e.target.value)}
              placeholder="例如：平安歸來即給付、需提供線索等"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 其他資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">其他資訊</h3>
        
        <div>
          <Label htmlFor="additionalNotes">補充說明</Label>
          <Textarea
            id="additionalNotes"
            value={formData.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            placeholder="任何其他想要補充的資訊"
            rows={3}
          />
        </div>
      </div>

      {/* 提交按鈕 */}
      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          disabled={isLoading}
          className="px-8 py-2"
        >
          {isLoading ? '提交中...' : '發布走失協尋'}
        </Button>
      </div>
    </form>
  );
}