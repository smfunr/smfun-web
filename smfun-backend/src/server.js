require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/app.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.coingecko.com", "https://api.binance.com"]
    }
  }
}));

// CORS 配置
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 每个IP限制请求数
  message: '请求过于频繁，请稍后再试。'
});
app.use('/api/', limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/ico', require('./routes/ico'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('服务器错误:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`🚀 sm.fun 后端服务器已启动`);
  logger.info(`📡 环境: ${process.env.NODE_ENV}`);
  logger.info(`🔗 地址: http://localhost:${PORT}`);
  logger.info(`🌐 健康检查: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

module.exports = app;
