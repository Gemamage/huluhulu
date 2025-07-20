import { authService } from '@/services/authService'
import { LoginCredentials, RegisterData, User } from '@/types/auth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  const mockUser: Omit<User, 'generateAuthToken' | 'generatePasswordResetToken'> = {
    _id: '1',
    email: 'test@example.com',
    phone: '0912345678',
    role: 'user',
    isEmailVerified: true,
    lastLoginAt: new Date('2023-01-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockToken = 'mock-jwt-token'

  describe('login', () => {
    it('logs in user successfully', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }
      const mockResponseData = {
        user: mockUser,
        token: mockToken
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponseData)
      })

      const result = await authService.login(credentials)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockToken)
      expect(result).toEqual(mockResponseData)
    })

    it('handles invalid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401
      })

      await expect(authService.login(credentials)).rejects.toThrow('Login failed')
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('registers user successfully', async () => {
      const registerData: RegisterData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '0912345678'
      };
      const mockResponseData = {
        user: mockUser,
        token: mockToken
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponseData)
      })

      const result = await authService.register(registerData)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockToken)
      expect(result).toEqual(mockResponseData)
    })

    it('handles duplicate email', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        password: 'password123',
      };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400
      })

      await expect(authService.register(registerData)).rejects.toThrow('Registration failed')
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('logs out user successfully', async () => {
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValue({
        ok: true
      })

      await authService.logout()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      })
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('removes token even if API call fails', async () => {
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockRejectedValue(new Error('Network error'))

      // logout 方法使用 try-finally，所以即使 fetch 失敗也不會拋出錯誤
      try {
        await authService.logout()
      } catch (error) {
        // 忽略錯誤，因為 logout 應該總是移除 token
      }

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('getCurrentUser', () => {
    it('gets current user successfully', async () => {
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      })

      const result = await authService.getCurrentUser()

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('handles unauthorized request', async () => {
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401
      })

      await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get current user')
    })
  })

  describe('forgotPassword', () => {
    it('sends forgot password email successfully', async () => {
      const forgotPasswordData = { email: 'test@example.com' }
      mockFetch.mockResolvedValue({
        ok: true
      })

      await authService.forgotPassword(forgotPasswordData)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forgotPasswordData),
      })
    })

    it('handles user not found', async () => {
      const forgotPasswordData = { email: 'nonexistent@example.com' }
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(authService.forgotPassword(forgotPasswordData)).rejects.toThrow('Failed to send reset password email')
    })
  })

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      const resetPasswordData = {
        token: 'reset-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      mockFetch.mockResolvedValue({
        ok: true
      })

      await authService.resetPassword(resetPasswordData)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetPasswordData),
      })
    })

    it('handles invalid or expired token', async () => {
      const resetPasswordData = {
        token: 'invalid-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400
      })

      await expect(authService.resetPassword(resetPasswordData)).rejects.toThrow('Failed to reset password')
    })
  })

  describe('verifyEmail', () => {
    it('verifies email successfully', async () => {
      const token = 'verification-token'
      mockFetch.mockResolvedValue({
        ok: true
      })

      await authService.verifyEmail(token)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
    })

    it('handles invalid verification token', async () => {
      const token = 'invalid-token'
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400
      })

      await expect(authService.verifyEmail(token)).rejects.toThrow('Failed to verify email')
    })
  })

  describe('updateProfile', () => {
    it('updates user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '0987654321'
      }
      const updatedUser = { ...mockUser, ...updateData }
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedUser)
      })

      const result = await authService.updateProfile(updateData)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(updateData),
      })
      expect(result).toEqual(updatedUser)
    })
  })

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValue({
        ok: true
      })

      await authService.changePassword(passwordData)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(passwordData),
      })
    })

    it('handles incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      localStorageMock.getItem.mockReturnValue(mockToken)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400
      })

      await expect(authService.changePassword(passwordData)).rejects.toThrow('Failed to change password')
    })
  })

  describe('getToken', () => {
    it('returns token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(mockToken)

      const result = authService.getToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token')
      expect(result).toBe(mockToken)
    })

    it('returns null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = authService.getToken()

      expect(result).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      localStorageMock.getItem.mockReturnValue(mockToken)

      const result = authService.isAuthenticated()

      expect(result).toBe(true)
    })

    it('returns false when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = authService.isAuthenticated()

      expect(result).toBe(false)
    })
  })
})