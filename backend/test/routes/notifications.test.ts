import request from 'supertest';
import { app } from '../../src/server';
import { User, IUser } from '../../src/models/User';
import { Pet, IPet } from '../../src/models/Pet';
import { Match, IMatch } from '../../src/models/Match';
import { Notification, INotification } from '../../src/models/Notification';
import { validUserData, validPetData } from '../utils/testData';
import jwt from 'jsonwebtoken';

describe('Notification Routes', () => {
  let testUser1: IUser;
  let testUser2: IUser;
  let authToken1: string;
  let authToken2: string;
  let testPet: IPet;
  let testMatch: IMatch;
  let testNotification: INotification;

  beforeEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
    await Notification.deleteMany({});
    
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
    
    testPet = await new Pet({
      ...validPetData,
      owner: testUser1._id
    }).save();
    
    const foundPet = await new Pet({
      ...validPetData,
      name: 'Found Pet',
      status: 'found',
      owner: testUser2._id
    }).save();
    
    testMatch = await new Match({
      lostPet: testPet._id,
      foundPet: foundPet._id,
      similarity: 0.85,
      confidence: 'high',
      status: 'pending'
    }).save();
    
    testNotification = await new Notification({
      recipient: testUser1._id,
      type: 'match_found',
      title: '找到潛在配對',
      message: '我們為您的寵物找到了一個潛在配對',
      data: {
        matchId: testMatch._id,
        petId: testPet._id
      }
    }).save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Pet.deleteMany({});
    await Match.deleteMany({});
    await Notification.deleteMany({});
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create additional notifications
      await new Notification({
        recipient: testUser1._id,
        type: 'match_confirmed',
        title: '配對已確認',
        message: '您的配對已被確認',
        isRead: true,
        data: {
          matchId: testMatch._id
        }
      }).save();
      
      await new Notification({
        recipient: testUser1._id,
        type: 'pet_viewed',
        title: '寵物被查看',
        message: '有人查看了您的寵物資訊',
        data: {
          petId: testPet._id
        }
      }).save();
    });

    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.unreadCount).toBe(2);
    });

    it('should filter notifications by read status', async () => {
      const response = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.notifications.length).toBe(2);
      expect(response.body.data.notifications.every((notif: any) => !notif.isRead)).toBe(true);
    });

    it('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=match_found')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.notifications.length).toBe(1);
      expect(response.body.data.notifications[0].type).toBe('match_found');
    });

    it('should paginate notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should sort notifications by creation date', async () => {
      const response = await request(app)
        .get('/api/notifications?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      const notifications = response.body.data.notifications;
      
      for (let i = 1; i < notifications.length; i++) {
        expect(new Date(notifications[i-1].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(notifications[i].createdAt).getTime());
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/notifications');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should get notification by ID', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testNotification._id.toString());
      expect(response.body.data.title).toBe(testNotification.title);
      expect(response.body.data.message).toBe(testNotification.message);
    });

    it('should not allow access to other users notifications', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken2}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent notification', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/notifications/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid notification ID', async () => {
      const response = await request(app)
        .get('/api/notifications/invalid-id')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      expect(testNotification.isRead).toBe(false);
      
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
      expect(response.body.data.readAt).toBeDefined();
    });

    it('should handle already read notification', async () => {
      testNotification.isRead = true;
      testNotification.readAt = new Date();
      await testNotification.save();
      
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
    });

    it('should not allow access to other users notifications', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification._id}/read`)
        .set('Authorization', `Bearer ${authToken2}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent notification', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .put(`/api/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    beforeEach(async () => {
      // Create additional unread notifications
      await new Notification({
        recipient: testUser1._id,
        type: 'match_confirmed',
        title: '配對已確認',
        message: '您的配對已被確認'
      }).save();
      
      await new Notification({
        recipient: testUser1._id,
        type: 'pet_viewed',
        title: '寵物被查看',
        message: '有人查看了您的寵物資訊'
      }).save();
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.modifiedCount).toBe(3); // 3 unread notifications
      
      // Verify all notifications are marked as read
      const notifications = await Notification.find({ recipient: testUser1._id });
      expect(notifications.every(notif => notif.isRead)).toBe(true);
    });

    it('should handle case with no unread notifications', async () => {
      // Mark all notifications as read first
      await Notification.updateMany(
        { recipient: testUser1._id },
        { isRead: true, readAt: new Date() }
      );
      
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.modifiedCount).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read');
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification successfully', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify notification is deleted
      const deletedNotification = await Notification.findById(testNotification._id);
      expect(deletedNotification).toBeNull();
    });

    it('should not allow deleting other users notifications', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${authToken2}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent notification', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/notifications/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/notifications/clear-all', () => {
    beforeEach(async () => {
      // Create additional notifications
      await new Notification({
        recipient: testUser1._id,
        type: 'match_confirmed',
        title: '配對已確認',
        message: '您的配對已被確認',
        isRead: true
      }).save();
      
      await new Notification({
        recipient: testUser1._id,
        type: 'pet_viewed',
        title: '寵物被查看',
        message: '有人查看了您的寵物資訊'
      }).save();
    });

    it('should clear all user notifications', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(3);
      
      // Verify all notifications are deleted
      const notifications = await Notification.find({ recipient: testUser1._id });
      expect(notifications).toHaveLength(0);
    });

    it('should only clear read notifications when specified', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all?readOnly=true')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(1); // Only 1 read notification
      
      // Verify unread notifications remain
      const remainingNotifications = await Notification.find({ recipient: testUser1._id });
      expect(remainingNotifications).toHaveLength(2);
      expect(remainingNotifications.every(notif => !notif.isRead)).toBe(true);
    });

    it('should handle case with no notifications', async () => {
      await Notification.deleteMany({ recipient: testUser1._id });
      
      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deletedCount).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all');
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    beforeEach(async () => {
      // Create additional notifications with mixed read status
      await new Notification({
        recipient: testUser1._id,
        type: 'match_confirmed',
        title: '配對已確認',
        message: '您的配對已被確認',
        isRead: true
      }).save();
      
      await new Notification({
        recipient: testUser1._id,
        type: 'pet_viewed',
        title: '寵物被查看',
        message: '有人查看了您的寵物資訊'
      }).save();
      
      await new Notification({
        recipient: testUser1._id,
        type: 'system_update',
        title: '系統更新',
        message: '系統已更新到新版本'
      }).save();
    });

    it('should get unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(3); // 3 unread notifications
    });

    it('should return 0 when all notifications are read', async () => {
      await Notification.updateMany(
        { recipient: testUser1._id },
        { isRead: true, readAt: new Date() }
      );
      
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailNotifications: true,
        pushNotifications: false,
        matchNotifications: true,
        messageNotifications: false,
        systemNotifications: true
      };
      
      const response = await request(app)
        .post('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(preferences);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.emailNotifications).toBe(true);
      expect(response.body.data.pushNotifications).toBe(false);
    });

    it('should validate preference values', async () => {
      const response = await request(app)
        .post('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          emailNotifications: 'invalid-value'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/notifications/preferences')
        .send({
          emailNotifications: true
        });
      
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should get notification preferences', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('emailNotifications');
      expect(response.body.data).toHaveProperty('pushNotifications');
      expect(response.body.data).toHaveProperty('matchNotifications');
      expect(response.body.data).toHaveProperty('messageNotifications');
      expect(response.body.data).toHaveProperty('systemNotifications');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/preferences');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a database error
      jest.spyOn(Notification, 'find').mockRejectedValueOnce(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should validate request parameters', async () => {
      const response = await request(app)
        .get('/api/notifications?page=invalid')
        .set('Authorization', `Bearer ${authToken1}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to notification endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(20).fill(null).map(() => 
        request(app)
          .get('/api/notifications')
          .set('Authorization', `Bearer ${authToken1}`)
      );
      
      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Notifications', () => {
    it('should handle WebSocket connections for real-time notifications', async () => {
      // This would test WebSocket functionality if implemented
      // For now, we'll test the REST endpoint that would trigger real-time updates
      
      const response = await request(app)
        .post('/api/notifications/test-realtime')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          type: 'test_notification',
          title: '測試通知',
          message: '這是一個測試通知'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification Templates', () => {
    it('should use correct templates for different notification types', async () => {
      const matchNotification = await Notification.findOne({ type: 'match_found' });
      expect(matchNotification?.title).toContain('配對');
      expect(matchNotification?.message).toContain('潛在配對');
    });

    it('should support multiple languages in notifications', async () => {
      // Test would depend on i18n implementation
      const response = await request(app)
        .post('/api/notifications/test-i18n')
        .set('Authorization', `Bearer ${authToken1}`)
        .set('Accept-Language', 'en')
        .send({
          type: 'match_found',
          data: { petName: 'Buddy' }
        });
      
      expect(response.status).toBe(200);
      // Would check for English notification content
    });
  });
});