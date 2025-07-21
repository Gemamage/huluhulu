/**
 * 測試數據固定文件
 * 提供一致的測試數據，確保測試的可重複性
 */

// 測試用戶數據
export const TEST_USERS = {
  regular: {
    name: '測試用戶',
    email: 'test@example.com',
    password: 'Test123!',
    phone: '0912345678',
    address: {
      city: '台北市',
      district: '信義區',
      street: '信義路五段7號'
    }
  },
  admin: {
    name: '管理員',
    email: 'admin@example.com',
    password: 'Admin123!',
    phone: '0987654321',
    role: 'admin',
    address: {
      city: '台北市',
      district: '中正區',
      street: '重慶南路一段122號'
    }
  },
  secondary: {
    name: '第二測試用戶',
    email: 'test2@example.com',
    password: 'Test456!',
    phone: '0923456789',
    address: {
      city: '新北市',
      district: '板橋區',
      street: '文化路一段188號'
    }
  }
};

// 測試寵物數據
export const TEST_PETS = {
  lostDog: {
    name: '小白',
    type: 'dog',
    breed: '柴犬',
    age: '2歲',
    gender: 'male',
    color: '白色',
    size: 'medium',
    description: '非常親人的柴犬，喜歡玩球，對陌生人很友善',
    status: 'lost' as const,
    lastSeenLocation: {
      city: '台北市',
      district: '大安區',
      street: '敦化南路二段',
      description: '大安森林公園附近'
    },
    lastSeenDate: '2024-12-01',
    contactInfo: {
      name: '王小明',
      phone: '0912345678',
      email: 'test@example.com'
    },
    reward: 5000,
    images: []
  },
  foundCat: {
    name: '咪咪',
    type: 'cat',
    breed: '米克斯',
    age: '1歲',
    gender: 'female',
    color: '橘白色',
    size: 'small',
    description: '很親人的小貓，會主動靠近人，似乎習慣被人照顧',
    status: 'found' as const,
    foundLocation: {
      city: '台北市',
      district: '中山區',
      street: '民生東路三段',
      description: '民生社區公園'
    },
    foundDate: '2024-12-02',
    contactInfo: {
      name: '李小華',
      phone: '0987654321',
      email: 'test2@example.com'
    },
    images: []
  },
  lostBird: {
    name: '小綠',
    type: 'bird',
    breed: '虎皮鸚鵡',
    age: '6個月',
    gender: 'unknown',
    color: '綠色',
    size: 'small',
    description: '會說簡單的話，喜歡吃小米，對音樂有反應',
    status: 'lost' as const,
    lastSeenLocation: {
      city: '新北市',
      district: '淡水區',
      street: '中正路',
      description: '淡水老街附近'
    },
    lastSeenDate: '2024-12-03',
    contactInfo: {
      name: '張小美',
      phone: '0923456789',
      email: 'test@example.com'
    },
    reward: 2000,
    images: []
  }
};

// 搜尋測試數據
export const SEARCH_TEST_DATA = {
  keywords: {
    petNames: ['小白', '咪咪', '小綠', '球球'],
    breeds: ['柴犬', '米克斯', '虎皮鸚鵡', '黃金獵犬'],
    colors: ['白色', '橘白色', '綠色', '黑色'],
    locations: ['台北市', '新北市', '桃園市']
  },
  filters: {
    types: ['dog', 'cat', 'bird', 'other'],
    statuses: ['lost', 'found'],
    sizes: ['small', 'medium', 'large'],
    genders: ['male', 'female', 'unknown']
  }
};

// AI 功能測試數據
export const AI_TEST_DATA = {
  petImages: {
    dog: {
      description: '一隻棕色的拉布拉多犬，看起來很友善',
      expectedBreed: '拉布拉多',
      expectedFeatures: ['友善', '大型犬', '棕色']
    },
    cat: {
      description: '一隻橘色的短毛貓，眼睛是綠色的',
      expectedBreed: '橘貓',
      expectedFeatures: ['短毛', '橘色', '綠眼']
    }
  },
  searchQueries: {
    natural: [
      '我在大安區丟了一隻白色的小狗',
      '昨天在公園撿到一隻橘貓',
      '尋找走失的虎皮鸚鵡'
    ],
    structured: [
      { type: 'dog', color: '白色', location: '大安區' },
      { type: 'cat', color: '橘色', status: 'found' },
      { type: 'bird', breed: '虎皮鸚鵡', status: 'lost' }
    ]
  }
};

// 表單驗證測試數據
export const VALIDATION_TEST_DATA = {
  validEmails: [
    'test@example.com',
    'user.name@domain.co.uk',
    'user+tag@example.org'
  ],
  invalidEmails: [
    'invalid-email',
    '@example.com',
    'user@',
    'user..name@example.com'
  ],
  validPasswords: [
    'Test123!',
    'MySecure@Pass1',
    'Strong#Password9'
  ],
  invalidPasswords: [
    '123456',
    'password',
    'Test123',
    'test123!'
  ],
  validPhones: [
    '0912345678',
    '02-12345678',
    '+886-912-345-678'
  ],
  invalidPhones: [
    '123',
    'abc-def-ghij',
    '091234567890'
  ]
};

// 錯誤場景測試數據
export const ERROR_SCENARIOS = {
  network: {
    timeout: 'NETWORK_TIMEOUT',
    offline: 'NETWORK_OFFLINE',
    serverError: 'SERVER_ERROR_500'
  },
  authentication: {
    invalidCredentials: 'INVALID_CREDENTIALS',
    expiredToken: 'EXPIRED_TOKEN',
    insufficientPermissions: 'INSUFFICIENT_PERMISSIONS'
  },
  validation: {
    missingRequired: 'MISSING_REQUIRED_FIELD',
    invalidFormat: 'INVALID_FORMAT',
    duplicateData: 'DUPLICATE_DATA'
  }
};

// 性能測試數據
export const PERFORMANCE_TEST_DATA = {
  loadTesting: {
    concurrentUsers: [1, 5, 10, 20, 50],
    requestsPerSecond: [10, 50, 100, 200],
    testDuration: '30s'
  },
  pageLoadTimes: {
    acceptable: 2000, // 2 秒
    good: 1000,       // 1 秒
    excellent: 500    // 0.5 秒
  },
  apiResponseTimes: {
    acceptable: 1000, // 1 秒
    good: 500,        // 0.5 秒
    excellent: 200    // 0.2 秒
  }
};

// 可訪問性測試數據
export const ACCESSIBILITY_TEST_DATA = {
  keyboardNavigation: {
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape'],
    focusableElements: [
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]'
    ]
  },
  screenReader: {
    requiredAttributes: [
      'alt',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'role'
    ]
  },
  colorContrast: {
    minimumRatio: 4.5,
    largeTextRatio: 3.0
  }
};

// 測試環境配置
export const TEST_CONFIG = {
  baseUrls: {
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:5000',
    api: 'http://localhost:5000/api'
  },
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000
  },
  retries: {
    flaky: 2,
    stable: 0
  }
};