import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/authService'
import { User, LoginCredentials } from '@/types/auth'
import { RegisterData } from '@/lib/auth'

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
      gcTime: 0
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
    mockAuthService.getCurrentUser.mockResolvedValue(undefined as any)
    mockAuthService.isAuthenticated.mockReturnValue(false)
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
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      // Initially not authenticated
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)

      await act(async () => {
        await result.current.login(credentials)
      })

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials)
      
      // After login, the user should be set via setQueryData
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      }, { timeout: 3000 })
      
      // 設置 authService.isAuthenticated 為 true（模擬登入後的狀態）
      mockAuthService.isAuthenticated.mockReturnValue(true)
      
      // 檢查 isAuthenticated 狀態
      await waitFor(() => {
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
        name: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      const registerResponse = {
        user: mockUser,
        token: 'mock-token'
      }
      mockAuthService.register.mockResolvedValue(registerResponse)
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      // Initially not authenticated
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)

      await act(async () => {
        await result.current.register(registerData)
      })

      expect(mockAuthService.register).toHaveBeenCalledWith(registerData)
      
      // After register, the user should be set via setQueryData
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      }, { timeout: 3000 })
      
      // 設置 authService.isAuthenticated 為 true（模擬註冊後的狀態）
      mockAuthService.isAuthenticated.mockReturnValue(true)
      
      // 檢查 isAuthenticated 狀態
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })
    })
  })

  describe('logout', () => {
    it('logs out user successfully', async () => {
      // Arrange: User is initially logged in
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      mockAuthService.isAuthenticated.mockReturnValue(true)
      mockAuthService.logout.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      // First set user as authenticated
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        mockAuthService.isAuthenticated.mockReturnValue(false)
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
      mockAuthService.forgotPassword.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.forgotPassword(email)
      })

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({ email })
    })
  })

  describe('resetPassword', () => {
    it('resets password successfully', async () => {
      const token = 'reset-token'
      const newPassword = 'newpassword123'
      mockAuthService.resetPassword.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.resetPassword(token, newPassword)
      })

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith({ token, newPassword })
    })
  })

  describe('verifyEmail', () => {
    it('verifies email successfully', async () => {
      const token = 'verification-token'
      mockAuthService.verifyEmail.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.verifyEmail(token)
      })

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token)
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
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      }
      mockAuthService.changePassword.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      await act(async () => {
        await result.current.changePassword(passwordData)
      })

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(passwordData)
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
      const loginPromise = new Promise<any>((resolve) => {
        resolveLogin = resolve
      })
      mockAuthService.login.mockReturnValue(loginPromise as Promise<any>)

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper()
      })

      // Start login (don't await)
      act(() => {
        result.current.login(credentials).catch(() => {})
      })

      // Should be loading (check login-specific loading state)
      await waitFor(() => {
        expect(result.current.isLoginLoading).toBe(true)
      })

      // Resolve the login
      act(() => {
        resolveLogin({ user: mockUser, token: 'mock-token' })
      })

      // Wait for loading to finish
      await waitFor(() => {
        expect(result.current.isLoginLoading).toBe(false)
      })
    })
  })
})