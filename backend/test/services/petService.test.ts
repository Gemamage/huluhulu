import { PetService } from '../../src/services/petService';
import { Pet, IPet } from '../../src/models/Pet';
import { User, IUser } from '../../src/models/User';
import { CloudinaryService } from '../../src/services/cloudinaryService';
import { aiService } from '../../src/services/aiService';
import { validUserData, validPetData } from '../utils/testData';
import mongoose from 'mongoose';

// Mock external services
jest.mock('../../src/services/cloudinaryService');
jest.mock('../../src/services/aiService');

const mockCloudinaryService = CloudinaryService as jest.Mocked<typeof CloudinaryService>;
const mockAiService = aiService as jest.Mocked<typeof aiService>;

describe('PetService', () => {
  let testUser: IUser;
  let testPet: IPet;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    
    testUser = await new User(validUserData).save();
    testPet = await new Pet({
      ...validPetData,
      owner: testUser._id
    }).save();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
  });

  describe('createPet', () => {
    const petData = {
      name: 'Buddy',
      type: 'dog' as const,
      breed: 'Golden Retriever',
      age: 3,
      gender: 'male' as const,
      size: 'large' as const,
      color: 'golden',
      description: 'Friendly dog',
      status: 'lost' as const,
      location: {
        address: '123 Main St',
        city: 'Test City',
        coordinates: [0, 0] as [number, number]
      },
      contact: {
        phone: '+1234567890',
        email: 'test@example.com'
      }
    };

    it('should create pet successfully', async () => {
      const result = await PetService.createPet(testUser._id.toString(), petData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(petData.name);
      expect(result.owner.toString()).toBe(testUser._id.toString());
      expect(result.type).toBe(petData.type);
      expect(result.status).toBe(petData.status);
    });

    it('should create pet with images', async () => {
      const images = ['image1.jpg', 'image2.jpg'];
      mockCloudinaryService.uploadImage.mockResolvedValue({
        public_id: 'test_id',
        secure_url: 'https://cloudinary.com/test.jpg',
        width: 800,
        height: 600
      });

      const result = await PetService.createPet(testUser._id.toString(), {
        ...petData,
        images
      });
      
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledTimes(2);
      expect(result.images).toHaveLength(2);
    });

    it('should analyze pet image with AI', async () => {
      const images = ['image1.jpg'];
      mockCloudinaryService.uploadImage.mockResolvedValue({
        public_id: 'test_id',
        secure_url: 'https://cloudinary.com/test.jpg',
        width: 800,
        height: 600
      });
      
      mockAiService.analyzeImage.mockResolvedValue({
        breed: 'Golden Retriever',
        confidence: 0.95,
        features: [0.1, 0.2, 0.3]
      });

      const result = await PetService.createPet(testUser._id.toString(), {
        ...petData,
        images
      });
      
      expect(mockAiService.analyzeImage).toHaveBeenCalled();
      expect(result.aiData?.breed).toBe('Golden Retriever');
      expect(result.aiData?.confidence).toBe(0.95);
    });

    it('should handle AI analysis failure gracefully', async () => {
      const images = ['image1.jpg'];
      mockCloudinaryService.uploadImage.mockResolvedValue({
        public_id: 'test_id',
        secure_url: 'https://cloudinary.com/test.jpg',
        width: 800,
        height: 600
      });
      
      mockAiService.analyzeImage.mockRejectedValue(new Error('AI service unavailable'));

      const result = await PetService.createPet(testUser._id.toString(), {
        ...petData,
        images
      });
      
      expect(result).toBeDefined();
      expect(result.aiData).toBeUndefined();
    });

    it('should validate required fields', async () => {
      await expect(PetService.createPet(testUser._id.toString(), {
        ...petData,
        name: ''
      })).rejects.toThrow();
    });

    it('should handle invalid owner ID', async () => {
      await expect(PetService.createPet('invalid-id', petData))
        .rejects.toThrow();
    });
  });

  describe('getPetById', () => {
    it('should get pet by ID successfully', async () => {
      const result = await PetService.getPetById(testPet._id.toString());
      
      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(testPet._id.toString());
      expect(result?.name).toBe(testPet.name);
    });

    it('should return null for non-existent pet', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await PetService.getPetById(nonExistentId);
      
      expect(result).toBeNull();
    });

    it('should handle invalid pet ID', async () => {
      await expect(PetService.getPetById('invalid-id'))
        .rejects.toThrow();
    });

    it('should populate owner information', async () => {
      const result = await PetService.getPetById(testPet._id.toString());
      
      expect(result?.owner).toBeDefined();
      expect(typeof result?.owner).toBe('object');
    });
  });

  describe('updatePet', () => {
    const updateData = {
      name: 'Updated Buddy',
      description: 'Updated description'
    };

    it('should update pet successfully', async () => {
      const result = await PetService.updatePet(
        testPet._id.toString(),
        testUser._id.toString(),
        updateData
      );
      
      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.description).toBe(updateData.description);
    });

    it('should not allow non-owner to update pet', async () => {
      const anotherUser = await new User({
        ...validUserData,
        email: 'another@example.com'
      }).save();
      
      await expect(PetService.updatePet(
        testPet._id.toString(),
        anotherUser._id.toString(),
        updateData
      )).rejects.toThrow('無權限');
    });

    it('should update pet images', async () => {
      const newImages = ['new-image.jpg'];
      mockCloudinaryService.uploadImage.mockResolvedValue({
        public_id: 'new_test_id',
        secure_url: 'https://cloudinary.com/new-test.jpg',
        width: 800,
        height: 600
      });

      const result = await PetService.updatePet(
        testPet._id.toString(),
        testUser._id.toString(),
        { images: newImages }
      );
      
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalled();
      expect(result?.images).toHaveLength(1);
    });

    it('should handle non-existent pet', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(PetService.updatePet(
        nonExistentId,
        testUser._id.toString(),
        updateData
      )).rejects.toThrow('寵物不存在');
    });

    it('should validate update data', async () => {
      await expect(PetService.updatePet(
        testPet._id.toString(),
        testUser._id.toString(),
        { age: -1 }
      )).rejects.toThrow();
    });
  });

  describe('deletePet', () => {
    it('should delete pet successfully', async () => {
      const result = await PetService.deletePet(
        testPet._id.toString(),
        testUser._id.toString()
      );
      
      expect(result).toBe(true);
      
      const deletedPet = await Pet.findById(testPet._id);
      expect(deletedPet).toBeNull();
    });

    it('should not allow non-owner to delete pet', async () => {
      const anotherUser = await new User({
        ...validUserData,
        email: 'another@example.com'
      }).save();
      
      await expect(PetService.deletePet(
        testPet._id.toString(),
        anotherUser._id.toString()
      )).rejects.toThrow('無權限');
    });

    it('should delete pet images from Cloudinary', async () => {
      // Add images to pet
      testPet.images = [{
        url: 'https://cloudinary.com/test.jpg',
        publicId: 'test_id',
        width: 800,
        height: 600
      }];
      await testPet.save();
      
      await PetService.deletePet(
        testPet._id.toString(),
        testUser._id.toString()
      );
      
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith('test_id');
    });

    it('should handle non-existent pet', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(PetService.deletePet(
        nonExistentId,
        testUser._id.toString()
      )).rejects.toThrow('寵物不存在');
    });
  });

  describe('searchPets', () => {
    beforeEach(async () => {
      // Create additional test pets
      await new Pet({
        ...validPetData,
        name: 'Cat Whiskers',
        type: 'cat',
        breed: 'Persian',
        status: 'found',
        owner: testUser._id
      }).save();
      
      await new Pet({
        ...validPetData,
        name: 'Dog Rex',
        type: 'dog',
        breed: 'German Shepherd',
        status: 'lost',
        size: 'large',
        owner: testUser._id
      }).save();
    });

    it('should search pets without filters', async () => {
      const result = await PetService.searchPets({});
      
      expect(result.pets).toHaveLength(3); // testPet + 2 additional
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
    });

    it('should filter pets by type', async () => {
      const result = await PetService.searchPets({ type: 'cat' });
      
      expect(result.pets).toHaveLength(1);
      expect(result.pets[0].type).toBe('cat');
    });

    it('should filter pets by status', async () => {
      const result = await PetService.searchPets({ status: 'lost' });
      
      expect(result.pets).toHaveLength(2);
      result.pets.forEach(pet => {
        expect(pet.status).toBe('lost');
      });
    });

    it('should filter pets by breed', async () => {
      const result = await PetService.searchPets({ breed: 'Persian' });
      
      expect(result.pets).toHaveLength(1);
      expect(result.pets[0].breed).toBe('Persian');
    });

    it('should filter pets by size', async () => {
      const result = await PetService.searchPets({ size: 'large' });
      
      expect(result.pets.length).toBeGreaterThan(0);
      result.pets.forEach(pet => {
        expect(pet.size).toBe('large');
      });
    });

    it('should search pets by location', async () => {
      const result = await PetService.searchPets({
        location: {
          coordinates: [0, 0],
          radius: 10
        }
      });
      
      expect(result.pets.length).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      const result = await PetService.searchPets({
        page: 1,
        limit: 2
      });
      
      expect(result.pets).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should sort pets by date', async () => {
      const result = await PetService.searchPets({
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      expect(result.pets.length).toBeGreaterThan(1);
      
      for (let i = 1; i < result.pets.length; i++) {
        expect(result.pets[i-1].createdAt.getTime())
          .toBeGreaterThanOrEqual(result.pets[i].createdAt.getTime());
      }
    });

    it('should handle text search', async () => {
      const result = await PetService.searchPets({ search: 'Whiskers' });
      
      expect(result.pets).toHaveLength(1);
      expect(result.pets[0].name).toContain('Whiskers');
    });
  });

  describe('findSimilarPets', () => {
    beforeEach(async () => {
      // Mock AI service for similarity search
      mockAiService.findSimilarPets.mockResolvedValue([
        {
          petId: testPet._id.toString(),
          similarity: 0.95,
          pet: testPet
        }
      ]);
    });

    it('should find similar pets using AI', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const result = await PetService.findSimilarPets(imageBuffer);
      
      expect(mockAiService.findSimilarPets).toHaveBeenCalledWith(imageBuffer, 0.7);
      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.95);
    });

    it('should use custom similarity threshold', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const threshold = 0.8;
      
      await PetService.findSimilarPets(imageBuffer, threshold);
      
      expect(mockAiService.findSimilarPets).toHaveBeenCalledWith(imageBuffer, threshold);
    });

    it('should handle AI service errors', async () => {
      mockAiService.findSimilarPets.mockRejectedValue(new Error('AI service error'));
      
      const imageBuffer = Buffer.from('fake-image-data');
      
      await expect(PetService.findSimilarPets(imageBuffer))
        .rejects.toThrow('AI service error');
    });
  });

  describe('updatePetStats', () => {
    it('should increment view count', async () => {
      const initialViews = testPet.stats.views;
      
      await PetService.updatePetStats(testPet._id.toString(), 'view');
      
      const updatedPet = await Pet.findById(testPet._id);
      expect(updatedPet?.stats.views).toBe(initialViews + 1);
    });

    it('should increment share count', async () => {
      const initialShares = testPet.stats.shares;
      
      await PetService.updatePetStats(testPet._id.toString(), 'share');
      
      const updatedPet = await Pet.findById(testPet._id);
      expect(updatedPet?.stats.shares).toBe(initialShares + 1);
    });

    it('should handle non-existent pet', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(PetService.updatePetStats(nonExistentId, 'view'))
        .rejects.toThrow('寵物不存在');
    });

    it('should handle invalid stat type', async () => {
      await expect(PetService.updatePetStats(testPet._id.toString(), 'invalid' as any))
        .rejects.toThrow();
    });
  });

  describe('getUserPets', () => {
    beforeEach(async () => {
      // Create additional pets for the user
      await new Pet({
        ...validPetData,
        name: 'User Pet 2',
        owner: testUser._id
      }).save();
    });

    it('should get all pets for a user', async () => {
      const result = await PetService.getUserPets(testUser._id.toString());
      
      expect(result.pets).toHaveLength(2);
      result.pets.forEach(pet => {
        expect(pet.owner.toString()).toBe(testUser._id.toString());
      });
    });

    it('should filter user pets by status', async () => {
      const result = await PetService.getUserPets(testUser._id.toString(), {
        status: 'lost'
      });
      
      result.pets.forEach(pet => {
        expect(pet.status).toBe('lost');
      });
    });

    it('should paginate user pets', async () => {
      const result = await PetService.getUserPets(testUser._id.toString(), {
        page: 1,
        limit: 1
      });
      
      expect(result.pets).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });

    it('should handle non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await PetService.getUserPets(nonExistentId);
      
      expect(result.pets).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('markPetAsFound', () => {
    it('should mark lost pet as found', async () => {
      testPet.status = 'lost';
      await testPet.save();
      
      const result = await PetService.markPetAsFound(
        testPet._id.toString(),
        testUser._id.toString()
      );
      
      expect(result?.status).toBe('found');
      expect(result?.foundAt).toBeDefined();
    });

    it('should not allow non-owner to mark pet as found', async () => {
      const anotherUser = await new User({
        ...validUserData,
        email: 'another@example.com'
      }).save();
      
      await expect(PetService.markPetAsFound(
        testPet._id.toString(),
        anotherUser._id.toString()
      )).rejects.toThrow('無權限');
    });

    it('should handle already found pet', async () => {
      testPet.status = 'found';
      await testPet.save();
      
      await expect(PetService.markPetAsFound(
        testPet._id.toString(),
        testUser._id.toString()
      )).rejects.toThrow('已經標記為找到');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      jest.spyOn(Pet, 'findById').mockRejectedValueOnce(new Error('Database connection failed'));
      
      await expect(PetService.getPetById(testPet._id.toString()))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle Cloudinary service errors', async () => {
      mockCloudinaryService.uploadImage.mockRejectedValueOnce(
        new Error('Cloudinary upload failed')
      );
      
      const petData = {
        name: 'Test Pet',
        type: 'dog' as const,
        breed: 'Test Breed',
        age: 1,
        gender: 'male' as const,
        size: 'medium' as const,
        color: 'brown',
        description: 'Test description',
        status: 'lost' as const,
        location: {
          address: '123 Test St',
          city: 'Test City',
          coordinates: [0, 0] as [number, number]
        },
        contact: {
          phone: '+1234567890',
          email: 'test@example.com'
        },
        images: ['test-image.jpg']
      };
      
      await expect(PetService.createPet(testUser._id.toString(), petData))
        .rejects.toThrow('Cloudinary upload failed');
    });
  });
});