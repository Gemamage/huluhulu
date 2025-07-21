import request from 'supertest';
import express from 'express';
import { User, IUser } from '../../src/models/User';
import { SearchHistory } from '../../src/models/SearchHistory';
import { searchRoutes } from '../../src/routes/search';
import { auth } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/error-handler';
import { validUserData } from '../utils/testData';

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/search', auth, searchRoutes);
app.use(errorHandler);

describe('Search Routes', () => {
  let testUser: IUser;
  let authToken: string;
  let inactiveUser: IUser;
  let inactiveToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await SearchHistory.deleteMany({});

    testUser = await new User({
      ...validUserData,
      isEmailVerified: true,
      isActive: true
    }).save();
    authToken = testUser.generateAuthToken();

    inactiveUser = await new User({
      ...validUserData,
      email: 'inactive@example.com',
      isEmailVerified: true,
      isActive: false
    }).save();
    inactiveToken = inactiveUser.generateAuthToken();

    // Create some search history
    await SearchHistory.create([
      {
        userId: testUser._id,
        query: '黃金獵犬',
        filters: { type: 'dog', status: 'lost' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        userId: testUser._id,
        query: '波斯貓',
        filters: { type: 'cat' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        userId: testUser._id,
        query: '拉布拉多',
        filters: { type: 'dog', location: '台北' },
        timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
      }
    ]);

    // Create popular search data
    await SearchHistory.create([
      { userId: testUser._id, query: '黃金獵犬', timestamp: new Date() },
      { userId: testUser._id, query: '黃金獵犬', timestamp: new Date() },
      { userId: inactiveUser._id, query: '黃金獵犬', timestamp: new Date() },
      { userId: testUser._id, query: '拉布拉多', timestamp: new Date() },
      { userId: inactiveUser._id, query: '拉布拉多', timestamp: new Date() },
      { userId: testUser._id, query: '波斯貓', timestamp: new Date() }
    ]);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await SearchHistory.deleteMany({});
  });

  describe('GET /api/search/history', () => {
    it('should get user search history successfully', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(6); // 3 initial + 3 popular
      expect(response.body.data[0].query).toBe('黃金獵犬'); // Most recent first
      expect(response.body.data[0]).toHaveProperty('timestamp');
      expect(response.body.data[0]).toHaveProperty('filters');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/search/history?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        currentPage: 1,
        totalPages: expect.any(Number),
        totalItems: expect.any(Number),
        hasNext: true,
        hasPrev: false
      });
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const response = await request(app)
        .get(`/api/search/history?startDate=${oneHourAgo.toISOString()}&endDate=${now.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // All results should be within the date range
      response.body.data.forEach((item: any) => {
        const itemDate = new Date(item.timestamp);
        expect(itemDate.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(itemDate.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should search within history', async () => {
      const response = await request(app)
        .get('/api/search/history?search=黃金')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // All results should contain the search term
      response.body.data.forEach((item: any) => {
        expect(item.query).toContain('黃金');
      });
    });

    it('should return empty array for user with no history', async () => {
      const newUser = await new User({
        ...validUserData,
        email: 'newuser@example.com',
        isEmailVerified: true
      }).save();
      const newToken = newUser.generateAuthToken();

      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return error for inactive user', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('帳戶已被停用');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/search/history?page=0&limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should validate date parameters', async () => {
      const response = await request(app)
        .get('/api/search/history?startDate=invalid-date')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });
  });

  describe('DELETE /api/search/history', () => {
    it('should clear user search history successfully', async () => {
      const response = await request(app)
        .delete('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('搜尋歷史已清除');

      // Verify history is cleared
      const historyCount = await SearchHistory.countDocuments({ userId: testUser._id });
      expect(historyCount).toBe(0);
    });

    it('should only clear current user history', async () => {
      const otherUser = await new User({
        ...validUserData,
        email: 'other@example.com',
        isEmailVerified: true
      }).save();

      await SearchHistory.create({
        userId: otherUser._id,
        query: '其他用戶搜尋',
        timestamp: new Date()
      });

      const response = await request(app)
        .delete('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify other user's history is not affected
      const otherUserHistoryCount = await SearchHistory.countDocuments({ userId: otherUser._id });
      expect(otherUserHistoryCount).toBe(1);

      // Verify current user's history is cleared
      const currentUserHistoryCount = await SearchHistory.countDocuments({ userId: testUser._id });
      expect(currentUserHistoryCount).toBe(0);
    });

    it('should return success even if no history exists', async () => {
      // Clear history first
      await SearchHistory.deleteMany({ userId: testUser._id });

      const response = await request(app)
        .delete('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('搜尋歷史已清除');
    });

    it('should return error for inactive user', async () => {
      const response = await request(app)
        .delete('/api/search/history')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('帳戶已被停用');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .delete('/api/search/history')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未提供認證令牌');
    });
  });

  describe('GET /api/search/popular', () => {
    it('should get popular search terms successfully', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Should be sorted by count (most popular first)
      expect(response.body.data[0]).toMatchObject({
        query: '黃金獵犬',
        count: 3
      });
      expect(response.body.data[1]).toMatchObject({
        query: '拉布拉多',
        count: 2
      });
    });

    it('should limit results by default', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10); // Default limit
    });

    it('should support custom limit', async () => {
      const response = await request(app)
        .get('/api/search/popular?limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by time period', async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const response = await request(app)
        .get(`/api/search/popular?since=${oneDayAgo.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return empty array when no popular searches', async () => {
      await SearchHistory.deleteMany({});

      const response = await request(app)
        .get('/api/search/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/search/popular?limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should validate since parameter', async () => {
      const response = await request(app)
        .get('/api/search/popular?since=invalid-date')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should return error for inactive user', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('帳戶已被停用');
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should get search suggestions successfully', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=黃')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // All suggestions should contain the query
      response.body.data.forEach((suggestion: string) => {
        expect(suggestion).toContain('黃');
      });
    });

    it('should return suggestions based on popular searches', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=拉')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('拉布拉多');
    });

    it('should limit suggestions by default', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=a')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10); // Default limit
    });

    it('should support custom limit', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=黃&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=xyz123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should validate query length', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=test&limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should return error for inactive user', async () => {
      const response = await request(app)
        .get('/api/search/suggestions?q=test')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('帳戶已被停用');
    });

    it('should handle special characters in query', async () => {
      const specialQueries = ['黃金@獵犬', '拉布拉多!', '波斯貓?'];
      
      for (const query of specialQueries) {
        const response = await request(app)
          .get(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in history endpoint', async () => {
      // Mock SearchHistory.find to throw an error
      const originalFind = SearchHistory.find;
      SearchHistory.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');

      // Restore original method
      SearchHistory.find = originalFind;
    });

    it('should handle database errors in popular endpoint', async () => {
      // Mock SearchHistory.aggregate to throw an error
      const originalAggregate = SearchHistory.aggregate;
      SearchHistory.aggregate = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/search/popular')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');

      // Restore original method
      SearchHistory.aggregate = originalAggregate;
    });

    it('should handle database errors in clear history endpoint', async () => {
      // Mock SearchHistory.deleteMany to throw an error
      const originalDeleteMany = SearchHistory.deleteMany;
      SearchHistory.deleteMany = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('伺服器內部錯誤');

      // Restore original method
      SearchHistory.deleteMany = originalDeleteMany;
    });
  });

  describe('Performance', () => {
    it('should handle large search history efficiently', async () => {
      // Create many search history entries
      const manyEntries = Array.from({ length: 1000 }, (_, i) => ({
        userId: testUser._id,
        query: `搜尋 ${i}`,
        timestamp: new Date(Date.now() - i * 1000)
      }));
      
      await SearchHistory.insertMany(manyEntries);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/search/history?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/search/popular')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});