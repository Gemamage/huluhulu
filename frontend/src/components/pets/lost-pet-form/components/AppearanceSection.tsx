'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { LostPetFormData } from '../types';
import { APPEARANCE_OPTIONS, PERSONALITY_OPTIONS } from '../constants/formOptions';

interface AppearanceSectionProps {
  formData: LostPetFormData;
  errors: Record<string, string>;
  onInputChange: (field: keyof LostPetFormData, value: any) => void;
  onArrayToggle: (field: keyof LostPetFormData, value: string) => void;
}

export function AppearanceSection({
  formData,
  errors,
  onInputChange,
  onArrayToggle
}: AppearanceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          外觀與個性描述
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>外觀特徵 *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {APPEARANCE_OPTIONS.map((appearance) => (
              <Badge
                key={appearance}
                variant={formData.description.includes(appearance) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onArrayToggle('description', appearance)}
              >
                {appearance}
              </Badge>
            ))}
          </div>
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div>
          <Label>個性特徵 *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PERSONALITY_OPTIONS.map((personality) => (
              <Badge
                key={personality}
                variant={formData.personality.includes(personality) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onArrayToggle('personality', personality)}
              >
                {personality}
              </Badge>
            ))}
          </div>
          {errors.personality && <p className="text-red-500 text-sm mt-1">{errors.personality}</p>}
        </div>

        <div>
          <Label htmlFor="specialMarks">特殊標記</Label>
          <Textarea
            id="specialMarks"
            value={formData.specialMarks}
            onChange={(e) => onInputChange('specialMarks', e.target.value)}
            placeholder="例如：疤痕、胎記、特殊毛色分布等"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}