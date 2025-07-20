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
    
    // 走失地點驗證
    if (!formData.lostLocation.city || !formData.lostLocation.district || !formData.lostLocation.address.trim()) {
      newErrors['lostLocation.address'] = '請完整填寫走失地點';
    }
    
    if (!formData.lostDate) {
      newErrors.lostDate = '請選擇走失日期';
    }
    
    // 聯絡資訊驗證
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
    
    // 照片驗證
    if (formData.images.length === 0) {
      newErrors.images = '請至少上傳一張寵物照片';
    }
    
    // 體重驗證
    if (formData.weight !== undefined && (formData.weight <= 0 || formData.weight > 200)) {
      newErrors.weight = '請填寫有效的體重（0-200公斤）';
    }
    
    // 獎金驗證
    if (formData.reward !== undefined && formData.reward < 0) {
      newErrors.reward = '獎金金額不能為負數';
    }
    
    // 日期驗證
    const lostDate = new Date(formData.lostDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 設定為今天的最後一刻
    
    if (lostDate > today) {
      newErrors.lostDate = '走失日期不能是未來的日期';
    }
    
    // 時間格式驗證（如果有填寫）
    if (formData.lostTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.lostTime)) {
      newErrors.lostTime = '請填寫有效的時間格式（HH:MM）';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, []);

  const validateField = useCallback((field: string, value: any, formData: LostPetFormData): string => {
    switch (field) {
      case 'name':
        return !value?.trim() ? '請填寫寵物名稱' : '';
      
      case 'breed':
        return !value || value.length === 0 ? '請選擇寵物品種' : '';
      
      case 'color':
        return !value || value.length === 0 ? '請選擇寵物毛色' : '';
      
      case 'ownerContact.phone':
        if (!value?.trim()) return '請填寫聯絡電話';
        if (!/^[0-9+\-\s()]+$/.test(value)) return '請填寫有效的電話號碼';
        return '';
      
      case 'ownerContact.email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return '請填寫有效的電子郵件';
        }
        return '';
      
      case 'weight':
        if (value !== undefined && (value <= 0 || value > 200)) {
          return '請填寫有效的體重（0-200公斤）';
        }
        return '';
      
      case 'reward':
        if (value !== undefined && value < 0) {
          return '獎金金額不能為負數';
        }
        return '';
      
      case 'lostDate':
        if (!value) return '請選擇走失日期';
        const lostDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (lostDate > today) return '走失日期不能是未來的日期';
        return '';
      
      case 'lostTime':
        if (value && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
          return '請填寫有效的時間格式（HH:MM）';
        }
        return '';
      
      default:
        return '';
    }
  }, []);

  return {
    validateForm,
    validateField
  };
}