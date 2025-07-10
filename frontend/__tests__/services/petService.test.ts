import { petService } from '@/services/petService'
import { Pet, CreatePetData, UpdatePetData } from '@/types/pet'
import { SearchFilters } from '@/types/search'

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}))

const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}

// Mock the axios instance
jest.mock('@/lib/axios', () => mockAxios)

describe('petService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
    owner: {
      _id: 'owner1',
      username: 'testuser',
      email: 'owner@example.com'
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    viewCount: 10,
    shareCount: 5
  }

  describe('getAllPets', () => {
    it('fetches all pets successfully', async () => {
      const mockResponse = {
        data: {
          pets: [mockPet],
          total: 1,
          page: 1,
          totalPages: 1
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await petService.getAllPets()

      expect(mockAxios.get).toHaveBeenCalledWith('/pets')
      expect(result).toEqual(mockResponse.data)
    })

    it('fetches pets with filters', async () => {
      const filters: SearchFilters = {
        type: 'dog',
        status: 'lost',
        location: '台北市'
      }
      const mockResponse = {
        data: {
          pets: [mockPet],
          total: 1,
          page: 1,
          totalPages: 1
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await petService.getAllPets(filters)

      expect(mockAxios.get).toHaveBeenCalledWith('/pets', {
        params: filters
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('handles API error', async () => {
      const errorMessage = 'Network Error'
      mockAxios.get.mockRejectedValue(new Error(errorMessage))

      await expect(petService.getAllPets()).rejects.toThrow(errorMessage)
    })
  })

  describe('getPetById', () => {
    it('fetches pet by ID successfully', async () => {
      const mockResponse = { data: mockPet }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await petService.getPetById('1')

      expect(mockAxios.get).toHaveBeenCalledWith('/pets/1')
      expect(result).toEqual(mockPet)
    })

    it('handles pet not found', async () => {
      mockAxios.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Pet not found' } }
      })

      await expect(petService.getPetById('999')).rejects.toMatchObject({
        response: { status: 404 }
      })
    })
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
      }
      const mockResponse = { data: mockPet }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await petService.createPet(createData)

      expect(mockAxios.post).toHaveBeenCalledWith('/pets', createData)
      expect(result).toEqual(mockPet)
    })

    it('handles validation errors', async () => {
      const createData: CreatePetData = {
        name: '',
        type: 'dog'
      } as CreatePetData
      
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Validation failed', errors: ['Name is required'] }
        }
      })

      await expect(petService.createPet(createData)).rejects.toMatchObject({
        response: { status: 400 }
      })
    })
  })

  describe('updatePet', () => {
    it('updates pet successfully', async () => {
      const updateData: UpdatePetData = {
        name: '小白更新',
        description: '更新的描述'
      }
      const updatedPet = { ...mockPet, ...updateData }
      const mockResponse = { data: updatedPet }
      mockAxios.put.mockResolvedValue(mockResponse)

      const result = await petService.updatePet('1', updateData)

      expect(mockAxios.put).toHaveBeenCalledWith('/pets/1', updateData)
      expect(result).toEqual(updatedPet)
    })

    it('handles unauthorized update', async () => {
      const updateData: UpdatePetData = { name: '小白更新' }
      mockAxios.put.mockRejectedValue({
        response: { status: 403, data: { message: 'Unauthorized' } }
      })

      await expect(petService.updatePet('1', updateData)).rejects.toMatchObject({
        response: { status: 403 }
      })
    })
  })

  describe('deletePet', () => {
    it('deletes pet successfully', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Pet deleted successfully' } })

      await petService.deletePet('1')

      expect(mockAxios.delete).toHaveBeenCalledWith('/pets/1')
    })

    it('handles unauthorized deletion', async () => {
      mockAxios.delete.mockRejectedValue({
        response: { status: 403, data: { message: 'Unauthorized' } }
      })

      await expect(petService.deletePet('1')).rejects.toMatchObject({
        response: { status: 403 }
      })
    })
  })

  describe('incrementViewCount', () => {
    it('increments view count successfully', async () => {
      mockAxios.post.mockResolvedValue({ data: { message: 'View count updated' } })

      await petService.incrementViewCount('1')

      expect(mockAxios.post).toHaveBeenCalledWith('/pets/1/view')
    })
  })

  describe('incrementShareCount', () => {
    it('increments share count successfully', async () => {
      mockAxios.post.mockResolvedValue({ data: { message: 'Share count updated' } })

      await petService.incrementShareCount('1')

      expect(mockAxios.post).toHaveBeenCalledWith('/pets/1/share')
    })
  })

  describe('getUserPets', () => {
    it('fetches user pets successfully', async () => {
      const mockResponse = {
        data: {
          pets: [mockPet],
          total: 1
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await petService.getUserPets('owner1')

      expect(mockAxios.get).toHaveBeenCalledWith('/pets/user/owner1')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('searchPets', () => {
    it('searches pets with query', async () => {
      const query = '拉布拉多'
      const mockResponse = {
        data: {
          pets: [mockPet],
          total: 1,
          page: 1,
          totalPages: 1
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await petService.searchPets(query)

      expect(mockAxios.get).toHaveBeenCalledWith('/pets/search', {
        params: { q: query }
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('searches pets with filters and query', async () => {
      const query = '拉布拉多'
      const filters: SearchFilters = { type: 'dog', status: 'lost' }
      const mockResponse = {
        data: {
          pets: [mockPet],
          total: 1,
          page: 1,
          totalPages: 1
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await petService.searchPets(query, filters)

      expect(mockAxios.get).toHaveBeenCalledWith('/pets/search', {
        params: { q: query, ...filters }
      })
      expect(result).toEqual(mockResponse.data)
    })
  })
})