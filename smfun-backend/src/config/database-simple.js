const { Sequelize } = require('sequelize');

// 使用SQLite简化开发
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/smfun.db',
  logging: false
});

module.exports = sequelize;
