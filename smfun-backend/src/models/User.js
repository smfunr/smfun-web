const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^0x[a-fA-F0-9]{40}$/
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  membershipLevel: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'king'),
    defaultValue: 'bronze'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalEarned: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0
  },
  totalInvested: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0
  },
  inviteCode: {
    type: DataTypes.STRING,
    unique: true
  },
  invitedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  inviteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned', 'pending'),
    defaultValue: 'active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  walletVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      if (!user.inviteCode) {
        user.inviteCode = 'SMF' + Math.random().toString(36).substring(2, 10).toUpperCase();
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 实例方法
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.twoFactorSecret;
  return values;
};

// 关联关系
User.hasMany(User, { as: 'invitees', foreignKey: 'invitedBy' });
User.belongsTo(User, { as: 'inviter', foreignKey: 'invitedBy' });

module.exports = User;
