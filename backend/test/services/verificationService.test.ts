import { VerificationService } from '../../src/services/verificationService';
import { User, IUser } from '../../src/models/User';
import { EmailService } from '../../src/services/emailService';
import crypto from 'crypto';
import { validUserData } from '../utils/testData';

// Mock external services
jest.mock('../../src/services/emailService');
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

describe('VerificationService', () => {
  let testUser: IUser;

  beforeEach(async () => {
    await User.deleteMany({});
    testUser = await new User({
      ...validUserData,
      isEmailVerified: false
    }).save();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate verification token successfully', async () => {
      const result = await VerificationService.generateEmailVerificationToken(testUser._id.toString());
      
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64); // SHA256 hex string length
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      
      // Verify token is saved to user
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.emailVerificationToken).toBe(result.token);
    });

    it('should set expiration time correctly', async () => {
      const result = await VerificationService.generateEmailVerificationToken(testUser._id.toString());
      
      const expectedExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const timeDifference = Math.abs(result.expiresAt.getTime() - expectedExpiration.getTime());
      
      expect(timeDifference).toBeLessThan(1000); // Within 1 second
    });

    it('should handle non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      await expect(VerificationService.generateEmailVerificationToken(nonExistentId))
        .rejects.toThrow('用戶不存在');
    });

    it('should handle invalid user ID', async () => {
      await expect(VerificationService.generateEmailVerificationToken('invalid-id'))
        .rejects.toThrow();
    });
  });

  describe('sendEmailVerification', () => {
    it('should send verification email successfully', async () => {
      await VerificationService.sendEmailVerification(testUser._id.toString());
      
      expect(mockEmailService.sendEmailVerification).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String)
      );
      
      // Verify token is generated and saved
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.emailVerificationToken).toBeDefined();
    });

    it('should not send verification to already verified user', async () => {
      testUser.isEmailVerified = true;
      await testUser.save();
      
      await expect(VerificationService.sendEmailVerification(testUser._id.toString()))
        .rejects.toThrow('電子郵件已經驗證過了');
      
      expect(mockEmailService.sendEmailVerification).not.toHaveBeenCalled();
    });

    it('should handle email service errors', async () => {
      mockEmailService.sendEmailVerification.mockRejectedValueOnce(
        new Error('Email service unavailable')
      );
      
      await expect(VerificationService.sendEmailVerification(testUser._id.toString()))
        .rejects.toThrow('Email service unavailable');
    });

    it('should regenerate token if existing token is expired', async () => {
      // Set expired token
      testUser.emailVerificationToken = 'expired-token';
      testUser.emailVerificationExpires = new Date(Date.now() - 1000);
      await testUser.save();
      
      await VerificationService.sendEmailVerification(testUser._id.toString());
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.emailVerificationToken).not.toBe('expired-token');
      expect(updatedUser?.emailVerificationExpires?.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifyEmail', () => {
    let verificationToken: string;

    beforeEach(async () => {
      const tokenResult = await VerificationService.generateEmailVerificationToken(testUser._id.toString());
      verificationToken = tokenResult.token;
    });

    it('should verify email with valid token', async () => {
      const result = await VerificationService.verifyEmail(verificationToken);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('驗證成功');
      expect(result.user).toBeDefined();
      expect(result.user?.isEmailVerified).toBe(true);
      expect(result.user?.emailVerificationToken).toBeUndefined();
      expect(result.user?.emailVerificationExpires).toBeUndefined();
    });

    it('should not verify email with invalid token', async () => {
      const result = await VerificationService.verifyEmail('invalid-token');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('無效');
      expect(result.user).toBeNull();
    });

    it('should not verify email with expired token', async () => {
      // Set token as expired
      testUser.emailVerificationExpires = new Date(Date.now() - 1000);
      await testUser.save();
      
      const result = await VerificationService.verifyEmail(verificationToken);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('過期');
      expect(result.user).toBeNull();
    });

    it('should handle already verified email', async () => {
      // First verification
      await VerificationService.verifyEmail(verificationToken);
      
      // Second verification attempt
      const result = await VerificationService.verifyEmail(verificationToken);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('已經驗證');
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token successfully', async () => {
      const result = await VerificationService.generatePasswordResetToken(testUser.email);
      
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      
      // Verify token is saved to user
      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser?.passwordResetToken).toBe(result.token);
    });

    it('should set correct expiration time for password reset', async () => {
      const result = await VerificationService.generatePasswordResetToken(testUser.email);
      
      const expectedExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const timeDifference = Math.abs(result.expiresAt.getTime() - expectedExpiration.getTime());
      
      expect(timeDifference).toBeLessThan(1000);
    });

    it('should handle non-existent email', async () => {
      await expect(VerificationService.generatePasswordResetToken('nonexistent@example.com'))
        .rejects.toThrow('用戶不存在');
    });

    it('should handle case-insensitive email lookup', async () => {
      const result = await VerificationService.generatePasswordResetToken(testUser.email.toUpperCase());
      
      expect(result.token).toBeDefined();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      await VerificationService.sendPasswordResetEmail(testUser.email);
      
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String)
      );
      
      // Verify token is generated and saved
      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser?.passwordResetToken).toBeDefined();
    });

    it('should handle non-existent email gracefully', async () => {
      // Should not throw error for security reasons
      await expect(VerificationService.sendPasswordResetEmail('nonexistent@example.com'))
        .resolves.not.toThrow();
      
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should handle email service errors', async () => {
      mockEmailService.sendPasswordResetEmail.mockRejectedValueOnce(
        new Error('Email service unavailable')
      );
      
      await expect(VerificationService.sendPasswordResetEmail(testUser.email))
        .rejects.toThrow('Email service unavailable');
    });
  });

  describe('verifyPasswordResetToken', () => {
    let resetToken: string;

    beforeEach(async () => {
      const tokenResult = await VerificationService.generatePasswordResetToken(testUser.email);
      resetToken = tokenResult.token;
    });

    it('should verify password reset token successfully', async () => {
      const result = await VerificationService.verifyPasswordResetToken(resetToken);
      
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(testUser.email);
    });

    it('should not verify invalid token', async () => {
      const result = await VerificationService.verifyPasswordResetToken('invalid-token');
      
      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should not verify expired token', async () => {
      // Set token as expired
      testUser.passwordResetExpires = new Date(Date.now() - 1000);
      await testUser.save();
      
      const result = await VerificationService.verifyPasswordResetToken(resetToken);
      
      expect(result.valid).toBe(false);
      expect(result.user).toBeNull();
    });
  });

  describe('resetPassword', () => {
    let resetToken: string;
    const newPassword = 'newpassword123';

    beforeEach(async () => {
      const tokenResult = await VerificationService.generatePasswordResetToken(testUser.email);
      resetToken = tokenResult.token;
    });

    it('should reset password successfully', async () => {
      const result = await VerificationService.resetPassword(resetToken, newPassword);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('重設成功');
      
      // Verify password is changed
      const updatedUser = await User.findById(testUser._id);
      expect(await updatedUser?.comparePassword(newPassword)).toBe(true);
      
      // Verify reset token is cleared
      expect(updatedUser?.passwordResetToken).toBeUndefined();
      expect(updatedUser?.passwordResetExpires).toBeUndefined();
    });

    it('should not reset password with invalid token', async () => {
      const result = await VerificationService.resetPassword('invalid-token', newPassword);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('無效或已過期');
    });

    it('should validate new password strength', async () => {
      await expect(VerificationService.resetPassword(resetToken, '123'))
        .rejects.toThrow();
    });

    it('should handle expired token', async () => {
      // Set token as expired
      testUser.passwordResetExpires = new Date(Date.now() - 1000);
      await testUser.save();
      
      const result = await VerificationService.resetPassword(resetToken, newPassword);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('無效或已過期');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired verification tokens', async () => {
      // Create users with expired tokens
      const expiredUser1 = await new User({
        ...validUserData,
        email: 'expired1@example.com',
        emailVerificationToken: 'expired-token-1',
        emailVerificationExpires: new Date(Date.now() - 1000)
      }).save();
      
      const expiredUser2 = await new User({
        ...validUserData,
        email: 'expired2@example.com',
        passwordResetToken: 'expired-reset-token',
        passwordResetExpires: new Date(Date.now() - 1000)
      }).save();
      
      const result = await VerificationService.cleanupExpiredTokens();
      
      expect(result.emailVerificationCleaned).toBe(1);
      expect(result.passwordResetCleaned).toBe(1);
      
      // Verify tokens are cleared
      const updatedUser1 = await User.findById(expiredUser1._id);
      const updatedUser2 = await User.findById(expiredUser2._id);
      
      expect(updatedUser1?.emailVerificationToken).toBeUndefined();
      expect(updatedUser2?.passwordResetToken).toBeUndefined();
    });

    it('should not affect valid tokens', async () => {
      // Create user with valid token
      const validUser = await new User({
        ...validUserData,
        email: 'valid@example.com',
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000)
      }).save();
      
      await VerificationService.cleanupExpiredTokens();
      
      const updatedUser = await User.findById(validUser._id);
      expect(updatedUser?.emailVerificationToken).toBe('valid-token');
    });
  });

  describe('Token Security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const tokens = new Set();
      
      // Generate multiple tokens and ensure they are unique
      for (let i = 0; i < 100; i++) {
        const result = await VerificationService.generateEmailVerificationToken(testUser._id.toString());
        tokens.add(result.token);
      }
      
      expect(tokens.size).toBe(100); // All tokens should be unique
    });

    it('should use secure random generation', () => {
      const spy = jest.spyOn(crypto, 'randomBytes');
      
      VerificationService.generateEmailVerificationToken(testUser._id.toString());
      
      expect(spy).toHaveBeenCalledWith(32); // 32 bytes for 64 character hex string
      
      spy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    it('should prevent too frequent verification email requests', async () => {
      // Send first email
      await VerificationService.sendEmailVerification(testUser._id.toString());
      
      // Try to send another immediately
      await expect(VerificationService.sendEmailVerification(testUser._id.toString()))
        .rejects.toThrow('請等待');
    });

    it('should allow resending after cooldown period', async () => {
      // Send first email
      await VerificationService.sendEmailVerification(testUser._id.toString());
      
      // Simulate cooldown period passed
      testUser.emailVerificationExpires = new Date(Date.now() - 60 * 1000);
      await testUser.save();
      
      // Should allow resending
      await expect(VerificationService.sendEmailVerification(testUser._id.toString()))
        .resolves.not.toThrow();
    });
  });
});