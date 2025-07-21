import { useState, useCallback } from 'react';
import { LostPetFormData, FormErrors } from '../types';
import { BREED_OPTIONS } from '../constants/formOptions';

export function useLostPetForm(initialData?: Partial<LostPetFormData>) {
  const [formData, setFormData] = useState<LostPetFormData>({
    name: initialData?.name ?? '',
    type: initialData?.type ?? 'dog',
    ...(initialData?.breed !== undefined && { breed: initialData.breed }),
    gender: initialData?.gender ?? 'unknown',
    ...(initialData?.age !== undefined && { age: initialData.age }),
    ...(initialData?.size !== undefined && { size: initialData.size }),
    ...(initialData?.color !== undefined && { color: initialData.color }),
    ...(initialData?.weight !== undefined && { weight: initialData.weight }),
    ...(initialData?.description !== undefined && { description: initialData.description }),
    ...(initialData?.specialMarks !== undefined && { specialMarks: initialData.specialMarks }),
    ...(initialData?.personality !== undefined && { personality: initialData.personality }),
    lostLocation: initialData?.lostLocation ?? {
      city: '',
      district: '',
      address: '',
    },
    lostDate: (initialData?.lostDate || new Date().toISOString().split('T')[0]) as string,
    ...(initialData?.lostTime !== undefined && { lostTime: initialData.lostTime }),
    ...(initialData?.circumstances !== undefined && { circumstances: initialData.circumstances }),
    ownerContact: {
      name: initialData?.ownerContact?.name ?? '',
      phone: initialData?.ownerContact?.phone ?? '',
      ...(initialData?.ownerContact?.email !== undefined && { email: initialData.ownerContact.email }),
      preferredContact: initialData?.ownerContact?.preferredContact ?? 'phone',
    },
    ...(initialData?.images !== undefined && { images: initialData.images }),
    ...(initialData?.microchipId !== undefined && { microchipId: initialData.microchipId }),
    hasCollar: initialData?.hasCollar ?? false,
    ...(initialData?.collarDescription !== undefined && { collarDescription: initialData.collarDescription }),
    ...(initialData?.healthCondition !== undefined && { healthCondition: initialData.healthCondition }),
    ...(initialData?.medications !== undefined && { medications: initialData.medications }),
    reward: initialData?.reward ?? null,
    ...(initialData?.rewardDescription !== undefined && { rewardDescription: initialData.rewardDescription }),
    ...(initialData?.additionalNotes !== undefined && { additionalNotes: initialData.additionalNotes }),
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
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
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
      gender: 'unknown',
      lostLocation: {
        city: '',
        district: '',
        address: '',
      },
      lostDate: new Date().toISOString().split('T')[0] as string,
      ownerContact: {
        name: '',
        phone: '',
        preferredContact: 'phone',
      },
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
