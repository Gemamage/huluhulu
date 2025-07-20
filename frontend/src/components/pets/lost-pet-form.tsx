'use client';

import React from 'react';
import { LostPetForm as LostPetFormComponent, LostPetFormProps } from './lost-pet-form/index';

export default function LostPetForm(props: LostPetFormProps) {
  return <LostPetFormComponent {...props} />;
}

// 重新導出類型以保持向後兼容性
export type { LostPetFormData, LostPetFormProps } from './lost-pet-form/index';