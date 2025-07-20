// 寵物相關類型定義
// 這個文件提供前端測試所需的寵物類型定義

export type PetType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type PetGender = 'male' | 'female' | 'unknown';
export type PetSize = 'small' | 'medium' | 'large';
export type PetStatus = 'lost' | 'found' | 'adopted';

export interface Location {
  address: string;
  coordinates: [number, number];
}

export interface ContactInfo {
  phone?: string;
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
  lastSeenLocation?: Location;
  lastSeenDate?: string; // 新增缺少的屬性
  contactInfo: ContactInfo;
  contactName?: string; // 新增缺少的屬性
  contactPhone?: string; // 新增缺少的屬性
  contactEmail?: string; // 新增缺少的屬性
  images?: string[];
  owner: PetOwner;
  createdAt: Date;
  updatedAt: Date;
  viewCount?: number;
  shareCount?: number;
  views?: number; // 相容性支援
  shares?: number; // 相容性支援
}

export interface CreatePetData {
  name: string;
  type: PetType;
  breed?: string;
  age?: number;
  gender: PetGender;
  size: PetSize;
  color?: string;
  description?: string;
  status: PetStatus;
  lastSeenLocation?: Location;
  contactInfo: ContactInfo;
  images?: string[];
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
