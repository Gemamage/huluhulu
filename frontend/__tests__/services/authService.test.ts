import { authService } from '@/services/authService'
import { LoginCredentials, RegisterData, User } from '@/types/auth'

// Mock axios
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}

jest.mock('@/lib/axios', () => mockAxios)

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
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  const mockUser: User = {
    _id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '0912345678',
    isActive: true,
    isEmailVerified: true,
    privacySettings: {
      showEmail: false,
      showPhone: true,
      allowMessages: true
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }

  const mockToken = 'mock-jwt-token'

  describe('login', () => {
    it('logs in user successfully', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }
      const mockResponse = {
        data: {
          user: mockUser,
          token: mockToken
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.login(credentials)

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken)
      expect(result).toEqual(mockResponse.data)
    })

    it('handles invalid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
      mockAxios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      })

      await expect(authService.login(credentials)).rejects.toMatchObject({
        response: { status: 401 }
      })
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('registers user successfully', async () => {
      const registerData: RegisterData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '0912345678'
      }
      const mockResponse = {
        data: {
          user: mockUser,
          token: mockToken
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.register(registerData)

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken)
      expect(result).toEqual(mockResponse.data)
    })

    it('handles duplicate email', async () => {
      const registerData: RegisterData = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Email already exists' }
        }
      })

      await expect(authService.register(registerData)).rejects.toMatchObject({
        response: { status: 400 }
      })
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('logs out user successfully', async () => {
      mockAxios.post.mockResolvedValue({ data: { message: 'Logged out successfully' } })

      await authService.logout()

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/logout')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })

    it('removes token even if API call fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'))

      await authService.logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('getCurrentUser', () => {
    it('gets current user successfully', async () => {
      const mockResponse = { data: mockUser }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await authService.getCurrentUser()

      expect(mockAxios.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockUser)
    })

    it('handles unauthorized request', async () => {
      mockAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      })

      await expect(authService.getCurrentUser()).rejects.toMatchObject({
        response: { status: 401 }
      })
    })
  })

  describe('forgotPassword', () => {
    it('sends forgot password email successfully', async () => {
      const email = 'test@example.com'
      const mockResponse = {
        data: { message: 'Password reset email sent' }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.forgotPassword(email)

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/forgot-password', { email })
      expect(result).toEqual(mockResponse.data)
    })

    it('handles user not found', async () => {
      const email = 'nonexistent@example.com'
      mockAxios.post.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      })

      await expect(authService.forgotPassword(email)).rejects.toMatchObject({
        response: { status: 404 }
      })
    })
  })

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      const token = 'reset-token'
      const newPassword = 'newpassword123'
      const mockResponse = {
        data: { message: 'Password reset successfully' }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.resetPassword(token, newPassword)

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/reset-password', {
        token,
        password: newPassword
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('handles invalid or expired token', async () => {
      const token = 'invalid-token'
      const newPassword = 'newpassword123'
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid or expired token' }
        }
      })

      await expect(authService.resetPassword(token, newPassword)).rejects.toMatchObject({
        response: { status: 400 }
      })
    })
  })

  describe('verifyEmail', () => {
    it('verifies email successfully', async () => {
      const token = 'verification-token'
      const mockResponse = {
        data: { message: 'Email verified successfully' }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const result = await authService.verifyEmail(token)

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/verify-email', { token })
      expect(result).toEqual(mockResponse.data)
    })

    it('handles invalid verification token', async () => {
      const token = 'invalid-token'
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid verification token' }
        }
      })

      await expect(authService.verifyEmail(token)).rejects.toMatchObject({
        response: { status: 400 }
      })
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
      const mockResponse = { data: updatedUser }
      mockAxios.put.mockResolvedValue(mockResponse)

      const result = await authService.updateProfile(updateData)

      expect(mockAxios.put).toHaveBeenCalledWith('/auth/profile', updateData)
      expect(result).toEqual(updatedUser)
    })
  })

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      }
      const mockResponse = {
        data: { message: 'Password changed successfully' }
      }
      mockAxios.put.mockResolvedValue(mockResponse)

      const result = await authService.changePassword(passwordData)

      expect(mockAxios.put).toHaveBeenCalledWith('/auth/change-password', passwordData)
      expect(result).toEqual(mockResponse.data)
    })

    it('handles incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      }
      mockAxios.put.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Current password is incorrect' }
        }
      })

      await expect(authService.changePassword(passwordData)).rejects.toMatchObject({
        response: { status: 400 }
      })
    })
  })

  describe('getToken', () => {
    it('returns token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(mockToken)

      const result = authService.getToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
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