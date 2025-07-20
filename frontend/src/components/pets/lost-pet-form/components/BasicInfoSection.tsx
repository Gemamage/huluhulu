'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import { LostPetFormData } from '../types';
import {
  PET_TYPES,
  GENDER_OPTIONS,
  AGE_OPTIONS,
  SIZE_OPTIONS
} from '../constants/formOptions';

interface BasicInfoSectionProps {
  formData: LostPetFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof LostPetFormData, value: any) => void;
  onFieldBlur: (field: string, value: any) => void;
  onArrayToggle: (field: keyof LostPetFormData, value: string) => void;
  getCurrentBreedOptions: () => string[];
}

export function BasicInfoSection({
  formData,
  errors,
  onInputChange,
  onFieldBlur,
  onArrayToggle,
  getCurrentBreedOptions
}: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          基本資訊
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">寵物名稱 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              onBlur={(e) => onFieldBlur('name', e.target.value)}
              placeholder="請輸入寵物名稱"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="type">寵物類型</Label>
            <Select value={formData.type} onValueChange={(value) => onInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>品種 *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {getCurrentBreedOptions().map((breed) => (
              <Badge
                key={breed}
                variant={formData.breed.includes(breed) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onArrayToggle('breed', breed)}
              >
                {breed}
              </Badge>
            ))}
          </div>
          {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="gender">性別</Label>
            <Select value={formData.gender} onValueChange={(value) => onInputChange('gender', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((gender) => (
                  <SelectItem key={gender.value} value={gender.value}>
                    {gender.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="age">年齡</Label>
            <Select value={formData.age} onValueChange={(value) => onInputChange('age', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_OPTIONS.map((age) => (
                  <SelectItem key={age.value} value={age.value}>
                    {age.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="size">體型</Label>
            <Select value={formData.size} onValueChange={(value) => onInputChange('size', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="colorInput">毛色 *</Label>
            <Input
              id="colorInput"
              placeholder="請輸入毛色，按 Enter 添加"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = e.currentTarget.value.trim();
                  if (value && !formData.color.includes(value)) {
                    onInputChange('color', [...formData.color, value]);
                    e.currentTarget.value = '';
                  }
                }
              }}
              className={errors.color ? 'border-red-500' : ''}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.color.map((color, index) => (
                <Badge key={index} variant="default" className="flex items-center gap-1">
                  {color}
                  <button
                    type="button"
                    onClick={() => {
                      const newColors = formData.color.filter((_, i) => i !== index);
                      onInputChange('color', newColors);
                    }}
                    className="ml-1 hover:bg-red-500 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
          </div>

          <div>
            <Label htmlFor="weight">體重（公斤）</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight || ''}
              onChange={(e) => onInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="例如：5.5"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}