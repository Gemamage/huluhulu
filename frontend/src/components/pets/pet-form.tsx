'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, User, Calendar, Heart, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validatePetForm, convertValidationErrors, ValidationResult } from '@/utils/validation';

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
}

interface PetFormProps {
  initialData?: Partial<PetFormData>;
  onSubmit: (data: PetFormData) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function PetForm({ initialData, onSubmit, isLoading = false, mode }: PetFormProps) {
  const [formData, setFormData] = useState<PetFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'dog',
    breed: initialData?.breed || '',
    gender: initialData?.gender || 'unknown',
    age: initialData?.age || undefined,
    color: initialData?.color || '',
    size: initialData?.size || 'medium',
    status: initialData?.status || 'lost',
    description: initialData?.description || '',
    lastSeenLocation: {
      address: initialData?.lastSeenLocation?.address || '',
      latitude: initialData?.lastSeenLocation?.latitude,
      longitude: initialData?.lastSeenLocation?.longitude,
    },
    lastSeenDate: initialData?.lastSeenDate || new Date().toISOString().split('T')[0],
    contactInfo: {
      name: initialData?.contactInfo?.name || '',
      phone: initialData?.contactInfo?.phone || '',
      email: initialData?.contactInfo?.email || '',
      preferredContact: initialData?.contactInfo?.preferredContact || 'phone',
    },
    images: initialData?.images || [],
    reward: initialData?.reward || 0,
    isUrgent: initialData?.isUrgent || false,
    microchipId: initialData?.microchipId || '',
    vaccinated: initialData?.vaccinated,
    medicalConditions: initialData?.medicalConditions || '',
    specialMarks: initialData?.specialMarks || '',
    personality: initialData?.personality || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 前端驗證函數
  const validateForm = (): boolean => {
    const validationResult: ValidationResult = validatePetForm(formData);
    
    if (!validationResult.isValid) {
      const newErrors = convertValidationErrors(validationResult.errors);
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
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
            ...prev[keys[0] as keyof PetFormData],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('表單提交失敗:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {mode === 'create' ? '新增寵物協尋案例' : '編輯寵物資訊'}
        </CardTitle>
        <CardDescription>
          請填寫詳細的寵物資訊，幫助我們更好地協助您找到寵物
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">寵物名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="請輸入寵物名稱"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="type">寵物類型 *</Label>
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
                <Label htmlFor="breed">品種</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => handleInputChange('breed', e.target.value)}
                  placeholder="請輸入品種"
                  className={errors.breed ? 'border-red-500' : ''}
                />
                {errors.breed && <p className="text-sm text-red-500 mt-1">{errors.breed}</p>}
              </div>

              <div>
                <Label htmlFor="gender">性別</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">公</option>
                  <option value="female">母</option>
                  <option value="unknown">不明</option>
                </select>
              </div>

              <div>
                <Label htmlFor="age">年齡</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="請輸入年齡"
                  min="0"
                  max="30"
                  className={errors.age ? 'border-red-500' : ''}
                />
                {errors.age && <p className="text-sm text-red-500 mt-1">{errors.age}</p>}
              </div>

              <div>
                <Label htmlFor="color">顏色</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="請輸入顏色"
                  className={errors.color ? 'border-red-500' : ''}
                />
                {errors.color && <p className="text-sm text-red-500 mt-1">{errors.color}</p>}
              </div>
            </div>
          </div>

          <Separator />

          {/* 狀態資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">狀態資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">狀態 *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lost">走失</option>
                  <option value="found">找到</option>
                </select>
              </div>

              <div>
                <Label htmlFor="size">體型</Label>
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
            </div>

            <div>
              <Label htmlFor="description">描述</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="請詳細描述寵物的特徵、習性等"
                rows={4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>
          </div>

          <Separator />

          {/* 位置資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              位置資訊
            </h3>
            <div>
              <Label htmlFor="lastSeenAddress">最後出現地點 *</Label>
              <Input
                id="lastSeenAddress"
                value={formData.lastSeenLocation.address}
                onChange={(e) => handleInputChange('lastSeenLocation.address', e.target.value)}
                placeholder="請輸入詳細地址"
                className={errors['lastSeenLocation.address'] ? 'border-red-500' : ''}
              />
              {errors['lastSeenLocation.address'] && (
                <p className="text-sm text-red-500 mt-1">{errors['lastSeenLocation.address']}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastSeenDate">最後出現日期 *</Label>
              <Input
                id="lastSeenDate"
                type="date"
                value={formData.lastSeenDate.split('T')[0]}
                onChange={(e) => handleInputChange('lastSeenDate', e.target.value + 'T00:00:00.000Z')}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* 聯絡資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              聯絡資訊
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">聯絡人姓名 *</Label>
                <Input
                  id="contactName"
                  value={formData.contactInfo.name}
                  onChange={(e) => handleInputChange('contactInfo.name', e.target.value)}
                  placeholder="請輸入聯絡人姓名"
                  className={errors['contactInfo.name'] ? 'border-red-500' : ''}
                />
                {errors['contactInfo.name'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['contactInfo.name']}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPhone">電話號碼 *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                  placeholder="請輸入電話號碼"
                  className={errors['contactInfo.phone'] ? 'border-red-500' : ''}
                />
                {errors['contactInfo.phone'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['contactInfo.phone']}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactEmail">電子郵件</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                  placeholder="請輸入電子郵件"
                  className={errors['contactInfo.email'] ? 'border-red-500' : ''}
                />
                {errors['contactInfo.email'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['contactInfo.email']}</p>
                )}
              </div>

              <div>
                <Label htmlFor="preferredContact">偏好聯絡方式</Label>
                <select
                  id="preferredContact"
                  value={formData.contactInfo.preferredContact}
                  onChange={(e) => handleInputChange('contactInfo.preferredContact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="phone">電話</option>
                  <option value="email">電子郵件</option>
                </select>
              </div>
            </div>
          </div>

          <Separator />

          {/* 其他資訊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">其他資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reward">獎勵金額</Label>
                <Input
                  id="reward"
                  type="number"
                  value={formData.reward || ''}
                  onChange={(e) => handleInputChange('reward', e.target.value ? parseInt(e.target.value) : 0)}
                  placeholder="請輸入獎勵金額"
                  min="0"
                  className={errors.reward ? 'border-red-500' : ''}
                />
                {errors.reward && <p className="text-sm text-red-500 mt-1">{errors.reward}</p>}
              </div>

              <div>
                <Label htmlFor="microchipId">晶片 ID</Label>
                <Input
                  id="microchipId"
                  value={formData.microchipId}
                  onChange={(e) => handleInputChange('microchipId', e.target.value)}
                  placeholder="請輸入晶片 ID"
                  className={errors.microchipId ? 'border-red-500' : ''}
                />
                {errors.microchipId && <p className="text-sm text-red-500 mt-1">{errors.microchipId}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isUrgent"
                checked={formData.isUrgent}
                onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isUrgent" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                緊急案例
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="vaccinated"
                checked={formData.vaccinated || false}
                onChange={(e) => handleInputChange('vaccinated', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="vaccinated">已接種疫苗</Label>
            </div>

            <div>
              <Label htmlFor="medicalConditions">醫療狀況</Label>
              <textarea
                id="medicalConditions"
                value={formData.medicalConditions}
                onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                placeholder="請描述寵物的醫療狀況或特殊需求"
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.medicalConditions ? 'border-red-500' : ''}`}
              />
              {errors.medicalConditions && (
                <p className="text-sm text-red-500 mt-1">{errors.medicalConditions}</p>
              )}
            </div>

            <div>
              <Label htmlFor="specialMarks">特殊標記</Label>
              <textarea
                id="specialMarks"
                value={formData.specialMarks}
                onChange={(e) => handleInputChange('specialMarks', e.target.value)}
                placeholder="請描述寵物的特殊標記或特徵"
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.specialMarks ? 'border-red-500' : ''}`}
              />
              {errors.specialMarks && <p className="text-sm text-red-500 mt-1">{errors.specialMarks}</p>}
            </div>

            <div>
              <Label htmlFor="personality">個性描述</Label>
              <textarea
                id="personality"
                value={formData.personality}
                onChange={(e) => handleInputChange('personality', e.target.value)}
                placeholder="請描述寵物的個性和習性"
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.personality ? 'border-red-500' : ''}`}
              />
              {errors.personality && <p className="text-sm text-red-500 mt-1">{errors.personality}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" disabled={isLoading}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '處理中...' : mode === 'create' ? '新增寵物' : '更新資訊'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}