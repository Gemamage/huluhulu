'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Phone, Mail } from 'lucide-react';
import { LostPetFormData } from '../types';
import { CONTACT_PREFERENCE_OPTIONS } from '../constants/formOptions';

interface ContactSectionProps {
  formData: LostPetFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof LostPetFormData, value: any) => void;
  onFieldBlur: (field: string, value: any) => void;
}

export function ContactSection({
  formData,
  errors,
  onInputChange,
  onFieldBlur,
}: ContactSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          聯絡資訊
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='ownerName' className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              您的稱呼 *
            </Label>
            <Input
              id='ownerName'
              value={formData.ownerContact.name}
              onChange={e =>
                onInputChange('ownerContact', {
                  ...formData.ownerContact,
                  name: e.target.value,
                })
              }
              onBlur={e => onFieldBlur('ownerContact.name', e.target.value)}
              placeholder='例如：陳小姐、熱心的王先生'
              className={errors['ownerContact.name'] ? 'border-red-500' : ''}
            />
            {errors['ownerContact.name'] && (
              <p className='text-red-500 text-sm mt-1'>
                {errors['ownerContact.name']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='ownerPhone' className='flex items-center gap-2'>
              <Phone className='h-4 w-4' />
              聯絡電話 *
            </Label>
            <Input
              id='ownerPhone'
              value={formData.ownerContact.phone}
              onChange={e =>
                onInputChange('ownerContact', {
                  ...formData.ownerContact,
                  phone: e.target.value,
                })
              }
              onBlur={e => onFieldBlur('ownerContact.phone', e.target.value)}
              placeholder='請填寫可聯絡的電話號碼'
              className={errors['ownerContact.phone'] ? 'border-red-500' : ''}
            />
            {errors['ownerContact.phone'] && (
              <p className='text-red-500 text-sm mt-1'>
                {errors['ownerContact.phone']}
              </p>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='ownerEmail' className='flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              電子郵件
            </Label>
            <Input
              id='ownerEmail'
              type='email'
              value={formData.ownerContact.email || ''}
              onChange={e => {
                const value = e.target.value;
                onInputChange('ownerContact', {
                  ...formData.ownerContact,
                  email: value || undefined,
                });
              }}
              onBlur={e => onFieldBlur('ownerContact.email', e.target.value)}
              placeholder='選填，方便聯絡'
              className={errors['ownerContact.email'] ? 'border-red-500' : ''}
            />
            {errors['ownerContact.email'] && (
              <p className='text-red-500 text-sm mt-1'>
                {errors['ownerContact.email']}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='preferredContact'>偏好聯絡方式</Label>
            <Select
              value={formData.ownerContact.preferredContact}
              onValueChange={value =>
                onInputChange('ownerContact', {
                  ...formData.ownerContact,
                  preferredContact: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_PREFERENCE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
