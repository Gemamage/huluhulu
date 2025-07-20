import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

class AuthService {
  private readonly API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly USER_KEY = 'user';

  /**
   * 用戶註冊
   */
  async register(
    data: RegisterData
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '註冊失敗');
    }

    // 儲存令牌和用戶資訊
    this.setTokens(result.data.tokens);
    this.setUser(result.data.user);

    return result.data;
  }

  /**
   * 用戶登入
   */
  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '登入失敗');
    }

    // 儲存令牌和用戶資訊
    this.setTokens(result.data.tokens);
    this.setUser(result.data.user);

    return result.data;
  }

  /**
   * 用戶登出
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      try {
        await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('登出請求失敗:', error);
      }
    }

    // 清除本地儲存
    this.clearAuth();
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('沒有刷新令牌');
    }

    const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      this.clearAuth();
      throw new Error(result.message || '令牌刷新失敗');
    }

    // 更新令牌
    this.setTokens(result.data.tokens);

    return result.data.tokens;
  }

  /**
   * 忘記密碼
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '發送重設密碼郵件失敗');
    }
  }

  /**
   * 重設密碼
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '重設密碼失敗');
    }
  }

  /**
   * 獲取當前用戶資訊
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '獲取用戶資訊失敗');
    }

    // 更新本地用戶資訊
    this.setUser(result.data.user);

    return result.data.user;
  }

  /**
   * 驗證電子郵件
   */
  async verifyEmail(token: string): Promise<void> {
    const response = await fetch(
      `${this.API_BASE_URL}/auth/verify-email/${token}`,
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '電子郵件驗證失敗');
    }
  }

  /**
   * 重新發送驗證郵件（需要登入）
   */
  async resendVerificationEmail(): Promise<void> {
    const response = await fetch(
      `${this.API_BASE_URL}/auth/resend-verification`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '發送驗證郵件失敗');
    }
  }

  /**
   * 重新發送驗證郵件（無需登入）
   */
  async resendVerificationEmailByEmail(email: string): Promise<void> {
    const response = await fetch(
      `${this.API_BASE_URL}/auth/resend-verification-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '發送驗證郵件失敗');
    }
  }

  /**
   * 檢查驗證狀態
   */
  async checkVerificationStatus(
    email: string
  ): Promise<{
    isVerified: boolean;
    canResend: boolean;
    nextResendTime?: string;
  }> {
    const response = await fetch(
      `${this.API_BASE_URL}/auth/verification-status?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '檢查驗證狀態失敗');
    }

    return result.data;
  }

  /**
   * 更新個人資料
   */
  async updateProfile(data: { name: string; phone?: string }): Promise<User> {
    const response = await fetch(`${this.API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新個人資料失敗');
    }

    // 更新本地用戶資訊
    this.setUser(result.data.user);

    return result.data.user;
  }

  /**
   * 更改密碼
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = this.getUser();
    if (!user) {
      throw new Error('未找到用戶資訊');
    }

    const response = await fetch(
      `${this.API_BASE_URL}/users/${user.id}/change-password`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更改密碼失敗');
    }
  }

  /**
   * 上傳頭像
   */
  async uploadAvatar(file: File): Promise<User> {
    const user = this.getUser();
    if (!user) {
      throw new Error('未找到用戶資訊');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(
      `${this.API_BASE_URL}/users/${user.id}/avatar`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '上傳頭像失敗');
    }

    // 更新本地用戶資訊
    this.setUser(result.data.user);

    return result.data.user;
  }

  // 令牌管理方法
  private setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  // 用戶資訊管理方法
  private setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // 認證狀態檢查
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp ? decoded.exp > currentTime : false;
    } catch {
      return false;
    }
  }

  // 清除認證資訊
  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  // 自動刷新令牌
  async autoRefreshToken(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = (decoded.exp || 0) - currentTime;

      // 如果令牌在 5 分鐘內過期，則刷新
      if (timeUntilExpiry < 300) {
        await this.refreshToken();
      }
    } catch (error) {
      console.error('自動刷新令牌失敗:', error);
      this.clearAuth();
    }
  }
}

export const authService = new AuthService();
