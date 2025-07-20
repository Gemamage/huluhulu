'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Info, Heart } from 'lucide-react';
import { LostPetFormData } from '../types';

interface AdditionalInfoSectionProps {
  formData: LostPetFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof LostPetFormData, value: any) => void;
  onFieldBlur: (field: string, value: any) => void;
}

export function AdditionalInfoSection({
  formData,
  errors,
  onInputChange,
  onFieldBlur,
}: AdditionalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Info className='h-5 w-5' />
          額外資訊
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='reward' className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              懸賞金額（新台幣）
            </Label>
            <Input
              id='reward'
              type='number'
              min='0'
              value={formData.reward || ''}
              onChange={e => {
                const value = e.target.value;
                onInputChange('reward', value ? Number(value) : null);
              }}
              onBlur={e => {
                const value = e.target.value;
                onFieldBlur('reward', value ? Number(value) : null);
              }}
              placeholder='選填，例如：5000'
              className={errors.reward ? 'border-red-500' : ''}
            />
            {errors.reward && (
              <p className='text-red-500 text-sm mt-1'>{errors.reward}</p>
            )}
          </div>

          <div className='flex items-center space-x-2 pt-6'>
            <Checkbox
              id='hasCollar'
              checked={formData.hasCollar}
              onCheckedChange={checked => onInputChange('hasCollar', checked)}
            />
            <Label htmlFor='hasCollar' className='flex items-center gap-2'>
              <Heart className='h-4 w-4' />
              有戴項圈
            </Label>
          </div>
        </div>

        {formData.hasCollar && (
          <div>
            <Label htmlFor='collarDescription'>項圈描述</Label>
            <Textarea
              id='collarDescription'
              value={formData.collarDescription}
              onChange={e => onInputChange('collarDescription', e.target.value)}
              placeholder='請描述項圈的顏色、材質、是否有吊牌等'
              rows={2}
            />
          </div>
        )}

        <div>
          <Label htmlFor='healthCondition'>健康狀況</Label>
          <Textarea
            id='healthCondition'
            value={formData.healthCondition}
            onChange={e => onInputChange('healthCondition', e.target.value)}
            placeholder='例如：健康狀況、慢性疾病、過敏等'
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor='medications'>用藥資訊</Label>
          <Textarea
            id='medications'
            value={formData.medications}
            onChange={e => onInputChange('medications', e.target.value)}
            placeholder='例如：正在服用的藥物、用藥時間等'
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor='microchipId'>晶片號碼</Label>
          <Input
            id='microchipId'
            value={formData.microchipId}
            onChange={e => onInputChange('microchipId', e.target.value)}
            placeholder='如果有植入晶片，請填寫晶片號碼'
          />
        </div>

        {formData.reward && (
          <div>
            <Label htmlFor='rewardDescription'>懸賞說明</Label>
            <Textarea
              id='rewardDescription'
              value={formData.rewardDescription}
              onChange={e => onInputChange('rewardDescription', e.target.value)}
              placeholder='請說明懸賞的詳細條件'
              rows={2}
            />
          </div>
        )}

        <div>
          <Label htmlFor='additionalNotes'>其他備註</Label>
          <Textarea
            id='additionalNotes'
            value={formData.additionalNotes}
            onChange={e => onInputChange('additionalNotes', e.target.value)}
            placeholder='任何其他想要補充的資訊'
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
