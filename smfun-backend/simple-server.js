const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP限制100个请求
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'sm.fun API',
    version: '1.0.0'
  });
});

// API路由
app.get('/api/users', (req, res) => {
  res.json({ 
    message: '用户API - 开发中',
    endpoints: [
      '/api/users/register - 用户注册',
      '/api/users/login - 用户登录',
      '/api/users/wallet-login - 钱包登录',
      '/api/users/profile - 用户资料'
    ]
  });
});

app.get('/api/ico', (req, res) => {
  res.json({
    message: 'ICO API - 开发中',
    config: {
      price: '0.1 ETH per part',
      total: '10,000 parts',
      fee: '35% platform fee sharing'
    }
  });
});

app.get('/api/trading', (req, res) => {
  res.json({
    message: '交易API - 开发中',
    strategies: [
      '趋势跟踪',
      '均值回归', 
      '网格交易',
      '预测市场'
    ]
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'API端点不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 sm.fun API服务器启动成功`);
  console.log(`📡 地址: http://localhost:${PORT}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`👥 用户API: http://localhost:${PORT}/api/users`);
  console.log(`🚀 ICO API: http://localhost:${PORT}/api/ico`);
  console.log(`📈 交易API: http://localhost:${PORT}/api/trading`);
});
