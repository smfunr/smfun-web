const { DataTypes } = require('sequelize');
const sequelize = require('../config/database-simple');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    wallet_address: {
        type: DataTypes.STRING(42),
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    membership_level: {
        type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'king'),
        defaultValue: 'bronze'
    },
    total_shares: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_investment: {
        type: DataTypes.DECIMAL(20, 8),
        defaultValue: 0
    },
    total_profits: {
        type: DataTypes.DECIMAL(20, 8),
        defaultValue: 0
    },
    invite_code: {
        type: DataTypes.STRING(20),
        unique: true
    },
    invited_by: {
        type: DataTypes.STRING(42),
        allowNull: true
    },
    invite_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    invite_earnings: {
        type: DataTypes.DECIMAL(20, 8),
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = User;
