import { EmailService } from '../../src/services/emailService';
import { config } from '../../src/config/environment';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

describe('EmailService', () => {
  const mockEmail = 'test@example.com';
  const mockName = 'Test User';
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await EmailService.sendWelcomeEmail(mockEmail, mockName);
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    it('should handle email sending errors', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport().sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(EmailService.sendWelcomeEmail(mockEmail, mockName))
        .rejects.toThrow('SMTP Error');
    });

    it('should validate email format', async () => {
      await expect(EmailService.sendWelcomeEmail('invalid-email', mockName))
        .rejects.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const result = await EmailService.sendPasswordResetEmail(mockEmail, mockToken);
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    it('should include reset link in email', async () => {
      const nodemailer = require('nodemailer');
      const sendMailSpy = nodemailer.createTransport().sendMail;
      
      await EmailService.sendPasswordResetEmail(mockEmail, mockToken);
      
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockEmail,
          subject: expect.stringContaining('密碼重設'),
          html: expect.stringContaining(mockToken)
        })
      );
    });

    it('should handle missing token', async () => {
      await expect(EmailService.sendPasswordResetEmail(mockEmail, ''))
        .rejects.toThrow();
    });
  });

  describe('sendEmailVerification', () => {
    it('should send email verification successfully', async () => {
      const result = await EmailService.sendEmailVerification(mockEmail, mockToken);
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    it('should include verification link in email', async () => {
      const nodemailer = require('nodemailer');
      const sendMailSpy = nodemailer.createTransport().sendMail;
      
      await EmailService.sendEmailVerification(mockEmail, mockToken);
      
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockEmail,
          subject: expect.stringContaining('電子郵件驗證'),
          html: expect.stringContaining(mockToken)
        })
      );
    });
  });

  describe('sendPetMatchNotification', () => {
    const mockPetData = {
      name: 'Buddy',
      type: 'dog',
      breed: 'Golden Retriever',
      lastSeenLocation: 'Central Park'
    };

    it('should send pet match notification successfully', async () => {
      const result = await EmailService.sendPetMatchNotification(
        mockEmail, 
        mockName, 
        mockPetData
      );
      
      expect(result).toBeDefined();
      expect(result.messageId).toBe('test-message-id');
    });

    it('should include pet details in notification', async () => {
      const nodemailer = require('nodemailer');
      const sendMailSpy = nodemailer.createTransport().sendMail;
      
      await EmailService.sendPetMatchNotification(mockEmail, mockName, mockPetData);
      
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockEmail,
          subject: expect.stringContaining('寵物配對'),
          html: expect.stringMatching(new RegExp(mockPetData.name))
        })
      );
    });
  });

  describe('Email Configuration', () => {
    it('should use correct SMTP configuration', () => {
      const nodemailer = require('nodemailer');
      
      // Trigger email service initialization
      EmailService.sendWelcomeEmail(mockEmail, mockName);
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.password
          }
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport().sendMail.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(EmailService.sendWelcomeEmail(mockEmail, mockName))
        .rejects.toThrow('Network timeout');
    });

    it('should handle authentication errors', async () => {
      const nodemailer = require('nodemailer');
      nodemailer.createTransport().sendMail.mockRejectedValueOnce(
        new Error('Authentication failed')
      );

      await expect(EmailService.sendWelcomeEmail(mockEmail, mockName))
        .rejects.toThrow('Authentication failed');
    });
  });
});