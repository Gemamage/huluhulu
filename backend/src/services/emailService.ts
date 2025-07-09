import nodemailer from 'nodemailer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

/**
 * 電子郵件服務類別
 */
export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });

  /**
   * 發送電子郵件
   */
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: `${config.email.fromName} <${config.email.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // 如果沒有提供純文本，則從 HTML 中移除標籤
      };

      // 在開發環境中記錄郵件內容
      if (config.env !== 'production') {
        logger.debug('準備發送電子郵件', {
          to,
          subject,
          html: html.substring(0, 100) + '...',
        });
      }

      // 發送郵件
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('電子郵件發送成功', {
        messageId: info.messageId,
        to,
        subject,
      });
    } catch (error) {
      logger.error('電子郵件發送失敗', { error, to, subject });
      throw error;
    }
  }

  /**
   * 發送電子郵件驗證郵件
   */
  static async sendVerificationEmail(
    to: string,
    token: string,
    userName: string
  ): Promise<void> {
    const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;
    const subject = '呼嚕寵物協尋網站 - 請驗證您的電子郵件';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">您好，${userName}！</h2>
        <p>感謝您註冊呼嚕寵物協尋網站。請點擊下方按鈕驗證您的電子郵件地址：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            驗證電子郵件
          </a>
        </div>
        <p>或者，您可以複製以下連結並貼上到瀏覽器地址欄：</p>
        <p style="word-break: break-all; color: #4a5568;">${verificationUrl}</p>
        <p>此驗證連結將在 24 小時後過期。</p>
        <p>如果您沒有註冊呼嚕寵物協尋網站，請忽略此郵件。</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">呼嚕寵物協尋網站團隊</p>
      </div>
    `;

    await this.sendEmail(to, subject, html);
  }

  /**
   * 發送密碼重設郵件
   */
  static async sendPasswordResetEmail(
    to: string,
    token: string,
    userName: string
  ): Promise<void> {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    const subject = '呼嚕寵物協尋網站 - 密碼重設請求';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">您好，${userName}！</h2>
        <p>我們收到了重設您呼嚕寵物協尋網站帳號密碼的請求。請點擊下方按鈕重設密碼：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            重設密碼
          </a>
        </div>
        <p>或者，您可以複製以下連結並貼上到瀏覽器地址欄：</p>
        <p style="word-break: break-all; color: #4a5568;">${resetUrl}</p>
        <p>此重設連結將在 1 小時後過期。</p>
        <p>如果您沒有請求重設密碼，請忽略此郵件，您的帳號仍然安全。</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">呼嚕寵物協尋網站團隊</p>
      </div>
    `;

    await this.sendEmail(to, subject, html);
  }

  /**
   * 發送歡迎郵件
   */
  static async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const subject = '歡迎加入呼嚕寵物協尋網站';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">歡迎加入，${userName}！</h2>
        <p>感謝您註冊呼嚕寵物協尋網站。我們致力於幫助失蹤寵物與主人團聚。</p>
        <p>在我們的平台上，您可以：</p>
        <ul>
          <li>發布寵物協尋資訊</li>
          <li>分享發現的寵物</li>
          <li>加入愛心社群，協助他人尋找寵物</li>
          <li>獲取寵物安全與照顧的專業建議</li>
        </ul>
        <p>如果您有任何問題或需要協助，請隨時聯繫我們的客服團隊。</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clientUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            立即開始使用
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">呼嚕寵物協尋網站團隊</p>
      </div>
    `;

    await this.sendEmail(to, subject, html);
  }

  /**
   * 發送通知郵件
   */
  static async sendNotificationEmail(
    to: string,
    subject: string,
    message: string,
    userName: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">您好，${userName}！</h2>
        <p>${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clientUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            前往網站
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">呼嚕寵物協尋網站團隊</p>
      </div>
    `;

    await this.sendEmail(to, subject, html);
  }
}