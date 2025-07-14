import { 
  imageOptimizeSchema,
  imageCropSchema,
  similaritySearchSchema,
  ImageOptimizeRequest,
  ImageCropRequest,
  SimilaritySearchRequest
} from '../../src/schemas/ai';

describe('AI Schemas', () => {
  describe('imageOptimizeSchema', () => {
    it('should validate valid image optimization parameters', () => {
      const validData: ImageOptimizeRequest = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 80,
        format: 'jpeg'
      };

      const result = imageOptimizeSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject invalid width values', () => {
      const invalidData = {
        maxWidth: 50, // 小於最小值 100
        quality: 80
      };

      const result = imageOptimizeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid quality values', () => {
      const invalidData = {
        quality: 5 // 小於最小值 10
      };

      const result = imageOptimizeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept empty object (all optional)', () => {
      const result = imageOptimizeSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('imageCropSchema', () => {
    it('should validate valid crop parameters', () => {
      const validData: ImageCropRequest = {
        x: 10,
        y: 20,
        width: 100,
        height: 150
      };

      const result = imageCropSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should coerce string numbers to numbers', () => {
      const stringData = {
        x: '10',
        y: '20',
        width: '100',
        height: '150'
      };

      const result = imageCropSchema.safeParse(stringData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          x: 10,
          y: 20,
          width: 100,
          height: 150
        });
      }
    });

    it('should reject negative coordinates', () => {
      const invalidData = {
        x: -5,
        y: 10,
        width: 100,
        height: 150
      };

      const result = imageCropSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative dimensions', () => {
      const invalidData = {
        x: 10,
        y: 20,
        width: 0,
        height: 150
      };

      const result = imageCropSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('similaritySearchSchema', () => {
    it('should validate valid similarity search parameters', () => {
      const validData: SimilaritySearchRequest = {
        petId: '507f1f77bcf86cd799439011',
        threshold: 0.8,
        limit: 20
      };

      const result = similaritySearchSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should apply default values', () => {
      const minimalData = {};

      const result = similaritySearchSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.threshold).toBe(0.7);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject invalid threshold values', () => {
      const invalidData = {
        threshold: 1.5 // 大於最大值 1
      };

      const result = similaritySearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid limit values', () => {
      const invalidData = {
        limit: 0 // 小於最小值 1
      };

      const result = similaritySearchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});