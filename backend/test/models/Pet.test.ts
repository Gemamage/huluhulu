import { Pet, IPet } from '../../src/models/Pet';
import { User, IUser } from '../../src/models/User';
import mongoose from 'mongoose';
import { validUserData, validPetData, createTestPet } from '../utils/testData';

describe('Pet Model', () => {
  let testUser: IUser;



  beforeEach(async () => {
    testUser = await new User(validUserData).save();
  });

  afterEach(async () => {
    await Pet.deleteMany({});
    await User.deleteMany({});
  });

  describe('Pet Creation', () => {
    it('should create a valid pet', async () => {
      const petData = {
        ...validPetData,
        userId: testUser._id
      };
      
      const pet = new Pet(petData);
      const savedPet = await pet.save();
      
      expect(savedPet._id).toBeDefined();
      expect(savedPet.name).toBe(petData.name);
      expect(savedPet.type).toBe(petData.type);
      expect(savedPet.breed).toBe(petData.breed);
      expect(savedPet.status).toBe(petData.status);
      expect(savedPet.userId.toString()).toBe(testUser._id.toString());
      expect(savedPet.viewCount).toBe(0);
      expect(savedPet.shareCount).toBe(0);
    });

    it('should not save pet without required fields', async () => {
      const pet = new Pet({});
      
      await expect(pet.save()).rejects.toThrow();
    });

    it('should not save pet without userId', async () => {
      const pet = new Pet(validPetData);
      
      await expect(pet.save()).rejects.toThrow();
    });

    it('should validate pet type', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        type: 'invalid-type' as any
      });
      
      await expect(pet.save()).rejects.toThrow();
    });

    it('should validate pet gender', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        gender: 'invalid-gender' as any
      });
      
      await expect(pet.save()).rejects.toThrow();
    });

    it('should validate pet size', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        size: 'invalid-size' as any
      });
      
      await expect(pet.save()).rejects.toThrow();
    });

    it('should validate pet status', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        status: 'invalid-status' as any
      });
      
      await expect(pet.save()).rejects.toThrow();
    });
  });

  describe('Pet Location', () => {
    it('should save location information', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id
      });
      
      const savedPet = await pet.save();
      
      expect(savedPet.lastSeenLocation).toBe(validPetData.lastSeenLocation);
    });

    it('should validate location is required', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        lastSeenLocation: ''
      });
      
      await expect(pet.save()).rejects.toThrow();
    });
  });

  describe('Pet Contact Info', () => {
    it('should save contact information', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id
      });
      
      const savedPet = await pet.save();
      
      expect(savedPet.contactInfo.name).toBe(validPetData.contactInfo.name);
      expect(savedPet.contactInfo.phone).toBe(validPetData.contactInfo.phone);
      expect(savedPet.contactInfo.email).toBe(validPetData.contactInfo.email);
    });

    it('should validate email format in contact info', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        contactInfo: {
          ...validPetData.contactInfo,
          email: 'invalid-email'
        }
      });
      
      await expect(pet.save()).rejects.toThrow();
    });

    it('should validate phone format in contact info', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        contactInfo: {
          ...validPetData.contactInfo,
          phone: 'invalid-phone'
        }
      });
      
      await expect(pet.save()).rejects.toThrow();
    });
  });

  describe('Pet AI Features', () => {
    it('should save AI analysis data', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        aiFeatures: [{
          imageUrl: 'https://example.com/image1.jpg',
          features: [0.1, 0.2, 0.3, 0.4, 0.5],
          analysis: {
            confidence: 0.95,
            labels: ['dog', 'golden retriever'],
            detectedBreed: 'Golden Retriever',
            colors: ['golden', 'white'],
            features: ['long fur', 'friendly face']
          },
          processedAt: new Date()
        }],
        aiBreedPrediction: 'Golden Retriever',
        aiConfidence: 0.95,
        aiTags: ['friendly', 'large', 'golden']
      });
      
      const savedPet = await pet.save();
      
      expect(savedPet.aiFeatures[0].imageUrl).toBe('https://example.com/image1.jpg');
      expect(savedPet.aiFeatures[0].analysis.detectedBreed).toBe('Golden Retriever');
      expect(savedPet.aiFeatures[0].analysis.confidence).toBe(0.95);
      expect(savedPet.aiBreedPrediction).toBe('Golden Retriever');
      expect(savedPet.aiConfidence).toBe(0.95);
      expect(savedPet.aiTags).toEqual(['friendly', 'large', 'golden']);
    });

    it('should validate AI confidence range', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id,
        aiConfidence: 1.5 // Invalid confidence > 1
      });
      
      await expect(pet.save()).rejects.toThrow();
    });
  });

  describe('Pet Statistics', () => {
    it('should initialize view and share counts to 0', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id
      });
      
      const savedPet = await pet.save();
      
      expect(savedPet.viewCount).toBe(0);
      expect(savedPet.shareCount).toBe(0);
    });

    it('should allow updating view and share counts', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id
      });
      
      const savedPet = await pet.save();
      
      savedPet.viewCount = 10;
      savedPet.shareCount = 5;
      
      const updatedPet = await savedPet.save();
      
      expect(updatedPet.viewCount).toBe(10);
      expect(updatedPet.shareCount).toBe(5);
    });
  });

  describe('Pet Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id
      });
      
      const savedPet = await pet.save();
      
      expect(savedPet.createdAt).toBeDefined();
      expect(savedPet.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const pet = new Pet({
        ...validPetData,
        userId: testUser._id
      });
      
      const savedPet = await pet.save();
      const originalUpdatedAt = savedPet.updatedAt;
      
      // 等待一毫秒確保時間戳不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      savedPet.description = 'Updated description';
      const updatedPet = await savedPet.save();
      
      expect(updatedPet.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});