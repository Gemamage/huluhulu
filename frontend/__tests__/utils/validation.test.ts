import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validatePetData,
  validateSearchFilters
} from '@/utils/validation'
import { CreatePetData, PetType } from '@/types/pet'
import { SearchFilters } from '@/types/search'

describe('validation utils', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example.',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'C0mplex#Password',
        'Secure123$'
      ]

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true)
      })
    })

    it('rejects weak passwords', () => {
      const invalidPasswords = [
        'password', // no uppercase, no number, no special char
        'PASSWORD', // no lowercase, no number, no special char
        '12345678', // no letters, no special char
        'Pass123', // too short
        'Password123', // no special char
        'Password!', // no number
        'password123!', // no uppercase
        'PASSWORD123!', // no lowercase
        ''
      ]

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false)
      })
    })
  })

  describe('validatePhone', () => {
    it('validates correct phone formats', () => {
      const validPhones = [
        '0912345678',
        '02-12345678',
        '(02) 1234-5678',
        '+886-912-345-678',
        '886912345678'
      ]

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true)
      })
    })

    it('rejects invalid phone formats', () => {
      const invalidPhones = [
        '123', // too short
        'abcd1234', // contains letters
        '091234567890123', // too long
        ''
      ]

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false)
      })
    })
  })

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      const validValues = [
        'test',
        '123',
        'a',
        ' test ', // should trim whitespace
        0,
        false
      ]

      validValues.forEach(value => {
        expect(validateRequired(value)).toBe(true)
      })
    })

    it('rejects empty values', () => {
      const invalidValues = [
        '',
        '   ', // only whitespace
        null,
        undefined
      ]

      invalidValues.forEach(value => {
        expect(validateRequired(value)).toBe(false)
      })
    })
  })

  describe('validatePetData', () => {
    const validPetData: CreatePetData = {
      name: '小白',
      type: 'dog' as PetType,
      breed: '拉布拉多',
      age: 2,
      gender: 'male',
      size: 'large',
      color: '白色',
      description: '很友善的狗狗',
      status: 'lost',
      lastSeenLocation: {
        address: '台北市信義區',
        coordinates: [121.5654, 25.0330] as [number, number]
      },
      contactInfo: {
        phone: '0912345678',
        email: 'test@example.com',
        preferredContact: 'phone'
      }
    }

    it('validates complete pet data', () => {
      const result = validatePetData(validPetData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('rejects pet data with missing required fields', () => {
      const invalidPetData = {
        ...validPetData,
        name: '',
        type: '' as PetType
      }

      const result = validatePetData(invalidPetData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual(['寵物名稱為必填項目', '寵物類型為必填項目'])
    })

    it('rejects pet data with invalid email', () => {
      const invalidPetData = {
        ...validPetData,
        contactInfo: {
          ...validPetData.contactInfo,
          email: 'invalid-email'
        }
      }

      const result = validatePetData(invalidPetData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('請輸入有效的電子郵件地址')
    })

    it('rejects pet data with invalid phone', () => {
      const invalidPetData = {
        ...validPetData,
        contactInfo: {
          ...validPetData.contactInfo,
          phone: '123'
        }
      }

      const result = validatePetData(invalidPetData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('請輸入有效的電話號碼')
    })

    it('rejects pet data with invalid age', () => {
      const invalidPetData = {
        ...validPetData,
        age: -1
      }

      const result = validatePetData(invalidPetData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('寵物年齡必須為正數')
    })

    it('rejects pet data with invalid coordinates', () => {
      const invalidPetData = {
        ...validPetData,
        lastSeenLocation: {
          address: '台北市信義區',
          coordinates: [200, 100] as [number, number] // invalid longitude and latitude
        }
      }

      const result = validatePetData(invalidPetData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('經緯度座標無效')
    })
  })

  describe('validateSearchFilters', () => {
    it('validates empty search filters', () => {
      const emptyFilters: SearchFilters = {
        type: '',
        status: '',
        breed: '',
        location: '',
        size: '',
        gender: ''
      }

      const result = validateSearchFilters(emptyFilters)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('validates complete search filters', () => {
      const validFilters: SearchFilters = {
        type: 'dog',
        status: 'lost',
        breed: '拉布拉多',
        location: '台北市',
        size: 'large',
        gender: 'male'
      }

      const result = validateSearchFilters(validFilters)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('rejects invalid pet type', () => {
      const invalidFilters: SearchFilters = {
        type: 'invalid-type',
        status: '',
        breed: '',
        location: '',
        size: '',
        gender: ''
      }

      const result = validateSearchFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual(['無效的寵物類型'])
    })

    it('rejects invalid status', () => {
      const invalidFilters: SearchFilters = {
        type: '',
        status: 'invalid-status',
        breed: '',
        location: '',
        size: '',
        gender: ''
      }

      const result = validateSearchFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無效的狀態')
    })

    it('rejects invalid size', () => {
      const invalidFilters: SearchFilters = {
        type: '',
        status: '',
        breed: '',
        location: '',
        size: 'invalid-size',
        gender: ''
      }

      const result = validateSearchFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無效的體型')
    })

    it('rejects invalid gender', () => {
      const invalidFilters: SearchFilters = {
        type: '',
        status: '',
        breed: '',
        location: '',
        size: '',
        gender: 'invalid-gender'
      }

      const result = validateSearchFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無效的性別')
    })

    it('handles multiple validation errors', () => {
      const invalidFilters: SearchFilters = {
        type: 'invalid-type',
        status: 'invalid-status',
        breed: '',
        location: '',
        size: 'invalid-size',
        gender: 'invalid-gender'
      }

      const result = validateSearchFilters(invalidFilters)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4)
      expect(result.errors).toContain('無效的寵物類型')
      expect(result.errors).toContain('無效的狀態')
      expect(result.errors).toContain('無效的體型')
      expect(result.errors).toContain('無效的性別')
    })
  })
})