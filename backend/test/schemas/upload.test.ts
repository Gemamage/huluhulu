import { 
  presignedUrlSchema,
  searchHistoryQuerySchema,
  PresignedUrlRequest,
  SearchHistoryQueryRequest
} from '../../src/schemas/upload';

describe('Upload Schemas', () => {
  describe('presignedUrlSchema', () => {
    it('should validate valid presigned URL request', () => {
      const validData: PresignedUrlRequest = {
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        type: 'pet'
      };

      const result = presignedUrlSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should apply default type value', () => {
      const dataWithoutType = {
        fileName: 'test-image.png',
        mimeType: 'image/png'
      };

      const result = presignedUrlSchema.safeParse(dataWithoutType);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('pet');
      }
    });

    it('should reject empty fileName', () => {
      const invalidData = {
        fileName: '',
        mimeType: 'image/jpeg',
        type: 'pet'
      };

      const result = presignedUrlSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid mimeType', () => {
      const invalidData = {
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        type: 'pet'
      };

      const result = presignedUrlSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid image mimeTypes', () => {
      const validMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
      ];

      validMimeTypes.forEach(mimeType => {
        const data = {
          fileName: 'test-image',
          mimeType,
          type: 'avatar' as const
        };

        const result = presignedUrlSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid type values', () => {
      const invalidData = {
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        type: 'invalid'
      };

      const result = presignedUrlSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('searchHistoryQuerySchema', () => {
    it('should validate valid search history query', () => {
      const validData: SearchHistoryQueryRequest = {
        limit: 20
      };

      const result = searchHistoryQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should apply default limit value', () => {
      const result = searchHistoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit values below minimum', () => {
      const invalidData = {
        limit: 0
      };

      const result = searchHistoryQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit values above maximum', () => {
      const invalidData = {
        limit: 100
      };

      const result = searchHistoryQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer limit values', () => {
      const invalidData = {
        limit: 10.5
      };

      const result = searchHistoryQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});