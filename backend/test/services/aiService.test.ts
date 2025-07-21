import { aiService } from '../../src/services/aiService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Service', () => {
  const mockImageUrl = 'https://example.com/pet-image.jpg';
  const mockImageBuffer = Buffer.from('fake-image-data');
  
  const mockAIResponse = {
    predictions: [{
      breed: 'Golden Retriever',
      confidence: 0.95,
      features: [0.1, 0.2, 0.3, 0.4, 0.5],
      labels: ['dog', 'golden retriever', 'friendly'],
      colors: ['golden', 'white'],
      characteristics: ['long fur', 'friendly face', 'large size']
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ data: mockAIResponse });
  });

  describe('analyzePetImage', () => {
    it('should analyze pet image from URL successfully', async () => {
      const result = await aiService.analyzePetImage(mockImageUrl);
      
      expect(result).toEqual({
        breed: 'Golden Retriever',
        confidence: 0.95,
        features: [0.1, 0.2, 0.3, 0.4, 0.5],
        labels: ['dog', 'golden retriever', 'friendly'],
        colors: ['golden', 'white'],
        characteristics: ['long fur', 'friendly face', 'large size']
      });
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analyze'),
        expect.objectContaining({
          imageUrl: mockImageUrl
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });

    it('should analyze pet image from buffer successfully', async () => {
      const result = await aiService.analyzePetImage(mockImageBuffer);
      
      expect(result).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analyze'),
        expect.objectContaining({
          imageData: expect.any(String) // base64 encoded
        }),
        expect.any(Object)
      );
    });

    it('should handle low confidence predictions', async () => {
      const lowConfidenceResponse = {
        predictions: [{
          breed: 'Unknown',
          confidence: 0.3,
          features: [0.1, 0.1, 0.1, 0.1, 0.1],
          labels: ['animal'],
          colors: ['brown'],
          characteristics: ['unclear features']
        }]
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: lowConfidenceResponse });
      
      const result = await aiService.analyzePetImage(mockImageUrl);
      
      expect(result.confidence).toBe(0.3);
      expect(result.breed).toBe('Unknown');
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('AI service unavailable');
      mockedAxios.post.mockRejectedValueOnce(apiError);
      
      await expect(aiService.analyzePetImage(mockImageUrl))
        .rejects.toThrow('AI service unavailable');
    });

    it('should validate image input', async () => {
      await expect(aiService.analyzePetImage(''))
        .rejects.toThrow();
      
      await expect(aiService.analyzePetImage(null as any))
        .rejects.toThrow();
    });
  });

  describe('findSimilarPets', () => {
    const mockFeatures = [0.1, 0.2, 0.3, 0.4, 0.5];
    const mockSimilarPets = [
      {
        petId: '507f1f77bcf86cd799439011',
        similarity: 0.92,
        matchedFeatures: ['breed', 'color', 'size'],
        pet: {
          name: 'Max',
          type: 'dog',
          breed: 'Golden Retriever',
          lastSeenLocation: 'Central Park'
        }
      },
      {
        petId: '507f1f77bcf86cd799439012',
        similarity: 0.87,
        matchedFeatures: ['breed', 'color'],
        pet: {
          name: 'Buddy',
          type: 'dog',
          breed: 'Golden Retriever',
          lastSeenLocation: 'Brooklyn Bridge'
        }
      }
    ];

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({ data: { matches: mockSimilarPets } });
    });

    it('should find similar pets successfully', async () => {
      const result = await aiService.findSimilarPets(mockFeatures);
      
      expect(result).toEqual(mockSimilarPets);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/similarity'),
        expect.objectContaining({
          features: mockFeatures,
          threshold: expect.any(Number)
        }),
        expect.any(Object)
      );
    });

    it('should apply custom similarity threshold', async () => {
      const customThreshold = 0.8;
      await aiService.findSimilarPets(mockFeatures, customThreshold);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          threshold: customThreshold
        }),
        expect.any(Object)
      );
    });

    it('should handle no matches found', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { matches: [] } });
      
      const result = await aiService.findSimilarPets(mockFeatures);
      
      expect(result).toEqual([]);
    });

    it('should validate features array', async () => {
      await expect(aiService.findSimilarPets([]))
        .rejects.toThrow();
      
      await expect(aiService.findSimilarPets(null as any))
        .rejects.toThrow();
    });
  });

  describe('generatePetDescription', () => {
    const mockPetData = {
      type: 'dog',
      breed: 'Golden Retriever',
      colors: ['golden', 'white'],
      characteristics: ['friendly', 'large', 'long fur'],
      age: 'adult'
    };

    const mockGeneratedDescription = {
      description: '這是一隻友善的成年金毛獵犬，擁有金色和白色的毛髮，體型較大，毛髮較長。',
      keywords: ['友善', '金毛獵犬', '大型犬', '長毛'],
      searchTags: ['dog', 'golden-retriever', 'friendly', 'large']
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({ data: mockGeneratedDescription });
    });

    it('should generate pet description successfully', async () => {
      const result = await aiService.generatePetDescription(mockPetData);
      
      expect(result).toEqual(mockGeneratedDescription);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/generate-description'),
        expect.objectContaining({
          petData: mockPetData,
          language: 'zh-TW'
        }),
        expect.any(Object)
      );
    });

    it('should support different languages', async () => {
      await aiService.generatePetDescription(mockPetData, 'en');
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          language: 'en'
        }),
        expect.any(Object)
      );
    });

    it('should handle incomplete pet data', async () => {
      const incompletePetData = {
        type: 'dog'
        // Missing other fields
      };
      
      const result = await aiService.generatePetDescription(incompletePetData);
      
      expect(result).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('extractImageFeatures', () => {
    const mockExtractedFeatures = {
      features: [0.1, 0.2, 0.3, 0.4, 0.5],
      metadata: {
        imageQuality: 'high',
        resolution: '1920x1080',
        format: 'jpg',
        hasAnimal: true,
        animalCount: 1
      }
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({ data: mockExtractedFeatures });
    });

    it('should extract image features successfully', async () => {
      const result = await aiService.extractImageFeatures(mockImageUrl);
      
      expect(result).toEqual(mockExtractedFeatures);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/extract-features'),
        expect.objectContaining({
          imageUrl: mockImageUrl
        }),
        expect.any(Object)
      );
    });

    it('should handle poor quality images', async () => {
      const poorQualityResponse = {
        features: [0.0, 0.0, 0.0, 0.0, 0.0],
        metadata: {
          imageQuality: 'poor',
          resolution: '320x240',
          format: 'jpg',
          hasAnimal: false,
          animalCount: 0
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: poorQualityResponse });
      
      const result = await aiService.extractImageFeatures(mockImageUrl);
      
      expect(result.metadata.imageQuality).toBe('poor');
      expect(result.metadata.hasAnimal).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'ECONNABORTED';
      mockedAxios.post.mockRejectedValueOnce(timeoutError);
      
      await expect(aiService.analyzePetImage(mockImageUrl))
        .rejects.toThrow('Request timeout');
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(rateLimitError);
      
      await expect(aiService.analyzePetImage(mockImageUrl))
        .rejects.toThrow();
    });

    it('should handle invalid API responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: null });
      
      await expect(aiService.analyzePetImage(mockImageUrl))
        .rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      const authError = {
        response: {
          status: 401,
          data: { error: 'Invalid API key' }
        }
      };
      mockedAxios.post.mockRejectedValueOnce(authError);
      
      await expect(aiService.analyzePetImage(mockImageUrl))
        .rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use correct API endpoint', () => {
      aiService.analyzePetImage(mockImageUrl);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining(process.env.AI_SERVICE_URL || 'http://localhost:5000'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should include API key in headers', () => {
      aiService.analyzePetImage(mockImageUrl);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });
  });
});