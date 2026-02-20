const { DataTypes } = require('sequelize');
const sequelize = require('../config/database-simple');

const ICOShare = sequelize.define('ICOShare', {
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
    shares_count: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    eth_amount: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false
    },
    transaction_hash: {
        type: DataTypes.STRING(66),
        allowNull: true
    },
    purchase_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'ico_shares',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ICOShare;
