// 驗證工具函數
// 這個文件提供前端測試所需的驗證工具函數

import { CreatePetData } from '@/types';
import { SearchFilters } from '@/types/search';

// 驗證結果介面
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 驗證錯誤介面
export interface ValidationError {
  field: string;
  message: string;
}

// 用戶註冊資料介面
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
}

/**
 * 驗證電子郵件格式
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * 驗證密碼強度
 * 要求：至少8個字符，包含大小寫字母、數字和特殊字符
 */
export const validatePassword = (password: string): boolean => {
  if (password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

/**
 * 驗證電話號碼格式
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;

  // Allow digits, +, -, (), and spaces
  const phoneRegex = /^[0-9\+\-\(\)\s]+$/;
  if (!phoneRegex.test(phone)) {
    return false;
  }

  // Remove all non-digit characters to check length
  const numericPhone = phone.replace(/\D/g, '');

  // Check if the length is between 8 and 14
  return numericPhone.length >= 8 && numericPhone.length < 15;
};

/**
 * 驗證必填項
 */
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * 驗證寵物資料
 */
export const validatePetData = (
  data: CreatePetData
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 驗證必填欄位
  if (!validateRequired(data.name)) errors.push('寵物名稱為必填項目');
  if (!validateRequired(data.type)) errors.push('寵物類型為必填項目');
  if (!validateRequired(data.gender)) errors.push('寵物性別為必填項目');
  if (!validateRequired(data.size)) errors.push('寵物體型為必填項目');
  if (!validateRequired(data.status)) errors.push('寵物狀態為必填項目');

  // 驗證年齡
  if (
    data.age !== undefined &&
    (typeof data.age !== 'number' || data.age < 0)
  ) {
    errors.push('寵物年齡必須為正數');
  }

  // 驗證位置資訊
  if (data.lastSeenLocation) {
    if (!validateRequired(data.lastSeenLocation.address)) {
      errors.push('最後出現地點為必填項目');
    }
    if (data.lastSeenLocation.coordinates) {
      const [lng, lat] = data.lastSeenLocation.coordinates;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        errors.push('經緯度座標無效');
      }
    }
  } else {
    errors.push('最後出現地點為必填項目');
  }

  // 驗證聯絡資訊
  if (data.contactInfo) {
    if (data.contactInfo.email && !validateEmail(data.contactInfo.email)) {
      errors.push('請輸入有效的電子郵件地址');
    }

    if (data.contactInfo.phone && !validatePhone(data.contactInfo.phone)) {
      errors.push('請輸入有效的電話號碼');
    }

    if (!data.contactInfo.phone && !data.contactInfo.email) {
      errors.push('至少需要提供一種聯絡方式');
    }
  } else {
    errors.push('聯絡資訊為必填項目');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證用戶註冊資料
 */
export const validateUserRegistration = (
  data: UserRegistrationData
): ValidationResult => {
  const errors: ValidationError[] = [];

  // 驗證姓名
  if (!validateRequired(data.name)) {
    errors.push({ field: 'name', message: '請輸入姓名' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: '姓名至少需要2個字符' });
  }

  // 驗證電子郵件
  if (!validateRequired(data.email)) {
    errors.push({ field: 'email', message: '請輸入電子郵件' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: '請輸入有效的電子郵件格式' });
  }

  // 驗證密碼
  if (!validateRequired(data.password)) {
    errors.push({ field: 'password', message: '請輸入密碼' });
  } else if (data.password.length < 8) {
    errors.push({ field: 'password', message: '密碼至少需要8個字符' });
  }

  // 驗證手機號碼（選填）
  if (data.phone && data.phone.trim() && !validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: '請輸入有效的手機號碼' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 將驗證錯誤轉換為表單錯誤格式
 */
export const convertValidationErrors = (
  errors: ValidationError[]
): Record<string, string> => {
  const formErrors: Record<string, string> = {};

  errors.forEach(error => {
    formErrors[error.field] = error.message;
  });

  return formErrors;
};

/**
 * 驗證搜尋過濾條件
 */
export const validateSearchFilters = (
  filters: SearchFilters
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 驗證位置搜尋範圍
  if (filters.location && typeof filters.location !== 'string') {
    errors.push('位置必須是字串格式');
  }

  // 驗證寵物類型
  const validTypes = [
    'dog',
    'cat',
    'bird',
    'rabbit',
    'hamster',
    'fish',
    'reptile',
    'other',
    '',
  ];
  if (filters.type && !validTypes.includes(filters.type)) {
    errors.push('無效的寵物類型');
  }

  // 驗證寵物狀態
  const validStatuses = ['lost', 'found', 'adopted', ''];
  if (filters.status && !validStatuses.includes(filters.status)) {
    errors.push('無效的狀態');
  }

  // 驗證寵物性別
  const validGenders = ['male', 'female', 'unknown', ''];
  if (filters.gender && !validGenders.includes(filters.gender)) {
    errors.push('無效的性別');
  }

  // 驗證寵物體型
  const validSizes = ['tiny', 'small', 'medium', 'large', 'giant', ''];
  if (filters.size && !validSizes.includes(filters.size)) {
    errors.push('無效的體型');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證用戶登入資料
 */
export const validateUserLogin = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // 驗證電子郵件
  if (!validateRequired(data.email)) {
    errors.push({ field: 'email', message: '電子郵件為必填項目' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: '請輸入有效的電子郵件格式' });
  }

  // 驗證密碼
  if (!validateRequired(data.password)) {
    errors.push({ field: 'password', message: '密碼為必填項目' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證密碼重設資料（請求重設）
 */
export const validatePasswordReset = (data: {
  email: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // 驗證電子郵件
  if (!validateRequired(data.email)) {
    errors.push({ field: 'email', message: '電子郵件為必填項目' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: '請輸入有效的電子郵件格式' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證新密碼設定資料
 */
export const validateNewPassword = (data: {
  password: string;
  confirmPassword: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // 驗證密碼
  if (!validateRequired(data.password)) {
    errors.push({ field: 'password', message: '密碼為必填項目' });
  } else if (!validatePassword(data.password)) {
    errors.push({ field: 'password', message: '密碼至少需要8個字符，包含大小寫字母、數字和特殊字符' });
  }

  // 驗證確認密碼
  if (!validateRequired(data.confirmPassword)) {
    errors.push({ field: 'confirmPassword', message: '確認密碼為必填項目' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證寵物表單資料
 */
export const validatePetForm = (data: CreatePetData): ValidationResult => {
  const errors: ValidationError[] = [];

  // 驗證寵物名稱
  if (!validateRequired(data.name)) {
    errors.push({ field: 'name', message: '寵物名稱為必填項目' });
  }

  // 驗證寵物類型
  if (!validateRequired(data.type)) {
    errors.push({ field: 'type', message: '寵物類型為必填項目' });
  }

  // 驗證寵物性別
  if (!validateRequired(data.gender)) {
    errors.push({ field: 'gender', message: '寵物性別為必填項目' });
  }

  // 驗證寵物體型
  if (!validateRequired(data.size)) {
    errors.push({ field: 'size', message: '寵物體型為必填項目' });
  }

  // 驗證寵物狀態
  if (!validateRequired(data.status)) {
    errors.push({ field: 'status', message: '寵物狀態為必填項目' });
  }

  // 驗證年齡
  if (
    data.age !== undefined &&
    (typeof data.age !== 'number' || data.age < 0)
  ) {
    errors.push({ field: 'age', message: '寵物年齡必須為正數' });
  }

  // 驗證位置資訊
  if (data.lastSeenLocation) {
    if (!validateRequired(data.lastSeenLocation.address)) {
      errors.push({
        field: 'lastSeenLocation.address',
        message: '最後出現地點為必填項目',
      });
    }
  } else {
    errors.push({
      field: 'lastSeenLocation',
      message: '最後出現地點為必填項目',
    });
  }

  // 驗證聯絡資訊
  if (data.contactInfo) {
    if (data.contactInfo.email && !validateEmail(data.contactInfo.email)) {
      errors.push({
        field: 'contactInfo.email',
        message: '請輸入有效的電子郵件地址',
      });
    }

    if (data.contactInfo.phone && !validatePhone(data.contactInfo.phone)) {
      errors.push({
        field: 'contactInfo.phone',
        message: '請輸入有效的電話號碼',
      });
    }

    if (!data.contactInfo.phone && !data.contactInfo.email) {
      errors.push({
        field: 'contactInfo',
        message: '至少需要提供一種聯絡方式',
      });
    }
  } else {
    errors.push({
      field: 'contactInfo',
      message: '聯絡資訊為必填項目',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 驗證規則物件 - 提供正則表達式和錯誤訊息
 */
export const ValidationRules = {
  email: {
    test: (value: string) => validateEmail(value),
    message: '請輸入有效的電子郵件格式',
  },
  password: {
    test: (value: string) => validatePassword(value),
    message: '密碼至少需要8個字符，包含大小寫字母、數字和特殊字符',
  },
  phone: {
    test: (value: string) => validatePhone(value),
    message: '請輸入有效的電話號碼',
  },
  name: {
    test: (value: string) => value && value.trim().length >= 2,
    message: '姓名至少需要2個字符',
  },
};

