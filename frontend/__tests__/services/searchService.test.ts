import { searchService } from '@/services/searchService';
import { SearchFilters, SearchResult } from '@/types/search';
import { Pet } from '@/types/pet';
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

describe('searchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('mock-token');
  });

  const mockSearchResult: SearchResult<Pet> = {
    items: [
      {
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
        lastSeenDate: '2023-01-01',
        contactInfo: {
          name: '測試用戶',
          phone: '0912345678',
          email: 'test@example.com',
          preferredContact: 'phone'
        },
        contactName: 'Test Owner',
        contactPhone: '0912345678',
        contactEmail: 'test@example.com',
        images: ['https://example.com/image1.jpg'],
        owner: {
          _id: 'owner-1',
          username: 'petowner',
          email: 'owner@example.com',
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        views: 10,
        shares: 5
      }
    ],
    total: 1,
    page: 1,
    totalPages: 1,
    limit: 10
  };

  describe('searchPets', () => {
    it('searches pets with query successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.searchPets('小白');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/search?q=%E5%B0%8F%E7%99%BD',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSearchResult);
    });

    it('searches pets with query and filters', async () => {
      const filters: Omit<SearchFilters, 'q'> = {
        type: 'dog',
        status: 'lost',
        location: '台北市',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.searchPets('小白', filters);

      const expectedUrl = new URL('http://localhost:3001/api/pets/search');
      expectedUrl.searchParams.set('q', '小白');
      expectedUrl.searchParams.set('type', 'dog');
      expectedUrl.searchParams.set('status', 'lost');
      expectedUrl.searchParams.set('location', '台北市');

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl.toString(),
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSearchResult);
    });

    it('handles search API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Search service unavailable' }),
      });

      await expect(searchService.searchPets('test')).rejects.toThrow();
    });
  });

  describe('advancedSearch', () => {
    it('performs advanced search successfully', async () => {
      const filters: SearchFilters = {
        type: 'dog',
        breed: '拉布拉多',
        age: 3,
        size: 'large',
        status: 'lost',
        location: '台北市',
        dateRange: {
          start: '2023-01-01',
          end: '2023-12-31'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.advancedSearch('小白', filters);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/advanced-search',
        {
          method: 'POST',
          body: JSON.stringify({ q: '小白', ...filters }),
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSearchResult);
    });

    it('handles advanced search with minimal filters', async () => {
      const filters: SearchFilters = {
        type: 'dog'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResult,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.advancedSearch('', filters);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/advanced-search',
        {
          method: 'POST',
          body: JSON.stringify({ q: '', ...filters }),
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSearchResult);
    });
  });

  describe('getSearchSuggestions', () => {
    it('gets search suggestions successfully', async () => {
      const mockSuggestions = {
        suggestions: ['小白', '小黑', '小花'],
        breeds: ['拉布拉多', '黃金獵犬', '柴犬'],
        locations: ['台北市', '新北市', '桃園市']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuggestions,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.getSearchSuggestions('小');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/search/suggestions?q=%E5%B0%8F',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSuggestions);
    });

    it('handles empty query for suggestions', async () => {
      const mockSuggestions = {
        suggestions: [],
        breeds: ['拉布拉多', '黃金獵犬', '柴犬'],
        locations: ['台北市', '新北市', '桃園市']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuggestions,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.getSearchSuggestions('');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/search/suggestions?q=',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockSuggestions);
    });
  });

  describe('getSearchAnalytics', () => {
    it('gets search analytics successfully', async () => {
      const mockAnalytics = {
        popularSearches: [
          { query: '小白', count: 150 },
          { query: '拉布拉多', count: 120 },
          { query: '台北市', count: 100 }
        ],
        searchTrends: {
          daily: [10, 15, 20, 25, 30],
          weekly: [100, 120, 150, 180, 200],
          monthly: [500, 600, 750, 800, 900]
        },
        topBreeds: [
          { breed: '拉布拉多', count: 50 },
          { breed: '黃金獵犬', count: 45 },
          { breed: '柴犬', count: 40 }
        ],
        topLocations: [
          { location: '台北市', count: 80 },
          { location: '新北市', count: 70 },
          { location: '桃園市', count: 60 }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.getSearchAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/search/analytics',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('checkSearchHealth', () => {
    it('checks search health successfully', async () => {
      const mockHealthStatus = {
        data: {
          elasticsearch: {
            status: 'green',
            nodes: 3,
            indices: 5
          }
        },
        responseTime: 45,
        lastUpdated: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthStatus,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.checkSearchHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/search/health',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockHealthStatus);
    });

    it('handles unhealthy search service', async () => {
      const mockHealthStatus = {
        data: {
          elasticsearch: {
            status: 'red',
            nodes: 1,
            indices: 5,
            error: 'Connection timeout'
          }
        },
        responseTime: 5000,
        lastUpdated: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthStatus,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await searchService.checkSearchHealth();

      expect(result.data.elasticsearch.status).toBe('red');
      expect(result.data.elasticsearch).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(searchService.searchPets('test')).rejects.toThrow();
    });

    it('handles API errors with error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid search parameters' }),
      });

      await expect(searchService.searchPets('test')).rejects.toThrow();
    });

    it('handles timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(searchService.searchPets('test')).rejects.toThrow();
    });
  });
});