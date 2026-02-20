const { Sequelize } = require('sequelize');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// 数据库配置
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smfun_db',
  {
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ 数据库连接成功');
    return true;
  } catch (error) {
    logger.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 同步数据库
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info(`✅ 数据库同步完成 (force: ${force})`);
    return true;
  } catch (error) {
    logger.error('❌ 数据库同步失败:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  Sequelize
};
