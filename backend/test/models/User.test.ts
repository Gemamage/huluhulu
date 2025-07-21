import { User, IUser } from '../../src/models/User';
import mongoose from 'mongoose';
import { validUserData } from '../utils/testData';

describe('User Model', () => {

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(validUserData.email);
      expect(savedUser.name).toBe(validUserData.name);
      expect(savedUser.phone).toBe(validUserData.phone);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.role).toBe('user');
      expect(savedUser.isEmailVerified).toBe(false);
    });

    it('should hash password before saving', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();
      
      expect(savedUser.password).not.toBe(validUserData.password);
      expect(savedUser.password.length).toBeGreaterThan(50);
    });

    it('should not save user without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should not save user with invalid email', async () => {
      const user = new User({
        ...validUserData,
        email: 'invalid-email'
      });
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should not save user with duplicate email', async () => {
      await new User(validUserData).save();
      const duplicateUser = new User(validUserData);
      
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should validate phone number format', async () => {
      const user = new User({
        ...validUserData,
        phone: 'invalid-phone'
      });
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user: IUser;

    beforeEach(async () => {
      user = await new User(validUserData).save();
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await user.comparePassword('wrongpassword');
        expect(isMatch).toBe(false);
      });
    });

    describe('generateAuthToken', () => {
      it('should generate a valid JWT token', () => {
        const token = user.generateAuthToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });
    });

    describe('generatePasswordResetToken', () => {
      it('should generate password reset token and expiry', () => {
        user.generatePasswordResetToken();
        
        expect(user.passwordResetToken).toBeDefined();
        expect(user.passwordResetExpires).toBeDefined();
        expect(user.passwordResetExpires!.getTime()).toBeGreaterThan(Date.now());
      });
    });

    describe('generateEmailVerificationToken', () => {
      it('should generate email verification token and expiry', () => {
        user.generateEmailVerificationToken();
        
        expect(user.emailVerificationToken).toBeDefined();
        expect(user.emailVerificationExpires).toBeDefined();
        expect(user.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
      });
    });
  });

  describe('User Privacy Settings', () => {
    it('should have default privacy settings', async () => {
      const user = await new User(validUserData).save();
      
      expect(user.privacySettings).toBeDefined();
      expect(user.privacySettings.showEmail).toBe(false);
      expect(user.privacySettings.showPhone).toBe(true);
      expect(user.privacySettings.allowDirectContact).toBe(true);
    });

    it('should allow updating privacy settings', async () => {
      const user = await new User(validUserData).save();
      
      user.privacySettings.showEmail = true;
      user.privacySettings.showPhone = true;
      user.privacySettings.allowMessages = false;
      
      const updatedUser = await user.save();
      
      expect(updatedUser.privacySettings.showEmail).toBe(true);
      expect(updatedUser.privacySettings.showPhone).toBe(true);
      expect(updatedUser.privacySettings.allowMessages).toBe(false);
    });
  });

  describe('User Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const user = await new User(validUserData).save();
      
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toEqual(user.updatedAt);
    });

    it('should update updatedAt on modification', async () => {
      const user = await new User(validUserData).save();
      const originalUpdatedAt = user.updatedAt;
      
      // 等待一毫秒確保時間戳不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      user.name = 'Updated Name';
      const updatedUser = await user.save();
      
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});