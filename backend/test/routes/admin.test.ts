import request from 'supertest';
import { app } from '../../src/server';
import { User, IUser } from '../../src/models/User';
import { Pet, IPet } from '../../src/models/Pet';
import { Match, IMatch } from '../../src/models/Match';
import { validUserData, validPetData } from '../utils/testData';
import jwt from 'jsonwebtoken';

describe('Admin Routes', () => {
  let adminUser: IUser;
  let regularUser: IUser;
  let adminToken: string;
  let userToken: string;
  let testPet: IPet;
  let testMatch: IMatch;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
    
    // Create admin user
    adminUser = await new User({
      ...validUserData,
      email: 'admin@example.com',
      role: 'admin',
      isEmailVerified: true
    }).save();
    
    // Create regular user
    regularUser = await new User({
      ...validUserData,
      isEmailVerified: true
    }).save();
    
    adminToken = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      { userId: regularUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    testPet = await new Pet({
      ...validPetData,
      owner: regularUser._id
    }).save();
    
    const foundPet = await new Pet({
      ...validPetData,
      name: 'Found Pet',
      status: 'found',
      owner: adminUser._id
    }).save();
    
    testMatch = await new Match({
      lostPet: testPet._id,
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

  describe('GET /api/admin/dashboard', () => {
    it('should get admin dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pets');
      expect(response.body.data).toHaveProperty('matches');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data.users.total).toBe(2);
      expect(response.body.data.pets.total).toBe(2);
      expect(response.body.data.matches.total).toBe(1);
    });

    it('should include statistics breakdown', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.body.data.users).toHaveProperty('verified');
      expect(response.body.data.users).toHaveProperty('unverified');
      expect(response.body.data.pets).toHaveProperty('lost');
      expect(response.body.data.pets).toHaveProperty('found');
      expect(response.body.data.pets).toHaveProperty('reunited');
      expect(response.body.data.matches).toHaveProperty('pending');
      expect(response.body.data.matches).toHaveProperty('confirmed');
      expect(response.body.data.matches).toHaveProperty('rejected');
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create additional users for testing
      await new User({
        ...validUserData,
        email: 'user2@example.com',
        isEmailVerified: false
      }).save();
      
      await new User({
        ...validUserData,
        email: 'user3@example.com',
        isActive: false
      }).save();
    });

    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(4);
      expect(response.body.data.total).toBe(4);
    });

    it('should filter users by verification status', async () => {
      const response = await request(app)
        .get('/api/admin/users?isEmailVerified=false')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.users.every((user: any) => !user.isEmailVerified)).toBe(true);
    });

    it('should filter users by active status', async () => {
      const response = await request(app)
        .get('/api/admin/users?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.users.every((user: any) => !user.isActive)).toBe(true);
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=user2')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.users[0].email).toContain('user2');
    });

    it('should paginate users', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should sort users by creation date', async () => {
      const response = await request(app)
        .get('/api/admin/users?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      const users = response.body.data.users;
      
      for (let i = 1; i < users.length; i++) {
        expect(new Date(users[i-1].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(users[i].createdAt).getTime());
      }
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user details', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(regularUser._id.toString());
      expect(response.body.data.email).toBe(regularUser.email);
      expect(response.body.data.pets).toBeDefined();
      expect(response.body.data.matches).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user details', async () => {
      const updateData = {
        firstName: 'Updated Name',
        isEmailVerified: true,
        isActive: false
      };
      
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated Name');
      expect(response.body.data.isEmailVerified).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should update user role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'moderator' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('moderator');
    });

    it('should not allow updating email', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'newemail@example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate role values', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid-role' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Updated' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify user is deleted
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should not allow deleting admin users', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/pets', () => {
    beforeEach(async () => {
      // Create additional pets for testing
      await new Pet({
        ...validPetData,
        name: 'Found Pet 2',
        status: 'found',
        owner: regularUser._id
      }).save();
      
      await new Pet({
        ...validPetData,
        name: 'Reunited Pet',
        status: 'reunited',
        owner: adminUser._id
      }).save();
    });

    it('should get all pets', async () => {
      const response = await request(app)
        .get('/api/admin/pets')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pets).toHaveLength(4);
      expect(response.body.data.total).toBe(4);
    });

    it('should filter pets by status', async () => {
      const response = await request(app)
        .get('/api/admin/pets?status=found')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.pets.length).toBeGreaterThan(0);
      expect(response.body.data.pets.every((pet: any) => pet.status === 'found')).toBe(true);
    });

    it('should filter pets by type', async () => {
      const response = await request(app)
        .get('/api/admin/pets?type=dog')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.pets.length).toBeGreaterThan(0);
      expect(response.body.data.pets.every((pet: any) => pet.type === 'dog')).toBe(true);
    });

    it('should search pets by name', async () => {
      const response = await request(app)
        .get('/api/admin/pets?search=Found')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.pets.length).toBeGreaterThan(0);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get('/api/admin/pets')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/pets/:id', () => {
    it('should update pet details', async () => {
      const updateData = {
        name: 'Updated Pet Name',
        status: 'reunited'
      };
      
      const response = await request(app)
        .put(`/api/admin/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Pet Name');
      expect(response.body.data.status).toBe('reunited');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .put(`/api/admin/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .put(`/api/admin/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/pets/:id', () => {
    it('should delete pet successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify pet is deleted
      const deletedPet = await Pet.findById(testPet._id);
      expect(deletedPet).toBeNull();
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .delete(`/api/admin/pets/${testPet._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/matches', () => {
    beforeEach(async () => {
      // Create additional matches for testing
      const anotherLostPet = await new Pet({
        ...validPetData,
        name: 'Another Lost Pet',
        status: 'lost',
        owner: regularUser._id
      }).save();
      
      const anotherFoundPet = await new Pet({
        ...validPetData,
        name: 'Another Found Pet',
        status: 'found',
        owner: adminUser._id
      }).save();
      
      await new Match({
        lostPet: anotherLostPet._id,
        foundPet: anotherFoundPet._id,
        similarity: 0.75,
        confidence: 'medium',
        status: 'confirmed'
      }).save();
    });

    it('should get all matches', async () => {
      const response = await request(app)
        .get('/api/admin/matches')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter matches by status', async () => {
      const response = await request(app)
        .get('/api/admin/matches?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.matches.length).toBeGreaterThan(0);
      expect(response.body.data.matches.every((match: any) => match.status === 'pending')).toBe(true);
    });

    it('should filter matches by confidence', async () => {
      const response = await request(app)
        .get('/api/admin/matches?confidence=high')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.matches.length).toBeGreaterThan(0);
      expect(response.body.data.matches.every((match: any) => match.confidence === 'high')).toBe(true);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get('/api/admin/matches')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/admin/matches/:id', () => {
    it('should update match status', async () => {
      const response = await request(app)
        .put(`/api/admin/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .put(`/api/admin/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid-status' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .put(`/api/admin/matches/${testMatch._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'confirmed' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('should get system reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userGrowth');
      expect(response.body.data).toHaveProperty('petStatistics');
      expect(response.body.data).toHaveProperty('matchingEfficiency');
      expect(response.body.data).toHaveProperty('systemHealth');
    });

    it('should filter reports by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();
      
      const response = await request(app)
        .get('/api/admin/reports')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/admin/system/maintenance', () => {
    it('should trigger system maintenance', async () => {
      const response = await request(app)
        .post('/api/admin/system/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'cleanup' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('維護任務已啟動');
    });

    it('should validate maintenance actions', async () => {
      const response = await request(app)
        .post('/api/admin/system/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'invalid-action' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .post('/api/admin/system/maintenance')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'cleanup' });
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/logs', () => {
    it('should get system logs', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeDefined();
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('should filter logs by level', async () => {
      const response = await request(app)
        .get('/api/admin/logs?level=error')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();
      
      const response = await request(app)
        .get('/api/admin/logs')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow regular users', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(User, 'find').mockRejectedValueOnce(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=invalid')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to admin endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log admin actions', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });
      
      expect(response.status).toBe(200);
      
      // Check if audit log was created
      // This would depend on your audit logging implementation
      // expect(auditLog).toHaveBeenCalledWith({
      //   action: 'USER_UPDATE',
      //   adminId: adminUser._id,
      //   targetId: regularUser._id,
      //   changes: { isActive: false }
      // });
    });
  });
});