const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中間件
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: '後端服務運行正常', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api/pets', (req, res) => {
  // 模擬寵物資料
  const mockPets = [
    {
      _id: '1',
      name: '小白',
      type: '狗',
      breed: '柴犬',
      age: 2,
      gender: '公',
      status: 'missing',
      location: '台北市大安區',
      description: '非常親人的柴犬，會回應名字，額頭有白色愛心形斑紋',
      images: ['/images/pet-placeholder.svg'],
      contactInfo: {
        name: '王小明',
        phone: '0912345678',
        email: 'test@example.com'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: '小花',
      type: '貓',
      breed: '混種',
      age: 1,
      gender: '母',
      status: 'found',
      location: '台北市信義區',
      description: '溫馴的小貓咪，很親人',
      images: ['/images/pet-placeholder-2.svg'],
      contactInfo: {
        name: '李小華',
        phone: '0987654321',
        email: 'test2@example.com'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: {
      pets: mockPets,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: mockPets.length,
        hasNext: false,
        hasPrev: false
      }
    }
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: '找不到請求的資源' });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`簡化後端服務運行在 http://localhost:${PORT}`);
  console.log(`健康檢查: http://localhost:${PORT}/health`);
  console.log(`寵物 API: http://localhost:${PORT}/api/pets`);
});

module.exports = app;