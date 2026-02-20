const { DataTypes } = require('sequelize');
const sequelize = require('../config/database-simple');

const TradeRecord = sequelize.define('TradeRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false
    },
    bot_id: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    asset_pair: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    trade_type: {
        type: DataTypes.ENUM('buy', 'sell'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false
    },
    total_value: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false
    },
    fee: {
        type: DataTypes.DECIMAL(20, 8),
        defaultValue: 0
    },
    roi: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'executed', 'failed', 'canceled'),
        defaultValue: 'pending'
    },
    executed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'trade_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = TradeRecord;
