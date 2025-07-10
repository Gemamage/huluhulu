import { petService } from '@/services/petService';
import { Pet, CreatePetData, UpdatePetData } from '@/types/pet';
import { SearchFilters } from '@/types/search';
import { authService } from '@/services/authService';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock authService
jest.mock('@/services/authService', () => ({
  authService: {
    getToken: jest.fn(),
    removeToken: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('petService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('mock-token');
  })

  const mockOwner = {
    _id: 'owner-1',
    username: 'petowner',
    email: 'owner@example.com',
  };
 
  const mockPet: Pet = {
    _id: '1',
    name: '小白',
    type: 'dog',
    breed: '拉布拉多',
    age: 2,
    gender: 'male',
    size: 'large',
    color: '白色',
    description: '很友善的狗狗',
    status: 'lost',
    lastSeenLocation: {
      address: '台北市信義區',
      coordinates: [121.5654, 25.0330]
    },
    contactInfo: {
      phone: '0912345678',
      email: 'test@example.com',
      preferredContact: 'phone'
    },
    images: ['https://example.com/image1.jpg'],
    owner: mockOwner,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    viewCount: 10,
    shareCount: 5
  }

  describe('getAllPets', () => {
    it('fetches all pets successfully', async () => {
      const mockPets = [{ id: '1', name: 'Fido' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets, total: 1 }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })

      const result = await petService.getAllPets()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/pets', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual({ pets: mockPets, total: 1 })
    })

    it('fetches pets with filters', async () => {
      const filters: SearchFilters = {
        type: 'dog',
        status: 'lost',
        location: '台北市',
      };
      const mockResponse = {
        pets: [mockPet],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await petService.getAllPets(filters);

      const expectedUrl = new URL('http://localhost:3001/api/pets');
      if (filters.type) expectedUrl.searchParams.set('type', filters.type);
      if (filters.status) expectedUrl.searchParams.set('status', filters.status);
      if (filters.location) expectedUrl.searchParams.set('location', filters.location);

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl.toString(),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API error when fetching pets', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(petService.getAllPets()).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });
  })

  describe('getPetById', () => {
    it('fetches pet by ID successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPet,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await petService.getPetById('1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/1',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockPet);
    });

    it('handles pet not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(petService.getPetById('999')).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });
  })

  describe('createPet', () => {
    it('creates pet successfully', async () => {
      const createData: CreatePetData = {
        name: '小白',
        type: 'dog',
        breed: '拉布拉多',
        age: 2,
        gender: 'male',
        size: 'large',
        color: '白色',
        description: '很友善的狗狗',
        status: 'lost',
        lastSeenLocation: {
          address: '台北市信義區',
          coordinates: [121.5654, 25.0330]
        },
        contactInfo: {
          phone: '0912345678',
          email: 'test@example.com',
          preferredContact: 'phone'
        }
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPet,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await petService.createPet(createData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets',
        {
          method: 'POST',
          body: JSON.stringify(createData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toEqual(mockPet);
    })

    it('handles validation errors', async () => {
      const createData: CreatePetData = {
        name: '',
        type: 'dog',
      } as CreatePetData;

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(petService.createPet(createData)).rejects.toThrow(
        'HTTP error! status: 400'
      );
    })
  })

  describe('updatePet', () => {
    it('updates pet successfully', async () => {
      const updateData: UpdatePetData = {
        name: '小白更新',
        description: '更新的描述'
      }
      const updatedPet = { ...mockPet, ...updateData }
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => updatedPet,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })

      const result = await petService.updatePet('1', updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/1',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
        }
      )
      expect(result).toEqual(updatedPet)
    })

    it('should handle not found error when updating a pet', async () => {
      const updateData: UpdatePetData = { name: 'Fido Updated' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(petService.updatePet('999', updateData)).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });
  })

  describe('deletePet', () => {
    it('deletes pet successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({}),
      })

      await petService.deletePet('1')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/pets/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should handle not found error when deleting a pet', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(petService.deletePet('999')).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });
  })

  describe('incrementViewCount', () => {
    it('increments view count successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({}),
      })

      await petService.incrementViewCount('1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/1/view',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  });

  describe('incrementShareCount', () => {
    it('increments share count successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        json: async () => ({}),
      })

      await petService.incrementShareCount('1')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/1/share',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      )
    })
  });

  describe('getMyPets', () => {
    it('fetches user pets successfully', async () => {
      const mockPets = [{ id: '1', name: 'Fido' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets, total: 1 }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })

      const result = await petService.getMyPets()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/pets/my', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual({ pets: mockPets, total: 1 })
    })
  });

  describe('searchPets', () => {
    it('searches pets with query', async () => {
      const mockPets = [{ id: '1', name: 'Fido' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets, total: 1 }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })

      const result = await petService.searchPets('Fido')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/search?q=Fido',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      )
      expect(result).toEqual({ pets: mockPets, total: 1 })
    })

    it('searches pets with filters and query', async () => {
      const mockPets = [{ id: '1', name: 'Fido' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets, total: 1 }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })

      const result = await petService.searchPets('Fido', {
        type: 'Dog',
        status: 'Available',
      })

      const expectedUrl = new URL('http://localhost:3001/api/pets/search')
      expectedUrl.searchParams.set('q', 'Fido')
      expectedUrl.searchParams.set('type', 'Dog')
      expectedUrl.searchParams.set('status', 'Available')

      expect(mockFetch).toHaveBeenCalledWith(expectedUrl.toString(), {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual({ pets: mockPets, total: 1 })
    })
  });
});