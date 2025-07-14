import { CloudinaryService } from '../../src/services/cloudinaryService';
import { v2 as cloudinary } from 'cloudinary';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn()
    },
    api: {
      delete_resources: jest.fn()
    }
  }
}));

const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;

describe('CloudinaryService', () => {
  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockImagePath = '/path/to/image.jpg';
  const mockPublicId = 'pets/test-image-123';
  
  const mockUploadResult = {
    public_id: mockPublicId,
    secure_url: 'https://res.cloudinary.com/test/image/upload/v123/pets/test-image-123.jpg',
    width: 800,
    height: 600,
    format: 'jpg',
    bytes: 102400
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCloudinary.uploader.upload.mockResolvedValue(mockUploadResult as any);
    mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' } as any);
    mockCloudinary.api.delete_resources.mockResolvedValue({ deleted: {} } as any);
  });

  describe('uploadImage', () => {
    it('should upload image buffer successfully', async () => {
      const result = await CloudinaryService.uploadImage(mockImageBuffer, 'pets');
      
      expect(result).toEqual({
        publicId: mockPublicId,
        url: mockUploadResult.secure_url,
        width: mockUploadResult.width,
        height: mockUploadResult.height,
        format: mockUploadResult.format,
        bytes: mockUploadResult.bytes
      });
      
      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String), // base64 data URL
        expect.objectContaining({
          folder: 'pets',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto'
        })
      );
    });

    it('should upload image from file path successfully', async () => {
      const result = await CloudinaryService.uploadImage(mockImagePath, 'pets');
      
      expect(result).toBeDefined();
      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        mockImagePath,
        expect.objectContaining({
          folder: 'pets'
        })
      );
    });

    it('should apply custom upload options', async () => {
      const customOptions = {
        width: 500,
        height: 500,
        crop: 'fill' as const,
        quality: 80
      };
      
      await CloudinaryService.uploadImage(mockImageBuffer, 'pets', customOptions);
      
      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          folder: 'pets',
          ...customOptions
        })
      );
    });

    it('should handle upload errors', async () => {
      const uploadError = new Error('Upload failed');
      mockCloudinary.uploader.upload.mockRejectedValueOnce(uploadError);
      
      await expect(CloudinaryService.uploadImage(mockImageBuffer, 'pets'))
        .rejects.toThrow('Upload failed');
    });

    it('should validate folder parameter', async () => {
      await expect(CloudinaryService.uploadImage(mockImageBuffer, ''))
        .rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const result = await CloudinaryService.deleteImage(mockPublicId);
      
      expect(result).toEqual({ result: 'ok' });
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId);
    });

    it('should handle delete errors', async () => {
      const deleteError = new Error('Delete failed');
      mockCloudinary.uploader.destroy.mockRejectedValueOnce(deleteError);
      
      await expect(CloudinaryService.deleteImage(mockPublicId))
        .rejects.toThrow('Delete failed');
    });

    it('should validate publicId parameter', async () => {
      await expect(CloudinaryService.deleteImage(''))
        .rejects.toThrow();
    });
  });

  describe('deleteMultipleImages', () => {
    const mockPublicIds = ['pets/image1', 'pets/image2', 'pets/image3'];

    it('should delete multiple images successfully', async () => {
      const result = await CloudinaryService.deleteMultipleImages(mockPublicIds);
      
      expect(result).toEqual({ deleted: {} });
      expect(mockCloudinary.api.delete_resources).toHaveBeenCalledWith(
        mockPublicIds,
        { resource_type: 'image' }
      );
    });

    it('should handle batch delete errors', async () => {
      const batchError = new Error('Batch delete failed');
      mockCloudinary.api.delete_resources.mockRejectedValueOnce(batchError);
      
      await expect(CloudinaryService.deleteMultipleImages(mockPublicIds))
        .rejects.toThrow('Batch delete failed');
    });

    it('should validate publicIds array', async () => {
      await expect(CloudinaryService.deleteMultipleImages([]))
        .rejects.toThrow();
    });
  });

  describe('generateImageUrl', () => {
    it('should generate optimized image URL', () => {
      const url = CloudinaryService.generateImageUrl(mockPublicId, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto'
      });
      
      expect(url).toContain(mockPublicId);
      expect(url).toContain('w_300');
      expect(url).toContain('h_300');
      expect(url).toContain('c_fill');
      expect(url).toContain('q_auto');
    });

    it('should generate URL without transformations', () => {
      const url = CloudinaryService.generateImageUrl(mockPublicId);
      
      expect(url).toContain(mockPublicId);
      expect(url).toContain('cloudinary.com');
    });

    it('should handle responsive transformations', () => {
      const url = CloudinaryService.generateImageUrl(mockPublicId, {
        width: 'auto',
        crop: 'scale',
        responsive: true
      });
      
      expect(url).toContain('w_auto');
      expect(url).toContain('c_scale');
    });
  });

  describe('getImageInfo', () => {
    const mockImageInfo = {
      public_id: mockPublicId,
      format: 'jpg',
      width: 800,
      height: 600,
      bytes: 102400,
      created_at: '2024-01-15T10:00:00Z',
      secure_url: mockUploadResult.secure_url
    };

    beforeEach(() => {
      mockCloudinary.api.resource = jest.fn().mockResolvedValue(mockImageInfo);
    });

    it('should get image information successfully', async () => {
      const result = await CloudinaryService.getImageInfo(mockPublicId);
      
      expect(result).toEqual(mockImageInfo);
      expect(mockCloudinary.api.resource).toHaveBeenCalledWith(mockPublicId);
    });

    it('should handle image not found', async () => {
      const notFoundError = new Error('Resource not found');
      mockCloudinary.api.resource = jest.fn().mockRejectedValueOnce(notFoundError);
      
      await expect(CloudinaryService.getImageInfo('non-existent-id'))
        .rejects.toThrow('Resource not found');
    });
  });

  describe('Configuration', () => {
    it('should configure cloudinary with correct settings', () => {
      // This would typically be called during service initialization
      CloudinaryService.configure();
      
      expect(mockCloudinary.config).toHaveBeenCalledWith(
        expect.objectContaining({
          cloud_name: expect.any(String),
          api_key: expect.any(String),
          api_secret: expect.any(String),
          secure: true
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockCloudinary.uploader.upload.mockRejectedValueOnce(timeoutError);
      
      await expect(CloudinaryService.uploadImage(mockImageBuffer, 'pets'))
        .rejects.toThrow('Request timeout');
    });

    it('should handle invalid API credentials', async () => {
      const authError = new Error('Invalid API credentials');
      mockCloudinary.uploader.upload.mockRejectedValueOnce(authError);
      
      await expect(CloudinaryService.uploadImage(mockImageBuffer, 'pets'))
        .rejects.toThrow('Invalid API credentials');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');
      mockCloudinary.uploader.upload.mockRejectedValueOnce(quotaError);
      
      await expect(CloudinaryService.uploadImage(mockImageBuffer, 'pets'))
        .rejects.toThrow('Quota exceeded');
    });
  });
});