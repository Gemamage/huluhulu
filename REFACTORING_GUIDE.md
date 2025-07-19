# 代碼重構實施指南

## 🚀 立即開始：第一步重構計劃

### 優先級 1：`lost-pet-form.tsx` 重構 (608 行 → 分解為多個文件)

這是最緊急的重構任務，因為這個組件承擔了太多責任。

#### 步驟 1：創建目錄結構

```bash
# 在 frontend/src/components/pets/ 目錄下創建
mkdir lost-pet-form
cd lost-pet-form
mkdir hooks components constants types
```

#### 步驟 2：提取類型定義

**創建 `types/index.ts`：**
```typescript
export interface LostPetFormData {
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
  circumstances?: string;
  
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

export interface LostPetFormProps {
  initialData?: Partial<LostPetFormData>;
  onSubmit: (data: LostPetFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface FormErrors {
  [key: string]: string;
}
```

#### 步驟 3：提取常數

**創建 `constants/formOptions.ts`：**
```typescript
export const BREED_OPTIONS = {
  dog: ['米克斯', '柴犬', '柯基', '貴賓/泰迪', '博美', '臘腸', '吉娃娃', '法鬥', '黃金獵犬', '拉布拉多', '雪納瑞'],
  cat: ['米克斯', '美國短毛貓', '英國短毛貓', '布偶貓', '波斯貓', '橘貓'],
  reptile: ['巴西龜', '斑龜', '蘇卡達象龜', '陸龜', '水龜'],
  rabbit: ['家兔', '道奇兔', '獅子兔', '垂耳兔'],
  other: []
} as const;

export const COLOR_OPTIONS = [
  '黑色', '白色', '灰色', '黃色', '橘色', '棕色', '奶油色', 
  '虎斑', '三花', '玳瑁', '賓士貓', '斑點', '雙色', '重點色'
] as const;

export const APPEARANCE_OPTIONS = [
  '垂耳', '立耳', '摺耳', '大耳朵', '小耳朵', '長毛', '短毛', '捲毛',
  '長尾', '短尾/麒麟尾', '斷尾', '藍眼', '綠眼', '黃眼', '異色瞳', '大臉', '尖臉'
] as const;

export const PERSONALITY_OPTIONS = [
  '親人', '膽小', '怕生', '貪吃', '愛叫', '穩定', '活潑', '好奇', '懶洋洋', '會握手'
] as const;
```

#### 步驟 4：創建自定義 Hook

**創建 `hooks/useLostPetForm.ts`：**
```typescript
import { useState, useCallback } from 'react';
import { LostPetFormData, FormErrors } from '../types';
import { BREED_OPTIONS } from '../constants/formOptions';

export function useLostPetForm(initialData?: Partial<LostPetFormData>) {
  const [formData, setFormData] = useState<LostPetFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'dog',
    breed: initialData?.breed || [],
    gender: initialData?.gender || 'unknown',
    age: initialData?.age || 'adult',
    size: initialData?.size || 'medium',
    color: initialData?.color || [],
    weight: initialData?.weight,
    description: initialData?.description || [],
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
    reward: initialData?.reward,
    rewardDescription: initialData?.rewardDescription || '',
    additionalNotes: initialData?.additionalNotes || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = useCallback((field: string, value: any) => {
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
  }, [errors]);

  const getCurrentBreedOptions = useCallback(() => {
    const typeKey = formData.type as keyof typeof BREED_OPTIONS;
    return BREED_OPTIONS[typeKey] || BREED_OPTIONS.other;
  }, [formData.type]);

  return {
    formData,
    errors,
    setErrors,
    handleInputChange,
    getCurrentBreedOptions
  };
}
```

**創建 `hooks/useLostPetValidation.ts`：**
```typescript
import { useCallback } from 'react';
import { LostPetFormData, FormErrors } from '../types';

export function useLostPetValidation() {
  const validateForm = useCallback((formData: LostPetFormData): { isValid: boolean; errors: FormErrors } => {
    const newErrors: FormErrors = {};

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

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, []);

  return { validateForm };
}
```

#### 步驟 5：創建區塊組件

**創建 `components/BasicInfoSection.tsx`：**
```typescript
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MultiSelectTags } from '@/components/ui/multi-select-tags';
import { LostPetFormData, FormErrors } from '../types';
import { COLOR_OPTIONS } from '../constants/formOptions';

interface BasicInfoSectionProps {
  formData: LostPetFormData;
  errors: FormErrors;
  breedOptions: string[];
  onInputChange: (field: string, value: any) => void;
}

export function BasicInfoSection({ formData, errors, breedOptions, onInputChange }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">基本資訊</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">寵物名稱 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
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
            onChange={(e) => onInputChange('type', e.target.value)}
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

        <div className="md:col-span-2">
          <Label>品種 *</Label>
          <MultiSelectTags
            options={breedOptions}
            selectedTags={formData.breed}
            onTagsChange={(tags) => onInputChange('breed', tags)}
            placeholder="請選擇或輸入品種"
            allowCustomTags
          />
          {errors.breed && <p className="text-sm text-red-500 mt-1">{errors.breed}</p>}
        </div>

        <div className="md:col-span-2">
          <Label>毛色 *</Label>
          <MultiSelectTags
            options={COLOR_OPTIONS}
            selectedTags={formData.color}
            onTagsChange={(tags) => onInputChange('color', tags)}
            placeholder="請選擇或輸入毛色"
            allowCustomTags
          />
          {errors.color && <p className="text-sm text-red-500 mt-1">{errors.color}</p>}
        </div>

        {/* 其他基本資訊欄位... */}
      </div>
    </div>
  );
}
```

#### 步驟 6：重構主組件

**創建新的 `index.tsx`：**
```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { LostPetFormProps } from './types';
import { useLostPetForm } from './hooks/useLostPetForm';
import { useLostPetValidation } from './hooks/useLostPetValidation';
import { BasicInfoSection } from './components/BasicInfoSection';
import { AppearanceSection } from './components/AppearanceSection';
import { LocationSection } from './components/LocationSection';
import { ContactSection } from './components/ContactSection';
import { AdditionalSection } from './components/AdditionalSection';

export function LostPetForm({ initialData, onSubmit, isLoading = false }: LostPetFormProps) {
  const {
    formData,
    errors,
    setErrors,
    handleInputChange,
    getCurrentBreedOptions
  } = useLostPetForm(initialData);

  const { validateForm } = useLostPetValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast({
        title: "表單驗證失敗",
        description: "請檢查並修正標示的錯誤欄位",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: "成功提交",
        description: "走失寵物資訊已成功提交",
      });
    } catch (error) {
      console.error('表單提交失敗:', error);
      toast({
        title: "提交失敗",
        description: "請稍後再試或聯絡客服",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          走失寵物協尋表單
        </CardTitle>
        <CardDescription>
          請詳細填寫寵物資訊，幫助我們更快找到您的寵物
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection
            formData={formData}
            errors={errors}
            breedOptions={getCurrentBreedOptions()}
            onInputChange={handleInputChange}
          />
          
          <Separator />
          
          <AppearanceSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
          
          <Separator />
          
          <LocationSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
          
          <Separator />
          
          <ContactSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
          
          <Separator />
          
          <AdditionalSection
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" disabled={isLoading}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '提交中...' : '提交走失寵物資訊'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## 📋 重構檢查清單

### ✅ 完成後檢查項目：

- [ ] 原始文件備份完成
- [ ] 新的目錄結構創建完成
- [ ] 所有類型定義提取到獨立文件
- [ ] 常數提取到獨立文件
- [ ] 自定義 Hook 創建完成
- [ ] 區塊組件創建完成
- [ ] 主組件重構完成
- [ ] 所有文件都在 200 行以內
- [ ] 功能測試通過
- [ ] 沒有 TypeScript 錯誤
- [ ] 沒有 ESLint 警告

### 🧪 測試步驟：

1. **編譯測試**：確保沒有 TypeScript 錯誤
2. **功能測試**：測試表單的所有功能
3. **驗證測試**：測試表單驗證邏輯
4. **提交測試**：測試表單提交流程

### 📝 提交 Git 版本：

```bash
git add .
git commit -m "refactor: 重構 lost-pet-form 組件，拆分為多個模組

- 將 608 行的單一組件拆分為多個小組件
- 提取類型定義到獨立文件
- 創建可重用的自定義 Hook
- 提取常數到獨立文件
- 改善代碼可讀性和維護性

Breaking Changes: 無
Tested: ✅ 功能測試通過"
```

---

**下一步：** 完成這個重構後，繼續進行後端服務的重構。建議按照 `CODE_QUALITY_ENHANCEMENT.md` 中的時程安排進行。

**重要提醒：** 每次重構完成後都要進行充分的測試，確保功能正常運作再進行下一步！