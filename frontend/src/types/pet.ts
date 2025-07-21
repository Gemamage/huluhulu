// 寵物相關類型定義
// 這個文件提供前端測試所需的寵物類型定義

export type PetType =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'rabbit'
  | 'hamster'
  | 'fish'
  | 'reptile'
  | 'other';
export type PetGender = 'male' | 'female' | 'unknown';
export type PetSize = 'small' | 'medium' | 'large';
export type PetStatus = 'lost' | 'found' | 'adopted';

export interface Location {
  address: string;
  coordinates: [number, number];
}

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
  preferredContact: 'phone' | 'email';
}

export interface PetOwner {
  _id: string;
  username: string;
  email: string;
}

export interface Pet {
  _id: string;
  id?: string; // 相容性支援
  name: string;
  type: PetType;
  breed?: string;
  age?: number;
  gender: PetGender;
  size: PetSize;
  color?: string;
  description?: string;
  status: PetStatus;
  lastSeenLocation?: Location | string;
  lastSeenDate?: string;
  contactInfo: ContactInfo;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  images?: string[];
  owner: PetOwner | string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  viewCount?: number;
  shareCount?: number;
  views?: number; // 相容性支援
  shares?: number; // 相容性支援
  reward?: number;
  isUrgent?: boolean;
  microchipId?: string;
  vaccinated?: boolean;
  specialMarks?: string;
  personality?: string | string[];
  medicalConditions?: string | string[];
}

export interface CreatePetData {
  name: string;
  type: PetType;
  breed?: string;
  age?: number;
  gender: PetGender;
  size?: PetSize;
  color?: string;
  description?: string;
  status: PetStatus;
  lastSeenLocation?:
    | Location
    | {
        address: string;
        latitude?: number;
        longitude?: number;
      };
  contactInfo: ContactInfo;
  images?: string[];
  reward?: number;
  isUrgent?: boolean;
  microchipId?: string;
  vaccinated?: boolean;
  medicalConditions?: string;
  specialMarks?: string;
  personality?: string;
  healthCondition?: string;
  isVaccinated?: boolean;
  lastSeenDate?: string;
}

export interface UpdatePetData {
  name?: string;
  breed?: string;
  age?: number;
  gender?: PetGender;
  size?: PetSize;
  color?: string;
  description?: string;
  status?: PetStatus;
  lastSeenLocation?: Location;
  contactInfo?: ContactInfo;
  images?: string[];
}

export interface PetSearchResult {
  pets: Pet[];
  total: number;
  page: number;
  totalPages: number;
}
