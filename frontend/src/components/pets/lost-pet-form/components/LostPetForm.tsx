'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLostPetForm } from '../hooks/useLostPetForm';
import { useLostPetValidation } from '../hooks/useLostPetValidation';
import { LostPetFormProps } from '../types';
import {
  BasicInfoSection,
  AppearanceSection,
  LostInfoSection,
  ContactSection,
  ImageUploadSection,
  AdditionalInfoSection,
} from './';

export function LostPetForm({ onSubmit, initialData }: LostPetFormProps) {
  const {
    formData,
    errors,
    setErrors,
    handleInputChange,
    getCurrentBreedOptions,
    resetForm,
  } = useLostPetForm(initialData);

  const { validateForm, validateField } = useLostPetValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    const validation = validateForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      setSubmitMessage('請檢查並修正表單中的錯誤');
      return;
    }

    try {
      await onSubmit(formData);
      setSubmitMessage('走失寵物資訊已成功提交！');
      resetForm();
    } catch (error) {
      console.error('提交失敗:', error);
      setSubmitMessage('提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldBlur = (field: string, value: any) => {
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayToggle = (field: keyof typeof formData, value: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleInputChange(field, newArray);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>走失寵物登記</h1>
        <p className='text-gray-600'>
          請詳細填寫您寵物的資訊，這將幫助其他人更容易識別和聯繫您
        </p>
      </div>

      {submitMessage && (
        <Alert
          className={
            submitMessage.includes('成功')
              ? 'border-green-500'
              : 'border-red-500'
          }
        >
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{submitMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='space-y-8'>
        <BasicInfoSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onFieldBlur={handleFieldBlur}
          onArrayToggle={handleArrayToggle}
          getCurrentBreedOptions={getCurrentBreedOptions}
        />

        <AppearanceSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onArrayToggle={handleArrayToggle}
        />

        <LostInfoSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onFieldBlur={handleFieldBlur}
        />

        <ContactSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onFieldBlur={handleFieldBlur}
        />

        <ImageUploadSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
        />

        <AdditionalInfoSection
          formData={formData}
          errors={errors}
          onInputChange={handleInputChange}
          onFieldBlur={handleFieldBlur}
        />

        {/* 提交按鈕 */}
        <div className='flex justify-center space-x-4'>
          <Button
            type='button'
            variant='outline'
            onClick={resetForm}
            disabled={isSubmitting}
          >
            重置表單
          </Button>
          <Button type='submit' disabled={isSubmitting} className='min-w-32'>
            {isSubmitting ? '提交中...' : '提交走失寵物資訊'}
          </Button>
        </div>
      </form>
    </div>
  );
}
