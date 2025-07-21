import request from 'supertest';
import { app } from '../../src/server';
import { User, IUser } from '../../src/models/User';
import { Pet } from '../../src/models/Pet';
import { validUserData, validPetData } from '../utils/testData';
import jwt from 'jsonwebtoken';

describe('User Routes', () => {
  let testUser: IUser;
  let authToken: string;
  let anotherUser: IUser;
  let anotherAuthToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    
    testUser = await new User({
      ...validUserData,
      isEmailVerified: true
    }).save();
    
    anotherUser = await new User({
      ...validUserData,
      email: 'another@example.com',
      isEmailVerified: true
    }).save();
    
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    anotherAuthToken = jwt.sign(
      { userId: anotherUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
  });

  describe('GET /api/users/profile', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile');
      
      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+1987654321',
        bio: 'Updated bio'
      };
      
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    it('should not allow updating email', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'newemail@example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phone: 'invalid-phone' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ name: 'New Name' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };
      
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('密碼更改成功');
    });

    it('should reject incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };
      
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('當前密碼不正確');
    });

    it('should validate new password strength', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: '123' // Too weak
      };
      
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should not allow same password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'password123'
      };
      
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require both passwords', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'password123' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/privacy-settings', () => {
    it('should update privacy settings successfully', async () => {
      const privacyData = {
        showEmail: false,
        showPhone: true,
        allowMessages: false
      };
      
      const response = await request(app)
        .put('/api/users/privacy-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(privacyData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.privacySettings.showEmail).toBe(false);
      expect(response.body.data.privacySettings.showPhone).toBe(true);
      expect(response.body.data.privacySettings.allowMessages).toBe(false);
    });

    it('should validate privacy settings data', async () => {
      const response = await request(app)
        .put('/api/users/privacy-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ showEmail: 'invalid' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/privacy-settings')
        .send({ showEmail: false });
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get public user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${anotherUser._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(anotherUser.name);
      expect(response.body.data.email).toBeUndefined(); // Should not expose email
      expect(response.body.data.password).toBeUndefined();
    });

    it('should respect privacy settings', async () => {
      // Update privacy settings to hide email
      anotherUser.privacySettings.showEmail = false;
      await anotherUser.save();
      
      const response = await request(app)
        .get(`/api/users/${anotherUser._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.email).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/users/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id/pets', () => {
    beforeEach(async () => {
      // Create pets for the user
      await new Pet({
        ...validPetData,
        name: 'User Pet 1',
        owner: anotherUser._id
      }).save();
      
      await new Pet({
        ...validPetData,
        name: 'User Pet 2',
        status: 'found',
        owner: anotherUser._id
      }).save();
    });

    it('should get user pets', async () => {
      const response = await request(app)
        .get(`/api/users/${anotherUser._id}/pets`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pets).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter pets by status', async () => {
      const response = await request(app)
        .get(`/api/users/${anotherUser._id}/pets?status=lost`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.pets).toHaveLength(1);
      expect(response.body.data.pets[0].status).toBe('lost');
    });

    it('should paginate pets', async () => {
      const response = await request(app)
        .get(`/api/users/${anotherUser._id}/pets?page=1&limit=1`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.pets).toHaveLength(1);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should return empty array for user with no pets', async () => {
      const userWithNoPets = await new User({
        ...validUserData,
        email: 'nopets@example.com'
      }).save();
      
      const response = await request(app)
        .get(`/api/users/${userWithNoPets._id}/pets`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.pets).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/users/${nonExistentId}/pets`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should deactivate user account', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('帳戶已停用');
      
      // Verify user is deactivated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.isActive).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/users/account');
      
      expect(response.status).toBe(401);
    });

    it('should handle already deactivated account', async () => {
      // First deactivation
      await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Second deactivation attempt
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/upload-avatar', () => {
    it('should upload avatar successfully', async () => {
      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.avatarUrl).toBeDefined();
    });

    it('should validate file type', async () => {
      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', Buffer.from('fake-file-data'), 'document.txt');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate file size', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      
      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', largeBuffer, 'large-image.jpg');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users/upload-avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg');
      
      expect(response.status).toBe(401);
    });

    it('should require avatar file', async () => {
      const response = await request(app)
        .post('/api/users/upload-avatar')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/statistics', () => {
    beforeEach(async () => {
      // Create pets for statistics
      await new Pet({
        ...validPetData,
        name: 'Lost Pet',
        status: 'lost',
        owner: testUser._id
      }).save();
      
      await new Pet({
        ...validPetData,
        name: 'Found Pet',
        status: 'found',
        owner: testUser._id
      }).save();
    });

    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPets).toBe(2);
      expect(response.body.data.lostPets).toBe(1);
      expect(response.body.data.foundPets).toBe(1);
      expect(response.body.data.reunionRate).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/statistics');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(User, 'findById').mockRejectedValueOnce(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }); // Empty name
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to sensitive endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .put('/api/users/change-password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'password123',
            newPassword: 'newpassword123'
          })
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});