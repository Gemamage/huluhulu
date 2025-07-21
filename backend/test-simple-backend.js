const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 基本中介軟體
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 測試路由
app.get('/', (req, res) => {
  res.json({
    message: '呼嚕寵物協尋網站 API - 測試版本',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// 模擬寵物 API
app.get('/api/pets', (req, res) => {
  const mockPets = [
    {
      id: '1',
      name: '小白',
      type: 'dog',
      breed: '柴犬',
      status: 'lost',
      description: '走失的小白狗',
      location: '台北市',
      contactInfo: 'test@example.com',
      images: ['/images/pet1.jpg'],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: '小黑',
      type: 'cat',
      breed: '混種貓',
      status: 'found',
      description: '找到的小黑貓',
      location: '新北市',
      contactInfo: 'test2@example.com',
      images: ['/images/pet2.jpg'],
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: mockPets,
    total: mockPets.length
  });
});

// 模擬單一寵物 API
app.get('/api/pets/:id', (req, res) => {
  const { id } = req.params;
  
  const mockPet = {
    id: id,
    name: `寵物 ${id}`,
    type: 'dog',
    breed: '混種犬',
    status: 'lost',
    description: `這是寵物 ${id} 的詳細資訊`,
    location: '台北市',
    contactInfo: 'test@example.com',
    images: [`/images/pet${id}.jpg`],
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockPet
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error('錯誤:', err);
  res.status(500).json({
    success: false,
    message: '伺服器內部錯誤'
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '找不到請求的資源'
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 測試伺服器運行在 http://localhost:${PORT}`);
  console.log(`📋 API 端點:`);
  console.log(`   GET /health - 健康檢查`);
  console.log(`   GET /api/pets - 取得寵物列表`);
  console.log(`   GET /api/pets/:id - 取得單一寵物資訊`);
});

module.exports = app;