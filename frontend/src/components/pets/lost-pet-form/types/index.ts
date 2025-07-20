export interface LostPetFormData {
  // 基本資訊（必填）
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
  breed: string[];
  gender: 'male' | 'female' | 'unknown';
  age: 'puppy' | 'young' | 'adult' | 'senior';
  size: 'small' | 'medium' | 'large';
  color: string[];
  weight?: number;
  
  // 詳細特徵
  description: string[];
  specialMarks?: string;
  personality: string[];
  
  // 走失資訊
  lostLocation: LocationData;
  lostDate: string;
  lostTime?: string;
  circumstances?: string;
  
  // 飼主聯絡資訊
  ownerContact: {
    name: string;
    phone: string;
    email?: string;
    preferredContact: 'phone' | 'email';
  };
  
  // 照片（重要）
  images: string[];
  
  // 識別資訊
  microchipId?: string;
  hasCollar: boolean;
  collarDescription?: string;
  
  // 健康資訊
  healthCondition?: string;
  medications?: string;
  veterinarian?: string;
  
  // 獎金
  reward?: number;
  rewardDescription?: string;
  
  // 其他
  additionalNotes?: string;
}

export interface LostPetFormProps {
  initialData?: Partial<LostPetFormData>;
  onSubmit: (data: LostPetFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface FormErrors {
  [key: string]: string;
}

export interface LocationData {
  city: string;
  district: string;
  address: string;
}