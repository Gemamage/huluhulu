'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, MapPin, Calendar, Clock } from 'lucide-react';
import { LostPetFormData } from '../types';

interface LostInfoSectionProps {
  formData: LostPetFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof LostPetFormData, value: any) => void;
  onFieldBlur: (field: string, value: any) => void;
}

export function LostInfoSection({
  formData,
  errors,
  onInputChange,
  onFieldBlur,
}: LostInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5' />
          走失資訊
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='lostDate' className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              走失日期 *
            </Label>
            <Input
              id='lostDate'
              type='date'
              value={formData.lostDate}
              onChange={e => onInputChange('lostDate', e.target.value)}
              onBlur={e => onFieldBlur('lostDate', e.target.value)}
              className={errors.lostDate ? 'border-red-500' : ''}
            />
            {errors.lostDate && (
              <p className='text-red-500 text-sm mt-1'>{errors.lostDate}</p>
            )}
          </div>

          <div>
            <Label htmlFor='lostTime' className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              走失時間（大約）
            </Label>
            <Input
              id='lostTime'
              type='time'
              value={formData.lostTime}
              onChange={e => onInputChange('lostTime', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor='lostLocation' className='flex items-center gap-2'>
            <MapPin className='h-4 w-4' />
            走失地點 *
          </Label>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-2'>
            <Input
              placeholder='城市'
              value={formData.lostLocation.city}
              onChange={e =>
                onInputChange('lostLocation', {
                  ...formData.lostLocation,
                  city: e.target.value,
                })
              }
              onBlur={e => onFieldBlur('lostLocation.city', e.target.value)}
              className={errors['lostLocation.city'] ? 'border-red-500' : ''}
            />
            <Input
              placeholder='區域'
              value={formData.lostLocation.district}
              onChange={e =>
                onInputChange('lostLocation', {
                  ...formData.lostLocation,
                  district: e.target.value,
                })
              }
              onBlur={e => onFieldBlur('lostLocation.district', e.target.value)}
              className={
                errors['lostLocation.district'] ? 'border-red-500' : ''
              }
            />
            <Input
              placeholder='詳細地址'
              value={formData.lostLocation.address}
              onChange={e =>
                onInputChange('lostLocation', {
                  ...formData.lostLocation,
                  address: e.target.value,
                })
              }
              onBlur={e => onFieldBlur('lostLocation.address', e.target.value)}
              className={errors['lostLocation.address'] ? 'border-red-500' : ''}
            />
          </div>
          {(errors['lostLocation.city'] ||
            errors['lostLocation.district'] ||
            errors['lostLocation.address']) && (
            <p className='text-red-500 text-sm mt-1'>
              {errors['lostLocation.city'] ||
                errors['lostLocation.district'] ||
                errors['lostLocation.address']}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor='circumstances'>走失經過</Label>
          <Textarea
            id='circumstances'
            value={formData.circumstances}
            onChange={e => onInputChange('circumstances', e.target.value)}
            placeholder='請描述走失的經過，例如：散步時掙脫牽繩、開門時跑出等'
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
