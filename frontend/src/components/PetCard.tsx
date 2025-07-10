import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Share2, MapPin, Calendar } from 'lucide-react';

// 簡化的 Pet 類型，匹配測試期望
export interface Pet {
  _id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
  breed?: string;
  age?: number;
  gender: 'male' | 'female' | 'unknown';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
  color: string;
  description: string;
  status: 'lost' | 'found' | 'adopted';
  lastSeenLocation: {
    address: string;
    coordinates: [number, number];
  };
  contactInfo: {
    phone?: string;
    email?: string;
    preferredContact: 'phone' | 'email' | 'both';
  };
  images: string[];
  owner: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  shareCount: number;
}

interface PetCardProps {
  pet: Pet;
  onClick?: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onClick }) => {
  const getStatusText = (status: Pet['status']) => {
    switch (status) {
      case 'lost':
        return '走失';
      case 'found':
        return '已找到';
      case 'adopted':
        return '已領養';
      default:
        return status;
    }
  };

  const getStatusColor = (status: Pet['status']) => {
    switch (status) {
      case 'lost':
        return 'destructive';
      case 'found':
        return 'default';
      case 'adopted':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSizeText = (size: Pet['size']) => {
    switch (size) {
      case 'tiny':
        return '極小型';
      case 'small':
        return '小型';
      case 'medium':
        return '中型';
      case 'large':
        return '大型';
      case 'giant':
        return '巨型';
      default:
        return size;
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(pet);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleCardClick}
      role="article"
    >
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          {pet.images && pet.images.length > 0 ? (
            <Image
              src={pet.images[0]}
              alt={pet.name}
              fill={true}
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-500">無圖片</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={getStatusColor(pet.status)}>
              {getStatusText(pet.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold">{pet.name}</h3>
            <div className="flex items-center space-x-1" data-testid="pet-gender">
              <span className="text-sm text-gray-600">
                {pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '?'}
              </span>
            </div>
          </div>
          
          {pet.breed && (
            <p className="text-sm text-gray-600">{pet.breed}</p>
          )}
          
          {pet.age && (
            <p className="text-sm text-gray-600">{pet.age}歲</p>
          )}
          
          <p className="text-sm text-gray-600">{getSizeText(pet.size)}</p>
          
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{pet.lastSeenLocation.address}</span>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{pet.viewCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Share2 className="h-4 w-4" />
                <span>{pet.shareCount}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>{new Date(pet.createdAt).toLocaleDateString('zh-TW')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetCard;