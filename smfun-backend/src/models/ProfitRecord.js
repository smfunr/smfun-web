const { DataTypes } = require('sequelize');
const sequelize = require('../config/database-simple');

const ProfitRecord = sequelize.define('ProfitRecord', {
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
    amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false
    },
    source: {
        type: DataTypes.ENUM('ico_distribution', 'trading_fee', 'platform_revenue', 'referral_bonus', 'monthly_distribution'),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    transaction_hash: {
        type: DataTypes.STRING(66),
        allowNull: true
    },
    distribution_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'profit_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ProfitRecord;
