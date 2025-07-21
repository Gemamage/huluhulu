import { imageService } from '@/services/imageService';
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

// Mock Canvas API for image compression
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn((callback) => {
    const mockBlob = new Blob(['compressed-image-data'], { type: 'image/jpeg' });
    callback(mockBlob);
  }),
  width: 800,
  height: 600,
};

const mockCreateElement = jest.fn((tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  if (tagName === 'img') {
    const imgElement = {
      onload: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      src: '',
      width: 1200,
      height: 900,
    };
    return imgElement;
  }
  return {
    onload: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
  };
});

// Mock document.createElement
Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:mock-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: 'data:image/jpeg;base64,mock-base64-data',
  onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
  onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
};

Object.defineProperty(window, 'FileReader', {
  value: jest.fn(() => mockFileReader),
});

describe('imageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue('mock-token');
  });

  // Helper function to create mock File
  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File(['mock-file-content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  describe('uploadPetImage', () => {
    it('uploads pet image successfully', async () => {
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg', 1024 * 1024); // 1MB
      const mockImageUrl = 'https://example.com/uploaded-image.jpg';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imageUrl: mockImageUrl }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      const result = await imageService.uploadPetImage('pet-123', mockFile);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/pet-123/images',
        {
          method: 'POST',
          body: expect.any(FormData),
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
      expect(result).toBe(mockImageUrl);
    });

    it('handles upload failure', async () => {
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg', 1024 * 1024);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Upload failed' }),
      });

      await expect(imageService.uploadPetImage('pet-123', mockFile)).rejects.toThrow();
    });

    it('validates file before upload', async () => {
      const invalidFile = createMockFile('test-image.txt', 'text/plain', 1024);

      await expect(imageService.uploadPetImage('pet-123', invalidFile)).rejects.toThrow(
        '不支援的圖片格式'
      );
    });
  });

  describe('deletePetImage', () => {
    it('deletes pet image successfully', async () => {
      const imageUrl = 'https://example.com/image-to-delete.jpg';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      await imageService.deletePetImage('pet-123', imageUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/pets/pet-123/images',
        {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl }),
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('handles delete failure', async () => {
      const imageUrl = 'https://example.com/image-to-delete.jpg';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Image not found' }),
      });

      await expect(imageService.deletePetImage('pet-123', imageUrl)).rejects.toThrow();
    });
  });

  describe('validateImageFile', () => {
    it('validates supported image formats', () => {
      const jpegFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const pngFile = createMockFile('test.png', 'image/png', 1024 * 1024);
      const webpFile = createMockFile('test.webp', 'image/webp', 1024 * 1024);

      expect(() => imageService.validateImageFile(jpegFile)).not.toThrow();
      expect(() => imageService.validateImageFile(pngFile)).not.toThrow();
      expect(() => imageService.validateImageFile(webpFile)).not.toThrow();
    });

    it('rejects unsupported file formats', () => {
      const textFile = createMockFile('test.txt', 'text/plain', 1024);
      const pdfFile = createMockFile('test.pdf', 'application/pdf', 1024 * 1024);

      expect(() => imageService.validateImageFile(textFile)).toThrow(
        '不支援的圖片格式'
      );
      expect(() => imageService.validateImageFile(pdfFile)).toThrow(
        '不支援的圖片格式'
      );
    });

    it('validates file size limits', () => {
      const smallFile = createMockFile('small.jpg', 'image/jpeg', 1024 * 1024); // 1MB
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024); // 10MB

      expect(() => imageService.validateImageFile(smallFile)).not.toThrow();
      expect(() => imageService.validateImageFile(largeFile)).toThrow(
        '圖片檔案過大'
      );
    });

    it('returns true for valid files', () => {
      const validFile = createMockFile('valid.jpg', 'image/jpeg', 2 * 1024 * 1024); // 2MB
      
      const result = imageService.validateImageFile(validFile);
      expect(result).toBe(true);
    });
  });

  describe('compressImage', () => {
    it('compresses image with default settings', async () => {
      const originalFile = createMockFile('original.jpg', 'image/jpeg', 2 * 1024 * 1024);
      
      // Mock image loading
      setTimeout(() => {
        const img = mockCreateElement('img') as any;
        if (img.onload) {
          img.onload({} as Event);
        }
      }, 0);

      const compressedFile = await imageService.compressImage(originalFile);

      expect(compressedFile).toBeInstanceOf(File);
      expect(compressedFile.name).toBe('original.jpg');
      expect(compressedFile.type).toBe('image/jpeg');
    });

    it('compresses image with custom dimensions', async () => {
      const originalFile = createMockFile('original.jpg', 'image/jpeg', 2 * 1024 * 1024);
      
      setTimeout(() => {
        const img = mockCreateElement('img') as any;
        if (img.onload) {
          img.onload({} as Event);
        }
      }, 0);

      const compressedFile = await imageService.compressImage(originalFile, 400, 300, 0.8);

      expect(compressedFile).toBeInstanceOf(File);
      expect(mockCanvas.width).toBeLessThanOrEqual(400);
      expect(mockCanvas.height).toBeLessThanOrEqual(300);
    });

    it('handles image loading errors', async () => {
      const originalFile = createMockFile('original.jpg', 'image/jpeg', 2 * 1024 * 1024);
      
      setTimeout(() => {
        const img = mockCreateElement('img') as any;
        if (img.onerror) {
          img.onerror({} as Event);
        }
      }, 0);

      await expect(imageService.compressImage(originalFile)).rejects.toThrow(
        '圖片載入失敗'
      );
    });
  });

  describe('getImagePreview', () => {
    it('generates image preview successfully', async () => {
      const imageFile = createMockFile('preview.jpg', 'image/jpeg', 1024 * 1024);
      
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({} as ProgressEvent<FileReader>);
        }
      }, 0);

      const preview = await imageService.getImagePreview(imageFile);

      expect(preview).toBe('data:image/jpeg;base64,mock-base64-data');
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(imageFile);
    });

    it('handles file reading errors', async () => {
      const imageFile = createMockFile('preview.jpg', 'image/jpeg', 1024 * 1024);
      
      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror({} as ProgressEvent<FileReader>);
        }
      }, 0);

      await expect(imageService.getImagePreview(imageFile)).rejects.toThrow(
        '圖片預覽生成失敗'
      );
    });
  });

  describe('error handling', () => {
    it('handles network errors during upload', async () => {
      const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(imageService.uploadPetImage('pet-123', mockFile)).rejects.toThrow();
    });

    it('handles API errors with detailed messages', async () => {
      const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({ 
          message: 'File too large',
          code: 'FILE_TOO_LARGE',
          maxSize: '5MB'
        }),
      });

      await expect(imageService.uploadPetImage('pet-123', mockFile)).rejects.toThrow();
    });

    it('handles timeout during image operations', async () => {
      const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(imageService.uploadPetImage('pet-123', mockFile)).rejects.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('validates, compresses, and uploads image in sequence', async () => {
      const originalFile = createMockFile('large-image.jpg', 'image/jpeg', 3 * 1024 * 1024);
      const mockImageUrl = 'https://example.com/compressed-uploaded-image.jpg';

      // Mock successful compression
      setTimeout(() => {
        const img = mockCreateElement('img') as any;
        if (img.onload) {
          img.onload({} as Event);
        }
      }, 0);

      // Mock successful upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ imageUrl: mockImageUrl }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });

      // Validate file
      expect(() => imageService.validateImageFile(originalFile)).not.toThrow();

      // Compress file
      const compressedFile = await imageService.compressImage(originalFile, 800, 600, 0.8);
      expect(compressedFile).toBeInstanceOf(File);

      // Upload compressed file
      const result = await imageService.uploadPetImage('pet-123', compressedFile);
      expect(result).toBe(mockImageUrl);
    });

    it('handles multiple image operations for same pet', async () => {
      const file1 = createMockFile('image1.jpg', 'image/jpeg', 1024 * 1024);
      const file2 = createMockFile('image2.png', 'image/png', 2 * 1024 * 1024);
      const imageUrl1 = 'https://example.com/image1.jpg';
      const imageUrl2 = 'https://example.com/image2.png';

      // Mock successful uploads
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: imageUrl1 }),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: imageUrl2 }),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
          headers: new Headers({ 'Content-Type': 'application/json' }),
        });

      // Upload multiple images
      const result1 = await imageService.uploadPetImage('pet-123', file1);
      const result2 = await imageService.uploadPetImage('pet-123', file2);
      
      expect(result1).toBe(imageUrl1);
      expect(result2).toBe(imageUrl2);

      // Delete one image
      await imageService.deletePetImage('pet-123', imageUrl1);
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});