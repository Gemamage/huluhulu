import { MatchingService } from '../../src/services/matchingService';
import { Pet, IPet } from '../../src/models/Pet';
import { User, IUser } from '../../src/models/User';
import { Match, IMatch } from '../../src/models/Match';
import { aiService } from '../../src/services/aiService';
import { EmailService } from '../../src/services/emailService';
import { validUserData, validPetData } from '../utils/testData';
import mongoose from 'mongoose';

// Mock external services
jest.mock('../../src/services/aiService');
jest.mock('../../src/services/emailService');

const mockAiService = aiService as jest.Mocked<typeof aiService>;
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

describe('MatchingService', () => {
  let testUser1: IUser;
  let testUser2: IUser;
  let lostPet: IPet;
  let foundPet: IPet;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
    
    testUser1 = await new User(validUserData).save();
    testUser2 = await new User({
      ...validUserData,
      email: 'user2@example.com'
    }).save();
    
    lostPet = await new Pet({
      ...validPetData,
      name: 'Lost Dog',
      status: 'lost',
      owner: testUser1._id,
      aiData: {
        breed: 'Golden Retriever',
        confidence: 0.9,
        features: [0.1, 0.2, 0.3, 0.4, 0.5]
      }
    }).save();
    
    foundPet = await new Pet({
      ...validPetData,
      name: 'Found Dog',
      status: 'found',
      owner: testUser2._id,
      aiData: {
        breed: 'Golden Retriever',
        confidence: 0.85,
        features: [0.12, 0.18, 0.32, 0.38, 0.52]
      }
    }).save();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
  });

  describe('findPotentialMatches', () => {
    it('should find potential matches for lost pet', async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.85);
      
      const matches = await MatchingService.findPotentialMatches(lostPet._id.toString());
      
      expect(matches).toHaveLength(1);
      expect(matches[0].foundPet._id.toString()).toBe(foundPet._id.toString());
      expect(matches[0].similarity).toBe(0.85);
      expect(matches[0].confidence).toBe('high');
    });

    it('should find potential matches for found pet', async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.85);
      
      const matches = await MatchingService.findPotentialMatches(foundPet._id.toString());
      
      expect(matches).toHaveLength(1);
      expect(matches[0].lostPet._id.toString()).toBe(lostPet._id.toString());
      expect(matches[0].similarity).toBe(0.85);
    });

    it('should filter matches by minimum similarity threshold', async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.5); // Below default threshold
      
      const matches = await MatchingService.findPotentialMatches(lostPet._id.toString());
      
      expect(matches).toHaveLength(0);
    });

    it('should use custom similarity threshold', async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.5);
      
      const matches = await MatchingService.findPotentialMatches(
        lostPet._id.toString(),
        { minSimilarity: 0.4 }
      );
      
      expect(matches).toHaveLength(1);
    });

    it('should filter by location radius', async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.85);
      
      // Set different locations
      lostPet.location.coordinates = [0, 0];
      foundPet.location.coordinates = [1, 1]; // ~157km away
      await lostPet.save();
      await foundPet.save();
      
      const matches = await MatchingService.findPotentialMatches(
        lostPet._id.toString(),
        { maxDistance: 100 } // 100km radius
      );
      
      expect(matches).toHaveLength(0);
    });

    it('should filter by date range', async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.85);
      
      // Set found pet to be reported much later
      foundPet.createdAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days later
      await foundPet.save();
      
      const matches = await MatchingService.findPotentialMatches(
        lostPet._id.toString(),
        { maxDays: 5 }
      );
      
      expect(matches).toHaveLength(0);
    });

    it('should sort matches by similarity score', async () => {
      // Create another found pet with lower similarity
      const foundPet2 = await new Pet({
        ...validPetData,
        name: 'Found Dog 2',
        status: 'found',
        owner: testUser2._id,
        aiData: {
          breed: 'Labrador',
          confidence: 0.8,
          features: [0.5, 0.6, 0.7, 0.8, 0.9]
        }
      }).save();
      
      mockAiService.calculateSimilarity
        .mockReturnValueOnce(0.85) // First pet
        .mockReturnValueOnce(0.75); // Second pet
      
      const matches = await MatchingService.findPotentialMatches(lostPet._id.toString());
      
      expect(matches).toHaveLength(2);
      expect(matches[0].similarity).toBeGreaterThan(matches[1].similarity);
    });

    it('should handle pet without AI data', async () => {
      lostPet.aiData = undefined;
      await lostPet.save();
      
      const matches = await MatchingService.findPotentialMatches(lostPet._id.toString());
      
      expect(matches).toHaveLength(0);
    });

    it('should exclude pets from same owner', async () => {
      foundPet.owner = testUser1._id; // Same owner as lost pet
      await foundPet.save();
      
      mockAiService.calculateSimilarity.mockReturnValue(0.95);
      
      const matches = await MatchingService.findPotentialMatches(lostPet._id.toString());
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('createMatch', () => {
    it('should create match successfully', async () => {
      const matchData = {
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high' as const
      };
      
      const match = await MatchingService.createMatch(matchData);
      
      expect(match).toBeDefined();
      expect(match.lostPet.toString()).toBe(lostPet._id.toString());
      expect(match.foundPet.toString()).toBe(foundPet._id.toString());
      expect(match.similarity).toBe(0.85);
      expect(match.status).toBe('pending');
    });

    it('should prevent duplicate matches', async () => {
      const matchData = {
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high' as const
      };
      
      await MatchingService.createMatch(matchData);
      
      await expect(MatchingService.createMatch(matchData))
        .rejects.toThrow('配對已存在');
    });

    it('should send notification emails', async () => {
      const matchData = {
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high' as const
      };
      
      await MatchingService.createMatch(matchData);
      
      expect(mockEmailService.sendPetMatchNotification).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendPetMatchNotification).toHaveBeenCalledWith(
        testUser1.email,
        expect.objectContaining({
          lostPet: expect.objectContaining({ name: 'Lost Dog' }),
          foundPet: expect.objectContaining({ name: 'Found Dog' })
        })
      );
    });

    it('should handle email notification failures gracefully', async () => {
      mockEmailService.sendPetMatchNotification.mockRejectedValue(
        new Error('Email service unavailable')
      );
      
      const matchData = {
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high' as const
      };
      
      // Should not throw error even if email fails
      const match = await MatchingService.createMatch(matchData);
      expect(match).toBeDefined();
    });

    it('should validate pet existence', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(MatchingService.createMatch({
        lostPetId: nonExistentId,
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high'
      })).rejects.toThrow('寵物不存在');
    });

    it('should validate pet statuses', async () => {
      foundPet.status = 'lost'; // Both pets are lost
      await foundPet.save();
      
      await expect(MatchingService.createMatch({
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high'
      })).rejects.toThrow('無效的寵物狀態');
    });
  });

  describe('getMatchById', () => {
    let testMatch: IMatch;

    beforeEach(async () => {
      testMatch = await new Match({
        lostPet: lostPet._id,
        foundPet: foundPet._id,
        similarity: 0.85,
        confidence: 'high',
        status: 'pending'
      }).save();
    });

    it('should get match by ID with populated data', async () => {
      const match = await MatchingService.getMatchById(testMatch._id.toString());
      
      expect(match).toBeDefined();
      expect(match?.lostPet).toBeDefined();
      expect(match?.foundPet).toBeDefined();
      expect(typeof match?.lostPet).toBe('object');
      expect(typeof match?.foundPet).toBe('object');
    });

    it('should return null for non-existent match', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const match = await MatchingService.getMatchById(nonExistentId);
      
      expect(match).toBeNull();
    });
  });

  describe('updateMatchStatus', () => {
    let testMatch: IMatch;

    beforeEach(async () => {
      testMatch = await new Match({
        lostPet: lostPet._id,
        foundPet: foundPet._id,
        similarity: 0.85,
        confidence: 'high',
        status: 'pending'
      }).save();
    });

    it('should confirm match successfully', async () => {
      const updatedMatch = await MatchingService.updateMatchStatus(
        testMatch._id.toString(),
        testUser1._id.toString(),
        'confirmed'
      );
      
      expect(updatedMatch?.status).toBe('confirmed');
      expect(updatedMatch?.confirmedAt).toBeDefined();
      expect(updatedMatch?.confirmedBy.toString()).toBe(testUser1._id.toString());
    });

    it('should reject match successfully', async () => {
      const updatedMatch = await MatchingService.updateMatchStatus(
        testMatch._id.toString(),
        testUser1._id.toString(),
        'rejected'
      );
      
      expect(updatedMatch?.status).toBe('rejected');
      expect(updatedMatch?.rejectedAt).toBeDefined();
    });

    it('should only allow pet owners to update match', async () => {
      const unauthorizedUser = await new User({
        ...validUserData,
        email: 'unauthorized@example.com'
      }).save();
      
      await expect(MatchingService.updateMatchStatus(
        testMatch._id.toString(),
        unauthorizedUser._id.toString(),
        'confirmed'
      )).rejects.toThrow('無權限');
    });

    it('should not allow updating already confirmed match', async () => {
      testMatch.status = 'confirmed';
      await testMatch.save();
      
      await expect(MatchingService.updateMatchStatus(
        testMatch._id.toString(),
        testUser1._id.toString(),
        'rejected'
      )).rejects.toThrow('配對已經處理過了');
    });

    it('should handle non-existent match', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(MatchingService.updateMatchStatus(
        nonExistentId,
        testUser1._id.toString(),
        'confirmed'
      )).rejects.toThrow('配對不存在');
    });
  });

  describe('getUserMatches', () => {
    beforeEach(async () => {
      // Create multiple matches
      await new Match({
        lostPet: lostPet._id,
        foundPet: foundPet._id,
        similarity: 0.85,
        confidence: 'high',
        status: 'pending'
      }).save();
      
      const anotherFoundPet = await new Pet({
        ...validPetData,
        name: 'Another Found Dog',
        status: 'found',
        owner: testUser2._id
      }).save();
      
      await new Match({
        lostPet: lostPet._id,
        foundPet: anotherFoundPet._id,
        similarity: 0.75,
        confidence: 'medium',
        status: 'confirmed'
      }).save();
    });

    it('should get all matches for user', async () => {
      const result = await MatchingService.getUserMatches(testUser1._id.toString());
      
      expect(result.matches).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter matches by status', async () => {
      const result = await MatchingService.getUserMatches(
        testUser1._id.toString(),
        { status: 'pending' }
      );
      
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].status).toBe('pending');
    });

    it('should paginate matches', async () => {
      const result = await MatchingService.getUserMatches(
        testUser1._id.toString(),
        { page: 1, limit: 1 }
      );
      
      expect(result.matches).toHaveLength(1);
      expect(result.totalPages).toBe(2);
    });

    it('should sort matches by creation date', async () => {
      const result = await MatchingService.getUserMatches(
        testUser1._id.toString(),
        { sortBy: 'createdAt', sortOrder: 'desc' }
      );
      
      expect(result.matches.length).toBeGreaterThan(1);
      for (let i = 1; i < result.matches.length; i++) {
        expect(result.matches[i-1].createdAt.getTime())
          .toBeGreaterThanOrEqual(result.matches[i].createdAt.getTime());
      }
    });

    it('should handle user with no matches', async () => {
      const userWithNoMatches = await new User({
        ...validUserData,
        email: 'nomatch@example.com'
      }).save();
      
      const result = await MatchingService.getUserMatches(userWithNoMatches._id.toString());
      
      expect(result.matches).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('runAutomaticMatching', () => {
    beforeEach(async () => {
      mockAiService.calculateSimilarity.mockReturnValue(0.85);
    });

    it('should create automatic matches for recent pets', async () => {
      const result = await MatchingService.runAutomaticMatching();
      
      expect(result.matchesCreated).toBe(1);
      expect(result.petsProcessed).toBe(2);
      
      const matches = await Match.find({});
      expect(matches).toHaveLength(1);
    });

    it('should not create duplicate matches', async () => {
      // Run matching twice
      await MatchingService.runAutomaticMatching();
      const result = await MatchingService.runAutomaticMatching();
      
      expect(result.matchesCreated).toBe(0); // No new matches created
      
      const matches = await Match.find({});
      expect(matches).toHaveLength(1); // Still only one match
    });

    it('should only process recent pets', async () => {
      // Make pets old
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      lostPet.createdAt = oldDate;
      foundPet.createdAt = oldDate;
      await lostPet.save();
      await foundPet.save();
      
      const result = await MatchingService.runAutomaticMatching({ maxDays: 7 });
      
      expect(result.matchesCreated).toBe(0);
      expect(result.petsProcessed).toBe(0);
    });

    it('should handle AI service errors gracefully', async () => {
      mockAiService.calculateSimilarity.mockImplementation(() => {
        throw new Error('AI service error');
      });
      
      const result = await MatchingService.runAutomaticMatching();
      
      expect(result.matchesCreated).toBe(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getMatchStatistics', () => {
    beforeEach(async () => {
      // Create various matches with different statuses
      await new Match({
        lostPet: lostPet._id,
        foundPet: foundPet._id,
        similarity: 0.85,
        confidence: 'high',
        status: 'pending'
      }).save();
      
      const anotherFoundPet = await new Pet({
        ...validPetData,
        name: 'Another Found Dog',
        status: 'found',
        owner: testUser2._id
      }).save();
      
      await new Match({
        lostPet: lostPet._id,
        foundPet: anotherFoundPet._id,
        similarity: 0.75,
        confidence: 'medium',
        status: 'confirmed'
      }).save();
      
      await new Match({
        lostPet: lostPet._id,
        foundPet: anotherFoundPet._id,
        similarity: 0.65,
        confidence: 'low',
        status: 'rejected'
      }).save();
    });

    it('should return correct match statistics', async () => {
      const stats = await MatchingService.getMatchStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.confirmed).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.averageSimilarity).toBeCloseTo(0.75, 2);
    });

    it('should filter statistics by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const stats = await MatchingService.getMatchStatistics({
        startDate: yesterday,
        endDate: tomorrow
      });
      
      expect(stats.total).toBe(3);
    });

    it('should handle empty results', async () => {
      await Match.deleteMany({});
      
      const stats = await MatchingService.getMatchStatistics();
      
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.confirmed).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.averageSimilarity).toBe(0);
    });
  });

  describe('Confidence Level Calculation', () => {
    it('should calculate high confidence for high similarity', () => {
      const confidence = MatchingService.calculateConfidence(0.9);
      expect(confidence).toBe('high');
    });

    it('should calculate medium confidence for medium similarity', () => {
      const confidence = MatchingService.calculateConfidence(0.75);
      expect(confidence).toBe('medium');
    });

    it('should calculate low confidence for low similarity', () => {
      const confidence = MatchingService.calculateConfidence(0.6);
      expect(confidence).toBe('low');
    });
  });

  describe('Location Distance Calculation', () => {
    it('should calculate distance between coordinates correctly', () => {
      const distance = MatchingService.calculateDistance(
        [0, 0],
        [0, 1]
      );
      
      expect(distance).toBeCloseTo(111.32, 1); // ~111km for 1 degree latitude
    });

    it('should handle same coordinates', () => {
      const distance = MatchingService.calculateDistance(
        [0, 0],
        [0, 0]
      );
      
      expect(distance).toBe(0);
    });
  });
});