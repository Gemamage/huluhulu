// 前端驗證工具 - 與後端 Zod schema 保持一致

// 基礎驗證規則
export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '請提供有效的電子郵件地址'
  },
  password: {
    minLength: 6,
    message: '密碼長度至少需要 6 個字符'
  },
  phone: {
    pattern: /^[+]?[0-9\s\-()]+$/,
    message: '請提供有效的電話號碼'
  },
  name: {
    minLength: 1,
    maxLength: 50,
    message: '姓名為必填項目且不能超過 50 個字符'
  },
  petName: {
    minLength: 1,
    maxLength: 50,
    message: '寵物名稱為必填項目且不能超過 50 個字符'
  },
  breed: {
    maxLength: 50,
    message: '品種名稱不能超過 50 個字符'
  },
  age: {
    min: 0,
    max: 30,
    message: '年齡必須在 0 到 30 歲之間'
  },
  color: {
    maxLength: 50,
    message: '顏色描述不能超過 50 個字符'
  },
  description: {
    maxLength: 1000,
    message: '描述不能超過 1000 個字符'
  },
  address: {
    minLength: 1,
    maxLength: 200,
    message: '地址為必填項目且不能超過 200 個字符'
  },
  latitude: {
    min: -90,
    max: 90,
    message: '緯度必須在 -90 到 90 之間'
  },
  longitude: {
    min: -180,
    max: 180,
    message: '經度必須在 -180 到 180 之間'
  },
  reward: {
    min: 0,
    message: '獎勵金額不能為負數'
  },
  microchipId: {
    maxLength: 50,
    message: '晶片 ID 不能超過 50 個字符'
  },
  medicalConditions: {
    maxLength: 500,
    message: '醫療狀況描述不能超過 500 個字符'
  },
  specialMarks: {
    maxLength: 500,
    message: '特殊標記描述不能超過 500 個字符'
  },
  personality: {
    maxLength: 500,
    message: '個性描述不能超過 500 個字符'
  }
};

// 驗證錯誤類型
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// 基礎驗證函數
export class Validator {
  private errors: ValidationError[] = [];

  // 重置錯誤
  reset(): void {
    this.errors = [];
  }

  // 添加錯誤
  addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  // 獲取驗證結果
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors]
    };
  }

  // 驗證必填字段
  required(value: any, field: string, customMessage?: string): this {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      this.addError(field, customMessage || `${field} 為必填項目`);
    }
    return this;
  }

  // 驗證字符串長度
  stringLength(value: string, field: string, options: { min?: number; max?: number; message?: string }): this {
    if (typeof value !== 'string') return this;
    
    const trimmedValue = value.trim();
    if (options.min !== undefined && trimmedValue.length < options.min) {
      this.addError(field, options.message || `${field} 長度至少需要 ${options.min} 個字符`);
    }
    if (options.max !== undefined && trimmedValue.length > options.max) {
      this.addError(field, options.message || `${field} 長度不能超過 ${options.max} 個字符`);
    }
    return this;
  }

  // 驗證數字範圍
  numberRange(value: number, field: string, options: { min?: number; max?: number; message?: string }): this {
    if (typeof value !== 'number' || isNaN(value)) return this;
    
    if (options.min !== undefined && value < options.min) {
      this.addError(field, options.message || `${field} 不能小於 ${options.min}`);
    }
    if (options.max !== undefined && value > options.max) {
      this.addError(field, options.message || `${field} 不能大於 ${options.max}`);
    }
    return this;
  }

  // 驗證正則表達式
  pattern(value: string, field: string, pattern: RegExp, message: string): this {
    if (typeof value !== 'string' || !pattern.test(value)) {
      this.addError(field, message);
    }
    return this;
  }

  // 驗證電子郵件
  email(value: string, field: string = 'email'): this {
    if (value && !ValidationRules.email.pattern.test(value)) {
      this.addError(field, ValidationRules.email.message);
    }
    return this;
  }

  // 驗證電話號碼
  phone(value: string, field: string = 'phone'): this {
    if (value && !ValidationRules.phone.pattern.test(value)) {
      this.addError(field, ValidationRules.phone.message);
    }
    return this;
  }

  // 驗證枚舉值
  enum(value: string, field: string, allowedValues: string[], message?: string): this {
    if (value && !allowedValues.includes(value)) {
      this.addError(field, message || `${field} 必須是以下值之一: ${allowedValues.join(', ')}`);
    }
    return this;
  }
}

// 寵物表單驗證
export function validatePetForm(formData: any): ValidationResult {
  const validator = new Validator();

  // 寵物名稱驗證
  validator
    .required(formData.name, 'name', '寵物名稱為必填項目')
    .stringLength(formData.name, 'name', { max: 50, message: ValidationRules.petName.message });

  // 寵物類型驗證
  validator.enum(formData.type, 'type', ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'], '請選擇有效的寵物類型');

  // 品種驗證（可選）
  if (formData.breed) {
    validator.stringLength(formData.breed, 'breed', { max: 50, message: ValidationRules.breed.message });
  }

  // 性別驗證
  validator.enum(formData.gender, 'gender', ['male', 'female', 'unknown'], '請選擇有效的性別');

  // 年齡驗證（可選）
  if (formData.age !== undefined && formData.age !== null && formData.age !== '') {
    const age = Number(formData.age);
    if (!isNaN(age)) {
      validator.numberRange(age, 'age', { min: 0, max: 30, message: ValidationRules.age.message });
    }
  }

  // 顏色驗證（可選）
  if (formData.color) {
    validator.stringLength(formData.color, 'color', { max: 50, message: ValidationRules.color.message });
  }

  // 體型驗證（可選）
  if (formData.size) {
    validator.enum(formData.size, 'size', ['small', 'medium', 'large'], '請選擇有效的體型');
  }

  // 狀態驗證
  validator.enum(formData.status, 'status', ['lost', 'found'], '請選擇有效的狀態');

  // 描述驗證（可選）
  if (formData.description) {
    validator.stringLength(formData.description, 'description', { max: 1000, message: ValidationRules.description.message });
  }

  // 地址驗證
  if (formData.lastSeenLocation) {
    validator
      .required(formData.lastSeenLocation.address, 'lastSeenLocation.address', '地址為必填項目')
      .stringLength(formData.lastSeenLocation.address, 'lastSeenLocation.address', { max: 200, message: ValidationRules.address.message });

    // 緯度驗證（可選）
    if (formData.lastSeenLocation.latitude !== undefined && formData.lastSeenLocation.latitude !== null) {
      const lat = Number(formData.lastSeenLocation.latitude);
      if (!isNaN(lat)) {
        validator.numberRange(lat, 'lastSeenLocation.latitude', { min: -90, max: 90, message: ValidationRules.latitude.message });
      }
    }

    // 經度驗證（可選）
    if (formData.lastSeenLocation.longitude !== undefined && formData.lastSeenLocation.longitude !== null) {
      const lng = Number(formData.lastSeenLocation.longitude);
      if (!isNaN(lng)) {
        validator.numberRange(lng, 'lastSeenLocation.longitude', { min: -180, max: 180, message: ValidationRules.longitude.message });
      }
    }
  }

  // 聯絡資訊驗證
  if (formData.contactInfo) {
    validator
      .required(formData.contactInfo.name, 'contactInfo.name', '聯絡人姓名為必填項目')
      .stringLength(formData.contactInfo.name, 'contactInfo.name', { max: 50, message: ValidationRules.name.message })
      .required(formData.contactInfo.phone, 'contactInfo.phone', '電話號碼為必填項目')
      .phone(formData.contactInfo.phone, 'contactInfo.phone');

    // 電子郵件驗證（可選）
    if (formData.contactInfo.email) {
      validator.email(formData.contactInfo.email, 'contactInfo.email');
    }

    // 偏好聯絡方式驗證
    validator.enum(formData.contactInfo.preferredContact, 'contactInfo.preferredContact', ['phone', 'email'], '請選擇有效的聯絡方式');
  }

  // 獎勵金額驗證（可選）
  if (formData.reward !== undefined && formData.reward !== null && formData.reward !== '') {
    const reward = Number(formData.reward);
    if (!isNaN(reward)) {
      validator.numberRange(reward, 'reward', { min: 0, message: ValidationRules.reward.message });
    }
  }

  // 晶片 ID 驗證（可選）
  if (formData.microchipId) {
    validator.stringLength(formData.microchipId, 'microchipId', { max: 50, message: ValidationRules.microchipId.message });
  }

  // 醫療狀況驗證（可選）
  if (formData.medicalConditions) {
    validator.stringLength(formData.medicalConditions, 'medicalConditions', { max: 500, message: ValidationRules.medicalConditions.message });
  }

  // 特殊標記驗證（可選）
  if (formData.specialMarks) {
    validator.stringLength(formData.specialMarks, 'specialMarks', { max: 500, message: ValidationRules.specialMarks.message });
  }

  // 個性描述驗證（可選）
  if (formData.personality) {
    validator.stringLength(formData.personality, 'personality', { max: 500, message: ValidationRules.personality.message });
  }

  return validator.getResult();
}

// 用戶註冊表單驗證
export function validateUserRegistration(formData: any): ValidationResult {
  const validator = new Validator();

  validator
    .required(formData.name, 'name', '姓名為必填項目')
    .stringLength(formData.name, 'name', { min: 2, max: 50, message: '姓名長度必須在 2 到 50 個字符之間' })
    .required(formData.email, 'email', '電子郵件為必填項目')
    .email(formData.email, 'email')
    .required(formData.password, 'password', '密碼為必填項目')
    .stringLength(formData.password, 'password', { min: 6, message: ValidationRules.password.message });

  // 電話號碼驗證（可選）
  if (formData.phone) {
    validator.phone(formData.phone, 'phone');
  }

  return validator.getResult();
}

// 用戶登入表單驗證
export function validateUserLogin(formData: any): ValidationResult {
  const validator = new Validator();

  validator
    .required(formData.email, 'email', '電子郵件為必填項目')
    .email(formData.email, 'email')
    .required(formData.password, 'password', '密碼為必填項目');

  return validator.getResult();
}

// 密碼重設表單驗證
export function validatePasswordReset(formData: any): ValidationResult {
  const validator = new Validator();

  validator
    .required(formData.password, 'password', '新密碼為必填項目')
    .stringLength(formData.password, 'password', { min: 8, message: '新密碼至少需要 8 個字符' });

  // 密碼強度驗證
  if (formData.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
    validator.addError('password', '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字');
  }

  // 確認密碼驗證
  if (formData.confirmPassword !== formData.password) {
    validator.addError('confirmPassword', '確認密碼與新密碼不一致');
  }

  return validator.getResult();
}

// 將驗證錯誤轉換為表單錯誤格式
export function convertValidationErrors(errors: ValidationError[]): Record<string, string> {
  const formErrors: Record<string, string> = {};
  errors.forEach(error => {
    formErrors[error.field] = error.message;
  });
  return formErrors;
}

// 檢查是否為有效的圖片 URL
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  } catch {
    return false;
  }
}

// 檢查是否為有效的日期
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// 導出常用的驗證函數
export const isValidEmail = (email: string): boolean => ValidationRules.email.pattern.test(email);
export const isValidPhone = (phone: string): boolean => ValidationRules.phone.pattern.test(phone);