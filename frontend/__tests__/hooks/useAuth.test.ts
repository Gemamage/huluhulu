import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'
import { User, LoginCredentials, RegisterData } from '@/types/auth'

// Mock authService
jest.mock('@/services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getToken: jest.fn(),
    isAuthenticated: jest.fn()
  }
}))

const mockAuthService = authService as jest.Mocked<typeof authService>

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0
    },
    mutations: {
      retry: false
    }
  }
})

const createWrapper = () => {
  const testQueryClient = createTestQueryClient()
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useAuth', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('logs in user successfully', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }
      const loginResponse = {
        user: mockUser,
        token: 'mock-token'
      }
      mockAuthService.login.mockResolvedValue(loginResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.login(credentials)
      })

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials)
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('handles login error', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
      const error = new Error('Invalid credentials')
      mockAuthService.login.mockRejectedValue(error)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        try {
          await result.current.login(credentials)
        } catch (e) {
          expect(e).toBe(error)
        }
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('registers user successfully', async () => {
      const registerData: RegisterData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }
      const registerResponse = {
        user: mockUser,
        token: 'mock-token'
      }
      mockAuthService.register.mockResolvedValue(registerResponse)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.register(registerData)
      })

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData)
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
      })
    })
  })

  describe('logout', () => {
    it('logs out user successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      mockAuthService.isAuthenticated.mockReturnValue(true)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      // First set user as authenticated
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockAuthService.logout).toHaveBeenCalled()
      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
      })
    })
  })

  describe('getCurrentUser', () => {
    it('fetches current user when authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true)
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('does not fetch user when not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('forgotPassword', () => {
    it('sends forgot password email successfully', async () => {
      const email = 'test@example.com'
      const response = { message: 'Password reset email sent' }
      mockAuthService.forgotPassword.mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      let forgotPasswordResult
      await act(async () => {
        forgotPasswordResult = await result.current.forgotPassword(email)
      })

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(email)
      expect(forgotPasswordResult).toEqual(response)
    })
  })

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      const token = 'reset-token'
      const newPassword = 'newpassword123'
      const response = { message: 'Password reset successfully' }
      mockAuthService.resetPassword.mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      let resetPasswordResult
      await act(async () => {
        resetPasswordResult = await result.current.resetPassword(token, newPassword)
      })

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(token, newPassword)
      expect(resetPasswordResult).toEqual(response)
    })
  })

  describe('verifyEmail', () => {
    it('verifies email successfully', async () => {
      const token = 'verification-token'
      const response = { message: 'Email verified successfully' }
      mockAuthService.verifyEmail.mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      let verifyEmailResult
      await act(async () => {
        verifyEmailResult = await result.current.verifyEmail(token)
      })

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token)
      expect(verifyEmailResult).toEqual(response)
    })
  })

  describe('updateProfile', () => {
    it('updates user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      }
      const updatedUser = { ...mockUser, ...updateData }
      mockAuthService.updateProfile.mockResolvedValue(updatedUser)
      mockAuthService.isAuthenticated.mockReturnValue(true)
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(updateData)
      await waitFor(() => {
        expect(result.current.user).toEqual(updatedUser)
      })
    })
  })

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      }
      const response = { message: 'Password changed successfully' }
      mockAuthService.changePassword.mockResolvedValue(response)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      let changePasswordResult
      await act(async () => {
        changePasswordResult = await result.current.changePassword(passwordData)
      })

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(passwordData)
      expect(changePasswordResult).toEqual(response)
    })
  })

  describe('loading states', () => {
    it('shows loading state during login', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      // Create a promise that we can control
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve
      })
      mockAuthService.login.mockReturnValue(loginPromise)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.login(credentials)
      })

      // Should be loading
      expect(result.current.isLoading).toBe(true)

      // Resolve the login
      act(() => {
        resolveLogin({ user: mockUser, token: 'mock-token' })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})