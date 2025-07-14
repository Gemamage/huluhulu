import request from 'supertest';
import { app } from '../../src/server';
import { User, IUser } from '../../src/models/User';
import { Pet, IPet } from '../../src/models/Pet';
import { Match, IMatch } from '../../src/models/Match';
import { validUserData, validPetData } from '../utils/testData';
import jwt from 'jsonwebtoken';

describe('Match Routes', () => {
  let testUser1: IUser;
  let testUser2: IUser;
  let authToken1: string;
  let authToken2: string;
  let lostPet: IPet;
  let foundPet: IPet;
  let testMatch: IMatch;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
    
    testUser1 = await new User({
      ...validUserData,
      isEmailVerified: true
    }).save();
    
    testUser2 = await new User({
      ...validUserData,
      email: 'user2@example.com',
      isEmailVerified: true
    }).save();
    
    authToken1 = jwt.sign(
      { userId: testUser1._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    authToken2 = jwt.sign(
      { userId: testUser2._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
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
    
    testMatch = await new Match({
      lostPet: lostPet._id,
      foundPet: foundPet._id,
      similarity: 0.85,
      confidence: 'high',
      status: 'pending'
    }).save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
  });

  describe('POST /api/matches', () => {
    it('should create match successfully', async () => {
      await Match.deleteMany({}); // Clear existing match
      
      const matchData = {
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high'
      };
      
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(matchData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lostPet).toBe(lostPet._id.toString());
      expect(response.body.data.foundPet).toBe(foundPet._id.toString());
      expect(response.body.data.similarity).toBe(0.85);
      expect(response.body.data.status).toBe('pending');
    });

    it('should prevent duplicate matches', async () => {
      const matchData = {
        lostPetId: lostPet._id.toString(),
        foundPetId: foundPet._id.toString(),
        similarity: 0.85,
        confidence: 'high'
      };
      
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(matchData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('配對已存在');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          lostPetId: lostPet._id.toString()
          // Missing foundPetId
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate pet existence', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          lostPetId: nonExistentId,
          foundPetId: foundPet._id.toString(),
          similarity: 0.85,
          confidence: 'high'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate pet statuses', async () => {
      foundPet.status = 'lost'; // Both pets are lost
      await foundPet.save();
      
      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          lostPetId: lostPet._id.toString(),
          foundPetId: foundPet._id.toString(),
          similarity: 0.85,
          confidence: 'high'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/matches')
        .send({
          lostPetId: lostPet._id.toString(),
          foundPetId: foundPet._id.toString(),
          similarity: 0.85,
          confidence: 'high'
        });
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches', () => {
    beforeEach(async () => {
      // Create additional matches
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

    it('should get user matches', async () => {
      const response = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter matches by status', async () => {
      const response = await request(app)
        .get('/api/matches?status=pending')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.matches).toHaveLength(1);
      expect(response.body.data.matches[0].status).toBe('pending');
    });

    it('should paginate matches', async () => {
      const response = await request(app)
        .get('/api/matches?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.matches).toHaveLength(1);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should sort matches by creation date', async () => {
      const response = await request(app)
        .get('/api/matches?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      const matches = response.body.data.matches;
      
      for (let i = 1; i < matches.length; i++) {
        expect(new Date(matches[i-1].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(matches[i].createdAt).getTime());
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/matches');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/:id', () => {
    it('should get match by ID', async () => {
      const response = await request(app)
        .get(`/api/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testMatch._id.toString());
      expect(response.body.data.lostPet).toBeDefined();
      expect(response.body.data.foundPet).toBeDefined();
    });

    it('should not allow unauthorized access', async () => {
      const unauthorizedUser = await new User({
        ...validUserData,
        email: 'unauthorized@example.com'
      }).save();
      
      const unauthorizedToken = jwt.sign(
        { userId: unauthorizedUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .get(`/api/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent match', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/matches/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid match ID', async () => {
      const response = await request(app)
        .get('/api/matches/invalid-id')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/matches/:id/status', () => {
    it('should confirm match successfully', async () => {
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ status: 'confirmed' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.data.confirmedAt).toBeDefined();
      expect(response.body.data.confirmedBy).toBe(testUser1._id.toString());
    });

    it('should reject match successfully', async () => {
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ status: 'rejected' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.rejectedAt).toBeDefined();
    });

    it('should allow both pet owners to update status', async () => {
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ status: 'confirmed' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow unauthorized users to update status', async () => {
      const unauthorizedUser = await new User({
        ...validUserData,
        email: 'unauthorized@example.com'
      }).save();
      
      const unauthorizedToken = jwt.sign(
        { userId: unauthorizedUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ status: 'confirmed' });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should not allow updating already processed match', async () => {
      testMatch.status = 'confirmed';
      await testMatch.save();
      
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ status: 'rejected' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate status value', async () => {
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ status: 'invalid-status' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require status field', async () => {
      const response = await request(app)
        .put(`/api/matches/${testMatch._id}/status`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/matches/find-similar', () => {
    it('should find similar pets using image', async () => {
      const response = await request(app)
        .post('/api/matches/find-similar')
        .set('Authorization', `Bearer ${authToken1}`)
        .attach('image', Buffer.from('fake-image-data'), 'pet-image.jpg');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBeDefined();
      expect(Array.isArray(response.body.data.matches)).toBe(true);
    });

    it('should accept similarity threshold parameter', async () => {
      const response = await request(app)
        .post('/api/matches/find-similar')
        .set('Authorization', `Bearer ${authToken1}`)
        .field('threshold', '0.8')
        .attach('image', Buffer.from('fake-image-data'), 'pet-image.jpg');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate image file', async () => {
      const response = await request(app)
        .post('/api/matches/find-similar')
        .set('Authorization', `Bearer ${authToken1}`)
        .attach('image', Buffer.from('fake-file-data'), 'document.txt');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require image file', async () => {
      const response = await request(app)
        .post('/api/matches/find-similar')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/matches/find-similar')
        .attach('image', Buffer.from('fake-image-data'), 'pet-image.jpg');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/potential/:petId', () => {
    it('should find potential matches for pet', async () => {
      const response = await request(app)
        .get(`/api/matches/potential/${lostPet._id}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBeDefined();
      expect(Array.isArray(response.body.data.matches)).toBe(true);
    });

    it('should accept filtering parameters', async () => {
      const response = await request(app)
        .get(`/api/matches/potential/${lostPet._id}?minSimilarity=0.8&maxDistance=50`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should only allow pet owner to find matches', async () => {
      const response = await request(app)
        .get(`/api/matches/potential/${lostPet._id}`)
        .set('Authorization', `Bearer ${authToken2}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent pet', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/matches/potential/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/matches/potential/${lostPet._id}`);
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/matches/statistics', () => {
    beforeEach(async () => {
      // Create additional matches for statistics
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

    it('should get match statistics', async () => {
      const response = await request(app)
        .get('/api/matches/statistics')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.pending).toBeDefined();
      expect(response.body.data.confirmed).toBeDefined();
      expect(response.body.data.rejected).toBeDefined();
      expect(response.body.data.averageSimilarity).toBeDefined();
    });

    it('should filter statistics by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const response = await request(app)
        .get('/api/matches/statistics')
        .query({
          startDate: yesterday.toISOString(),
          endDate: tomorrow.toISOString()
        })
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/matches/statistics');
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/matches/:id', () => {
    it('should delete match successfully', async () => {
      const response = await request(app)
        .delete(`/api/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify match is deleted
      const deletedMatch = await Match.findById(testMatch._id);
      expect(deletedMatch).toBeNull();
    });

    it('should only allow pet owners to delete match', async () => {
      const unauthorizedUser = await new User({
        ...validUserData,
        email: 'unauthorized@example.com'
      }).save();
      
      const unauthorizedToken = jwt.sign(
        { userId: unauthorizedUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      const response = await request(app)
        .delete(`/api/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent match', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/matches/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/matches/${testMatch._id}`);
      
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(Match, 'findById').mockRejectedValueOnce(new Error('Database error'));
      
      const response = await request(app)
        .get(`/api/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .get('/api/matches?page=invalid')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to match creation', async () => {
      await Match.deleteMany({}); // Clear existing matches
      
      // Create multiple pets for testing
      const pets = [];
      for (let i = 0; i < 5; i++) {
        const pet = await new Pet({
          ...validPetData,
          name: `Found Pet ${i}`,
          status: 'found',
          owner: testUser2._id
        }).save();
        pets.push(pet);
      }
      
      // Make multiple rapid requests
      const requests = pets.map(pet => 
        request(app)
          .post('/api/matches')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            lostPetId: lostPet._id.toString(),
            foundPetId: pet._id.toString(),
            similarity: 0.85,
            confidence: 'high'
          })
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});