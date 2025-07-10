import request from 'supertest';
import express from 'express';
import { User } from '../../src/models/User';
import { authRoutes } from '../../src/routes/auth';
import { config } from '../../src/config/environment';
import { errorHandler } from '../../src/middleware/error-handler';
import { validUserData, ERROR_MESSAGES } from '../utils/testData';

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.name).toBe(validUserData.name);
      expect(response.body.data.user.password).toBeUndefined(); // 密碼不應該返回
    });

    it('should not register user with existing email', async () => {
      // 先註冊一個用戶
      await new User(validUserData).save();

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    });

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('驗證失敗');
    });

    it('should not register user with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: validUserData.email
          // 缺少其他必需字段
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not register user with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '123' // 弱密碼
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('輸入資料驗證失敗');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await new User(validUserData).save();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUserData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(ERROR_MESSAGES.INVALID_CREDENTIALS);
    });

    it('should not login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await new User(validUserData).save();
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUserData.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(ERROR_MESSAGES.PASSWORD_RESET_SUCCESS);
    });

    it('should return success message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('電子郵件地址');
    });

    it('should not send reset email with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let user: any;
    let resetToken: string;

    beforeEach(async () => {
      user = await new User(validUserData).save();
      user.generatePasswordResetToken();
      resetToken = user.passwordResetToken;
      await user.save();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('重設成功');
      
      // 驗證可以用新密碼登入
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should not reset password with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密碼重設令牌無效或已過期');
    });

    it('should not reset password with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123' // 弱密碼
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('輸入資料驗證失敗');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let user: any;
    let verificationToken: string;

    beforeEach(async () => {
      user = await new User(validUserData).save();
      user.generateEmailVerificationToken();
      verificationToken = user.emailVerificationToken;
      await user.save();
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('驗證成功');
      
      // 驗證用戶的郵件已被驗證
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isEmailVerified).toBe(true);
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('無效');
    });
  });

  describe('GET /api/auth/me', () => {
    let user: any;
    let authToken: string;

    beforeEach(async () => {
      user = await new User(validUserData).save();
      authToken = user.generateAuthToken();
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('認證令牌');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('無效');
    });
  });

  describe('POST /api/auth/logout', () => {
    let user: any;
    let authToken: string;

    beforeEach(async () => {
      user = await new User(validUserData).save();
      authToken = user.generateAuthToken();
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('登出成功');
    });

    it('should not logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('認證令牌');
    });
  });
});