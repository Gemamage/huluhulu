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
  owner: PetOwner;
  createdAt: Date;
  updatedAt: Date;
  viewCount?: number;
  shareCount?: number;
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
