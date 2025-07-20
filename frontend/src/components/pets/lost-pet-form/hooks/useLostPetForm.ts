import { useState, useCallback } from 'react';
import { LostPetFormData, FormErrors } from '../types';
import { BREED_OPTIONS } from '../constants/formOptions';

export function useLostPetForm(initialData?: Partial<LostPetFormData>) {
  const [formData, setFormData] = useState<LostPetFormData>({
    name: initialData?.name ?? '',
    type: initialData?.type ?? 'dog',
    breed: initialData?.breed ?? [],
    gender: initialData?.gender ?? 'unknown',
    age: initialData?.age ?? 'adult',
    size: initialData?.size ?? 'medium',
    color: initialData?.color ?? [],
    weight: initialData?.weight,
    description: initialData?.description ?? [],
    specialMarks: initialData?.specialMarks,
    personality: initialData?.personality ?? [],
    lostLocation: initialData?.lostLocation ?? {
      city: '',
      district: '',
      address: '',
    },
    lostDate: initialData?.lostDate ?? new Date().toISOString().split('T')[0],
    lostTime: initialData?.lostTime ?? undefined,
    circumstances: initialData?.circumstances ?? undefined,
    ownerContact: {
      name: initialData?.ownerContact?.name ?? '',
      phone: initialData?.ownerContact?.phone ?? '',
      email: initialData?.ownerContact?.email,
      preferredContact: initialData?.ownerContact?.preferredContact ?? 'phone',
    },
    images: initialData?.images ?? [],
    microchipId: initialData?.microchipId,
    hasCollar: initialData?.hasCollar ?? false,
    collarDescription: initialData?.collarDescription,
    healthCondition: initialData?.healthCondition,
    medications: initialData?.medications,
    reward: initialData?.reward,
    rewardDescription: initialData?.rewardDescription,
    additionalNotes: initialData?.additionalNotes,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = useCallback(
    (field: string, value: any) => {
      setFormData(prev => {
        const keys = field.split('.');
        if (keys.length === 1) {
          return { ...prev, [field]: value };
        } else if (keys.length === 2) {
          return {
            ...prev,
            [keys[0] as string]: {
              ...(prev[keys[0] as keyof LostPetFormData] as any),
              [keys[1] as string]: value,
            },
          };
        }
        return prev;
      });

      // 清除該欄位的錯誤
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const getCurrentBreedOptions = useCallback(() => {
    const typeKey = formData.type as keyof typeof BREED_OPTIONS;
    return [...(BREED_OPTIONS[typeKey] || BREED_OPTIONS.other)];
  }, [formData.type]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: 'dog',
      breed: [],
      gender: 'unknown',
      age: 'adult',
      size: 'medium',
      color: [],
      weight: undefined,
      description: [],
      specialMarks: '',
      personality: [],
      lostLocation: {
        city: '',
        district: '',
        address: '',
      },
      lostDate: new Date().toISOString().split('T')[0],
      lostTime: undefined,
      circumstances: undefined,
      ownerContact: {
        name: '',
        phone: '',
        email: '',
        preferredContact: 'phone',
      },
      images: [],
      microchipId: '',
      hasCollar: false,
      collarDescription: '',
      healthCondition: '',
      medications: '',
      reward: undefined,
      rewardDescription: '',
      additionalNotes: '',
    });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    setErrors,
    handleInputChange,
    getCurrentBreedOptions,
    resetForm,
  };
}
