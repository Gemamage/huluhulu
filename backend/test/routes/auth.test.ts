import request from 'supertest';
import express from 'express';
import { User } from '../../src/models/User';
import { authRoutes } from '../../src/routes/auth';
import { config } from '../../src/config/environment';
import { errorHandler } from '../../src/middleware/error-handler';

// 創建測試應用
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '+1234567890'
  };

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
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validUserData.email);
      expect(response.body.user.name).toBe(validUserData.name);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined(); // 密碼不應該返回
    });

    it('should not register user with existing email', async () => {
      // 先註冊一個用戶
      await new User(validUserData).save();

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
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
      expect(response.body.error).toContain('validation');
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
      expect(response.body.error).toContain('Password');
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
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validUserData.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
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
      expect(response.body.error).toBe('Invalid credentials');
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
      expect(response.body.error).toBe('Invalid credentials');
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
      expect(response.body.message).toBe('Password reset email sent');
    });

    it('should not send reset email for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
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
          password: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully');
      
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
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired reset token');
    });

    it('should not reset password with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: '123' // 弱密碼
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password');
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
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
      
      // 驗證用戶的郵件已被驗證
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isEmailVerified).toBe(true);
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired verification token');
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
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validUserData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should not get user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
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
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should logout without token (client-side logout)', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});