import { userService as UserService } from '../../src/services/userService';
import { User, IUser } from '../../src/models/User';
import { EmailService } from '../../src/services/emailService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validUserData, otherUserData } from '../utils/testData';

// Mock external services
jest.mock('../../src/services/emailService');
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

describe('UserService', () => {
  let testUser: IUser;

  beforeEach(async () => {
    await User.deleteMany({});
    testUser = await new User(validUserData).save();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('registerUser', () => {
    const newUserData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      phone: '+1987654321'
    };

    it('should register a new user successfully', async () => {
      const result = await UserService.register(newUserData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(newUserData.email);
      expect(result.user.name).toBe(newUserData.name);
      expect(result.user.phone).toBe(newUserData.phone);
      expect(result.token).toBeDefined();
      expect(result.user.password).toBeUndefined(); // Password should not be returned
      
      // Verify password is hashed
      const savedUser = await User.findOne({ email: newUserData.email });
      expect(savedUser?.password).not.toBe(newUserData.password);
      expect(await bcrypt.compare(newUserData.password, savedUser!.password)).toBe(true);
    });

    it('should send welcome email after registration', async () => {
      await UserService.register(newUserData);
      
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        newUserData.email,
        newUserData.name
      );
    });

    it('should send email verification after registration', async () => {
      await UserService.register(newUserData);
      
      expect(mockEmailService.sendEmailVerification).toHaveBeenCalledWith(
        newUserData.email,
        expect.any(String)
      );
    });

    it('should not register user with existing email', async () => {
      await expect(UserService.register(validUserData))
        .rejects.toThrow('此電子郵件已被註冊');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing required fields
      };
      
      await expect(UserService.register(incompleteData as any))
        .rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...newUserData,
        email: 'invalid-email'
      };
      
      await expect(UserService.register(invalidEmailData))
        .rejects.toThrow();
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...newUserData,
        password: '123'
      };
      
      await expect(UserService.register(weakPasswordData))
        .rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      const result = await UserService.loginUser({
        email: validUserData.email,
        password: validUserData.password
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validUserData.email);
      expect(result.token).toBeDefined();
      expect(result.user.password).toBeUndefined();
      
      // Verify JWT token
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(testUser._id.toString());
    });

    it('should update lastLoginAt on successful login', async () => {
      const originalLastLogin = testUser.lastLoginAt;
      
      await UserService.loginUser({
        email: validUserData.email,
        password: validUserData.password
      });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.lastLoginAt).toBeDefined();
      if (originalLastLogin) {
        expect(updatedUser?.lastLoginAt?.getTime()).toBeGreaterThan(originalLastLogin.getTime());
      }
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

    it('should handle case-insensitive email login', async () => {
      const result = await UserService.loginUser({
        email: validUserData.email.toUpperCase(),
        password: validUserData.password
      });

      expect(result.user.email).toBe(validUserData.email);
    });
  });

  describe('getUserById', () => {
    it('should get user by valid ID', async () => {
      const result = await UserService.getUserById(testUser._id.toString());
      
      expect(result).toBeDefined();
      expect(result?.email).toBe(validUserData.email);
      expect(result?.password).toBeUndefined(); // Password should not be returned
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const result = await UserService.getUserById(nonExistentId);
      
      expect(result).toBeNull();
    });

    it('should handle invalid ObjectId', async () => {
      await expect(UserService.getUserById('invalid-id'))
        .rejects.toThrow();
    });
  });

  describe('updateUserProfile', () => {
    const updateData = {
      name: 'Updated Name',
      phone: '+1555123456',
      bio: 'Updated bio'
    };

    it('should update user profile successfully', async () => {
      const result = await UserService.updateUserProfile(testUser._id.toString(), updateData);
      
      expect(result).toBeDefined();
      expect(result?.name).toBe(updateData.name);
      expect(result?.phone).toBe(updateData.phone);
      expect(result?.bio).toBe(updateData.bio);
      expect(result?.password).toBeUndefined();
    });

    it('should not update email through profile update', async () => {
      const updateWithEmail = {
        ...updateData,
        email: 'newemail@example.com'
      };
      
      const result = await UserService.updateUserProfile(
        testUser._id.toString(), 
        updateWithEmail as any
      );
      
      expect(result?.email).toBe(validUserData.email); // Should remain unchanged
    });

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        phone: 'invalid-phone'
      };
      
      await expect(UserService.updateUserProfile(
        testUser._id.toString(), 
        invalidPhoneData
      )).rejects.toThrow();
    });

    it('should handle non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      await expect(UserService.updateUserProfile(nonExistentId, updateData))
        .rejects.toThrow('用戶不存在');
    });
  });

  describe('changePassword', () => {
    const newPassword = 'newpassword123';

    it('should change password with valid current password', async () => {
      await UserService.changePassword(
        testUser._id.toString(),
        validUserData.password,
        newPassword
      );
      
      // Verify new password works
      const loginResult = await UserService.loginUser({
        email: validUserData.email,
        password: newPassword
      });
      
      expect(loginResult.user).toBeDefined();
    });

    it('should not change password with invalid current password', async () => {
      await expect(UserService.changePassword(
        testUser._id.toString(),
        'wrongpassword',
        newPassword
      )).rejects.toThrow('當前密碼錯誤');
    });

    it('should validate new password strength', async () => {
      await expect(UserService.changePassword(
        testUser._id.toString(),
        validUserData.password,
        '123' // Weak password
      )).rejects.toThrow();
    });

    it('should not allow same password', async () => {
      await expect(UserService.changePassword(
        testUser._id.toString(),
        validUserData.password,
        validUserData.password
      )).rejects.toThrow('新密碼不能與當前密碼相同');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email for existing user', async () => {
      await UserService.requestPasswordReset(validUserData.email);
      
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        validUserData.email,
        expect.any(String)
      );
      
      // Verify reset token is set
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.passwordResetToken).toBeDefined();
      expect(updatedUser?.passwordResetExpires).toBeDefined();
    });

    it('should handle non-existent email gracefully', async () => {
      // Should not throw error for security reasons
      await expect(UserService.requestPasswordReset('nonexistent@example.com'))
        .resolves.not.toThrow();
      
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    let resetToken: string;

    beforeEach(async () => {
      testUser.generatePasswordResetToken();
      resetToken = testUser.passwordResetToken!;
      await testUser.save();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';
      
      await UserService.resetPassword(resetToken, newPassword);
      
      // Verify new password works
      const loginResult = await UserService.loginUser({
        email: validUserData.email,
        password: newPassword
      });
      
      expect(loginResult.user).toBeDefined();
      
      // Verify reset token is cleared
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.passwordResetToken).toBeUndefined();
      expect(updatedUser?.passwordResetExpires).toBeUndefined();
    });

    it('should not reset password with invalid token', async () => {
      await expect(UserService.resetPassword('invalid-token', 'newpassword123'))
        .rejects.toThrow('密碼重設令牌無效或已過期');
    });

    it('should not reset password with expired token', async () => {
      // Set token as expired
      testUser.passwordResetExpires = new Date(Date.now() - 1000);
      await testUser.save();
      
      await expect(UserService.resetPassword(resetToken, 'newpassword123'))
        .rejects.toThrow('密碼重設令牌無效或已過期');
    });
  });

  describe('verifyEmail', () => {
    let verificationToken: string;

    beforeEach(async () => {
      testUser.generateEmailVerificationToken();
      verificationToken = testUser.emailVerificationToken!;
      testUser.isEmailVerified = false;
      await testUser.save();
    });

    it('should verify email with valid token', async () => {
      await UserService.verifyEmail(verificationToken);
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.isEmailVerified).toBe(true);
      expect(updatedUser?.emailVerificationToken).toBeUndefined();
    });

    it('should not verify email with invalid token', async () => {
      await expect(UserService.verifyEmail('invalid-token'))
        .rejects.toThrow('電子郵件驗證令牌無效');
    });

    it('should handle already verified email', async () => {
      testUser.isEmailVerified = true;
      await testUser.save();
      
      await expect(UserService.verifyEmail(verificationToken))
        .rejects.toThrow('電子郵件已經驗證過了');
    });
  });

  describe('updatePrivacySettings', () => {
    const privacySettings = {
      showEmail: false,
      showPhone: false,
      allowMessages: true
    };

    it('should update privacy settings successfully', async () => {
      const result = await UserService.updatePrivacySettings(
        testUser._id.toString(),
        privacySettings
      );
      
      expect(result?.privacySettings.showEmail).toBe(false);
      expect(result?.privacySettings.showPhone).toBe(false);
      expect(result?.privacySettings.allowMessages).toBe(true);
    });

    it('should handle partial privacy settings update', async () => {
      const partialSettings = {
        showEmail: false
      };
      
      const result = await UserService.updatePrivacySettings(
        testUser._id.toString(),
        partialSettings
      );
      
      expect(result?.privacySettings.showEmail).toBe(false);
      // Other settings should remain unchanged
      expect(result?.privacySettings.showPhone).toBe(testUser.privacySettings.showPhone);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      await UserService.deactivateUser(testUser._id.toString());
      
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.isActive).toBe(false);
    });

    it('should not allow login after deactivation', async () => {
      await UserService.deactivateUser(testUser._id.toString());
      
      await expect(UserService.loginUser({
        email: validUserData.email,
        password: validUserData.password
      })).rejects.toThrow('用戶帳號已被停用');
    });
  });
});