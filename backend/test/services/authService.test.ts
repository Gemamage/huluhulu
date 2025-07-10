import { UserService } from '../../src/services/userService';
import { User, IUser } from '../../src/models/User';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/environment';
import { validUserData } from '../utils/testData';

describe('UserService - Authentication', () => {
  let testUser: IUser;

  beforeEach(async () => {
    testUser = await new User(validUserData).save();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        phone: '+1987654321'
      };

      const result = await UserService.registerUser(newUserData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(newUserData.email);
      expect(result.user.name).toBe(newUserData.name);
      expect(result.token).toBeDefined();
      
      // 驗證密碼已被加密
      const savedUser = await User.findOne({ email: newUserData.email });
      expect(savedUser?.password).not.toBe(newUserData.password);
    });

    it('should not register user with existing email', async () => {
      await expect(UserService.registerUser(validUserData))
        .rejects
        .toThrow('此電子郵件已被註冊');
    });

    it('should not register user with invalid email', async () => {
      const invalidUserData = {
        ...validUserData,
        email: 'invalid-email'
      };

      await expect(UserService.registerUser(invalidUserData))
        .rejects
        .toThrow();
    });

    it('should not register user with weak password', async () => {
      const weakPasswordData = {
        ...validUserData,
        email: 'weak@example.com',
        password: '123'
      };

      await expect(UserService.registerUser(weakPasswordData))
        .rejects
        .toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const result = await UserService.loginUser({
        email: validUserData.email,
        password: validUserData.password
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validUserData.email);
      expect(result.token).toBeDefined();
      
      // 驗證 JWT token
      const decoded = jwt.verify(result.token, config.jwt.secret) as any;
      expect(decoded.id).toBe(testUser._id.toString());
    });

    it('should not login with invalid email', async () => {
      await expect(UserService.loginUser({
        email: 'nonexistent@example.com',
        password: validUserData.password
      })).rejects.toThrow('電子郵件或密碼錯誤');
    });

    it('should not login with invalid password', async () => {
      await expect(UserService.loginUser({
        email: validUserData.email,
        password: 'wrongpassword'
      })).rejects.toThrow('電子郵件或密碼錯誤');
    });

    it('should not login inactive user', async () => {
      testUser.isActive = false;
      await testUser.save();

      await expect(UserService.loginUser({
        email: validUserData.email,
        password: validUserData.password
      })).rejects.toThrow('用戶帳號已被停用');
    });

    it('should update lastLoginAt on successful login', async () => {
      const originalLastLogin = testUser.lastLoginAt;
      
      await UserService.loginUser({
        email: validUserData.email,
        password: validUserData.password
      });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt?.getTime()).toBeGreaterThan(
        originalLastLogin?.getTime() || 0
      );
    });
  });

  // Token 驗證功能通常在中間件中實現，不屬於 UserService 的職責範圍
});