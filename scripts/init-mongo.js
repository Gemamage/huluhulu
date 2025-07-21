// MongoDB 初始化腳本
// 此腳本會在 Docker 容器啟動時執行，用於建立資料庫和初始資料

// 切換到 pet-finder 資料庫
db = db.getSiblingDB('pet-finder');

// 建立使用者
db.createUser({
  user: 'petfinder',
  pwd: 'petfinder123',
  roles: [
    {
      role: 'readWrite',
      db: 'pet-finder'
    }
  ]
});

print('✅ 資料庫使用者建立完成');

// 建立集合和索引

// 使用者集合
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ role: 1 });

print('✅ 使用者集合和索引建立完成');

// 寵物協尋貼文集合
db.createCollection('posts');
db.posts.createIndex({ userId: 1 });
db.posts.createIndex({ petType: 1 });
db.posts.createIndex({ status: 1 });
db.posts.createIndex({ postType: 1 });
db.posts.createIndex({ createdAt: -1 });
db.posts.createIndex({ updatedAt: -1 });
db.posts.createIndex({ 'location.coordinates': '2dsphere' }); // 地理位置索引
db.posts.createIndex({ 
  title: 'text', 
  description: 'text', 
  'pet.breed': 'text',
  'location.address': 'text'
}); // 全文搜尋索引

print('✅ 協尋貼文集合和索引建立完成');

// 留言集合
db.createCollection('comments');
db.comments.createIndex({ postId: 1 });
db.comments.createIndex({ userId: 1 });
db.comments.createIndex({ createdAt: -1 });
db.comments.createIndex({ parentId: 1 }); // 回覆留言

print('✅ 留言集合和索引建立完成');

// 通知集合
db.createCollection('notifications');
db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });
db.notifications.createIndex({ type: 1 });

print('✅ 通知集合和索引建立完成');

// 檔案上傳記錄集合
db.createCollection('uploads');
db.uploads.createIndex({ userId: 1 });
db.uploads.createIndex({ postId: 1 });
db.uploads.createIndex({ createdAt: -1 });
db.uploads.createIndex({ fileType: 1 });

print('✅ 檔案上傳集合和索引建立完成');

// 系統設定集合
db.createCollection('settings');
db.settings.createIndex({ key: 1 }, { unique: true });

print('✅ 系統設定集合和索引建立完成');

// 插入初始系統設定
db.settings.insertMany([
  {
    key: 'site_name',
    value: '呼嚕寵物協尋網站',
    description: '網站名稱',
    type: 'string',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'max_upload_size',
    value: 5242880, // 5MB
    description: '最大檔案上傳大小（位元組）',
    type: 'number',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'allowed_file_types',
    value: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    description: '允許的檔案類型',
    type: 'array',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'posts_per_page',
    value: 12,
    description: '每頁顯示的貼文數量',
    type: 'number',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'enable_email_notifications',
    value: true,
    description: '啟用郵件通知',
    type: 'boolean',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    key: 'maintenance_mode',
    value: false,
    description: '維護模式',
    type: 'boolean',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ 初始系統設定插入完成');

// 插入測試資料（僅在開發環境）
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 測試使用者
  db.users.insertMany([
    {
      username: 'admin',
      email: 'admin@petfinder.com',
      password: '$2b$10$rQZ8kHWKtGY5uJYxGZxGxOxKQqYqGZxGxOxKQqYqGZxGxOxKQqYqG', // password: admin123
      role: 'admin',
      status: 'active',
      profile: {
        firstName: '管理員',
        lastName: '測試',
        phone: '0912345678',
        avatar: null
      },
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        language: 'zh-TW',
        theme: 'light'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'testuser',
      email: 'test@petfinder.com',
      password: '$2b$10$rQZ8kHWKtGY5uJYxGZxGxOxKQqYqGZxGxOxKQqYqGZxGxOxKQqYqG', // password: test123
      role: 'user',
      status: 'active',
      profile: {
        firstName: '測試',
        lastName: '使用者',
        phone: '0987654321',
        avatar: null
      },
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        language: 'zh-TW',
        theme: 'light'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  
  print('✅ 測試使用者資料插入完成');
}

// 建立測試資料庫
db = db.getSiblingDB('pet-finder-test');

// 建立測試資料庫使用者
db.createUser({
  user: 'testuser',
  pwd: 'testpass',
  roles: [
    {
      role: 'readWrite',
      db: 'pet-finder-test'
    }
  ]
});

print('✅ 測試資料庫和使用者建立完成');

print('🎉 MongoDB 初始化完成！');
print('📊 資料庫: pet-finder');
print('👤 使用者: petfinder');
print('🔒 密碼: petfinder123');
print('🧪 測試資料庫: pet-finder-test');
print('👤 測試使用者: testuser');
print('🔒 測試密碼: testpass');