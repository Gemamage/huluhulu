import request from 'supertest';
import express from 'express';
import { User, IUser } from '../../src/models/User';
import { privacyRoutes } from '../../src/routes/privacy';
import { auth } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/error-handler';
import { validUserData } from '../utils/testData';

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/privacy', auth, privacyRoutes);
app.use(errorHandler);

describe('Privacy Routes', () => {
  let testUser: IUser;
  let authToken: string;

  beforeEach(async () => {
    await User.deleteMany({});

    testUser = await new User({
      ...validUserData,
      isEmailVerified: true,
      privacySettings: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowMessages: true,
        showOnlineStatus: true,
        dataProcessing: true,
        marketingEmails: false,
        pushNotifications: true
      }
    }).save();
    authToken = testUser.generateAuthToken();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/privacy/settings', () => {
    it('should get user privacy settings successfully', async () => {
      const response = await request(app)
        .get('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowMessages: true,
        showOnlineStatus: true,
        dataProcessing: true,
        marketingEmails: false,
        pushNotifications: true
      });
    });

    it('should return default settings for user without privacy settings', async () => {
      // Create user without privacy settings
      const userWithoutSettings = await new User({
        ...validUserData,
        email: 'nosettings@example.com',
        isEmailVerified: true
      }).save();
      const token = userWithoutSettings.generateAuthToken();

      const response = await request(app)
        .get('/api/privacy/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowMessages: true,
        showOnlineStatus: true,
        dataProcessing: true,
        marketingEmails: false,
        pushNotifications: true
      });
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/privacy/settings')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/privacy/settings')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/privacy/settings', () => {
    it('should update privacy settings successfully', async () => {
      const updateData = {
        profileVisibility: 'private',
        showEmail: true,
        showPhone: true,
        showLocation: false,
        allowMessages: false,
        showOnlineStatus: false,
        dataProcessing: true,
        marketingEmails: true,
        pushNotifications: false
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
      expect(response.body.message).toBe('隱私設定已更新');

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.privacySettings).toMatchObject(updateData);
    });

    it('should update partial privacy settings', async () => {
      const partialUpdate = {
        profileVisibility: 'friends',
        showEmail: true
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profileVisibility).toBe('friends');
      expect(response.body.data.showEmail).toBe(true);
      // Other settings should remain unchanged
      expect(response.body.data.showPhone).toBe(false);
      expect(response.body.data.allowMessages).toBe(true);
    });

    it('should validate profileVisibility values', async () => {
      const invalidData = {
        profileVisibility: 'invalid_value'
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should validate boolean fields', async () => {
      const invalidData = {
        showEmail: 'not_a_boolean',
        allowMessages: 'yes'
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should ignore unknown fields', async () => {
      const dataWithUnknownFields = {
        profileVisibility: 'private',
        unknownField: 'should_be_ignored',
        anotherUnknown: true
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dataWithUnknownFields)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profileVisibility).toBe('private');
      expect(response.body.data).not.toHaveProperty('unknownField');
      expect(response.body.data).not.toHaveProperty('anotherUnknown');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .put('/api/privacy/settings')
        .send({ profileVisibility: 'private' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });

    it('should handle database errors gracefully', async () => {
      // Mock User.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ profileVisibility: 'private' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');

      // Restore original method
      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  describe('POST /api/privacy/settings/reset', () => {
    it('should reset privacy settings to default values', async () => {
      // First update settings to non-default values
      await User.findByIdAndUpdate(testUser._id, {
        privacySettings: {
          profileVisibility: 'private',
          showEmail: true,
          showPhone: true,
          showLocation: false,
          allowMessages: false,
          showOnlineStatus: false,
          dataProcessing: true,
          marketingEmails: true,
          pushNotifications: false
        }
      });

      const response = await request(app)
        .post('/api/privacy/settings/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('隱私設定已重置為預設值');
      expect(response.body.data).toMatchObject({
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowMessages: true,
        showOnlineStatus: true,
        dataProcessing: true,
        marketingEmails: false,
        pushNotifications: true
      });

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.privacySettings?.profileVisibility).toBe('public');
      expect(updatedUser?.privacySettings?.showEmail).toBe(false);
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .post('/api/privacy/settings/reset')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });

    it('should handle database errors during reset', async () => {
      // Mock User.findByIdAndUpdate to throw an error
      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/privacy/settings/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');

      // Restore original method
      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  describe('GET /api/privacy/settings/options', () => {
    it('should return privacy settings options and descriptions', async () => {
      const response = await request(app)
        .get('/api/privacy/settings/options')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('profileVisibility');
      expect(response.body.data).toHaveProperty('showEmail');
      expect(response.body.data).toHaveProperty('showPhone');
      expect(response.body.data).toHaveProperty('showLocation');
      expect(response.body.data).toHaveProperty('allowMessages');
      expect(response.body.data).toHaveProperty('showOnlineStatus');
      expect(response.body.data).toHaveProperty('dataProcessing');
      expect(response.body.data).toHaveProperty('marketingEmails');
      expect(response.body.data).toHaveProperty('pushNotifications');

      // Check structure of profileVisibility options
      expect(response.body.data.profileVisibility).toMatchObject({
        type: 'select',
        options: expect.arrayContaining([
          expect.objectContaining({ value: 'public', label: expect.any(String) }),
          expect.objectContaining({ value: 'friends', label: expect.any(String) }),
          expect.objectContaining({ value: 'private', label: expect.any(String) })
        ]),
        description: expect.any(String)
      });

      // Check structure of boolean options
      expect(response.body.data.showEmail).toMatchObject({
        type: 'boolean',
        description: expect.any(String)
      });
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/privacy/settings/options')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include all required option fields', async () => {
      const response = await request(app)
        .get('/api/privacy/settings/options')
        .expect(200);

      const options = response.body.data;
      const requiredFields = [
        'profileVisibility',
        'showEmail',
        'showPhone',
        'showLocation',
        'allowMessages',
        'showOnlineStatus',
        'dataProcessing',
        'marketingEmails',
        'pushNotifications'
      ];

      requiredFields.forEach(field => {
        expect(options).toHaveProperty(field);
        expect(options[field]).toHaveProperty('type');
        expect(options[field]).toHaveProperty('description');
      });
    });
  });

  describe('Privacy Settings Validation', () => {
    it('should accept all valid profileVisibility values', async () => {
      const validValues = ['public', 'friends', 'private'];

      for (const value of validValues) {
        const response = await request(app)
          .put('/api/privacy/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ profileVisibility: value })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.profileVisibility).toBe(value);
      }
    });

    it('should reject invalid profileVisibility values', async () => {
      const invalidValues = ['invalid', 'PUBLIC', 'Friends', 123, null];

      for (const value of invalidValues) {
        const response = await request(app)
          .put('/api/privacy/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ profileVisibility: value })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid boolean values', async () => {
      const booleanFields = [
        'showEmail',
        'showPhone',
        'showLocation',
        'allowMessages',
        'showOnlineStatus',
        'dataProcessing',
        'marketingEmails',
        'pushNotifications'
      ];

      for (const field of booleanFields) {
        for (const value of [true, false]) {
          const response = await request(app)
            .put('/api/privacy/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ [field]: value })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data[field]).toBe(value);
        }
      }
    });

    it('should reject invalid boolean values', async () => {
      const booleanFields = ['showEmail', 'allowMessages'];
      const invalidValues = ['true', 'false', 1, 0, 'yes', 'no', null];

      for (const field of booleanFields) {
        for (const value of invalidValues) {
          const response = await request(app)
            .put('/api/privacy/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ [field]: value })
            .expect(400);

          expect(response.body.success).toBe(false);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      // Settings should remain unchanged
      expect(response.body.data).toMatchObject(testUser.privacySettings);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large request body', async () => {
      const largeData = {
        profileVisibility: 'private',
        extraData: 'x'.repeat(10000) // Large string
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profileVisibility).toBe('private');
      expect(response.body.data).not.toHaveProperty('extraData');
    });

    it('should handle concurrent updates', async () => {
      const updates = [
        { profileVisibility: 'private' },
        { showEmail: true },
        { allowMessages: false }
      ];

      const promises = updates.map(update =>
        request(app)
          .put('/api/privacy/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send(update)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify final state
      const finalUser = await User.findById(testUser._id);
      expect(finalUser?.privacySettings?.profileVisibility).toBe('private');
      expect(finalUser?.privacySettings?.showEmail).toBe(true);
      expect(finalUser?.privacySettings?.allowMessages).toBe(false);
    });
  });

  describe('Security', () => {
    it('should not allow updating other users settings', async () => {
      const otherUser = await new User({
        ...validUserData,
        email: 'other@example.com',
        isEmailVerified: true
      }).save();

      // Try to update with valid token but different user data
      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ profileVisibility: 'private' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify other user's settings weren't affected
      const unchangedUser = await User.findById(otherUser._id);
      expect(unchangedUser?.privacySettings?.profileVisibility).not.toBe('private');
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        profileVisibility: 'public',
        showEmail: true,
        '$where': 'malicious code',
        '__proto__': { polluted: true }
      };

      const response = await request(app)
        .put('/api/privacy/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('$where');
      expect(response.body.data).not.toHaveProperty('__proto__');
    });
  });
});