const sequelize = require('./config/database');
const User = require('./models/User');
const ICOShare = require('./models/ICOShare');
const ProfitRecord = require('./models/ProfitRecord');
const TradeRecord = require('./models/TradeRecord');

async function initializeDatabase() {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        
        // 同步所有模型（创建表）
        await sequelize.sync({ force: true });
        console.log('✅ 数据库表已创建');
        
        // 创建管理员用户
        const adminUser = await User.create({
            wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168',
            username: 'Admin',
            email: 'smfunr@gmail.com',
            membership_level: 'king',
            total_shares: 1000,
            total_investment: 100,
            total_profits: 25.5,
            invite_code: 'SMF-ADMIN',
            invite_count: 50,
            invite_earnings: 5.2
        });
        
        console.log('✅ 管理员用户已创建');
        
        // 创建测试用户
        const testUser = await User.create({
            wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
            username: 'TestUser_123',
            membership_level: 'gold',
            total_shares: 85,
            total_investment: 8.5,
            total_profits: 1.2,
            invite_code: 'SMF-TEST1',
            invite_count: 3,
            invite_earnings: 0.15
        });
        
        console.log('✅ 测试用户已创建');
        
        // 创建ICO份额记录
        await ICOShare.bulkCreate([
            {
                user_id: adminUser.id,
                wallet_address: adminUser.wallet_address,
                shares_count: 500,
                eth_amount: 50,
                status: 'confirmed',
                transaction_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
            },
            {
                user_id: adminUser.id,
                wallet_address: adminUser.wallet_address,
                shares_count: 500,
                eth_amount: 50,
                status: 'confirmed',
                transaction_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
            },
            {
                user_id: testUser.id,
                wallet_address: testUser.wallet_address,
                shares_count: 85,
                eth_amount: 8.5,
                status: 'confirmed',
                transaction_hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456'
            }
        ]);
        
        console.log('✅ ICO份额记录已创建');
        
        // 创建收益记录
        await ProfitRecord.bulkCreate([
            {
                user_id: adminUser.id,
                wallet_address: adminUser.wallet_address,
                amount: 5.2,
                source: 'platform_revenue',
                description: 'Platform fee distribution',
                status: 'completed'
            },
            {
                user_id: adminUser.id,
                wallet_address: adminUser.wallet_address,
                amount: 3.8,
                source: 'trading_fee',
                description: 'Trading fee share',
                status: 'completed'
            },
            {
                user_id: testUser.id,
                wallet_address: testUser.wallet_address,
                amount: 0.42,
                source: 'ico_distribution',
                description: 'Monthly ICO distribution',
                status: 'completed'
            },
            {
                user_id: testUser.id,
                wallet_address: testUser.wallet_address,
                amount: 0.15,
                source: 'referral_bonus',
                description: 'Invite friend bonus',
                status: 'completed'
            }
        ]);
        
        console.log('✅ 收益记录已创建');
        
        // 创建交易记录
        await TradeRecord.bulkCreate([
            {
                user_id: testUser.id,
                wallet_address: testUser.wallet_address,
                bot_id: 'AlphaBot_001',
                asset_pair: 'ETH/USDT',
                trade_type: 'buy',
                amount: 1.5,
                price: 1950.50,
                total_value: 2925.75,
                fee: 2.92,
                roi: 8.5,
                status: 'executed',
                executed_at: new Date()
            },
            {
                user_id: testUser.id,
                wallet_address: testUser.wallet_address,
                bot_id: 'BetaBot_002',
                asset_pair: 'BTC/USDT',
                trade_type: 'sell',
                amount: 0.05,
                price: 67250.80,
                total_value: 3362.54,
                fee: 3.36,
                roi: 12.3,
                status: 'executed',
                executed_at: new Date(Date.now() - 86400000) // 1天前
            }
        ]);
        
        console.log('✅ 交易记录已创建');
        
        console.log('\n🎉 数据库初始化完成！');
        console.log('📊 数据库统计：');
        console.log(`   - 用户数: 2`);
        console.log(`   - ICO份额记录: 3`);
        console.log(`   - 收益记录: 4`);
        console.log(`   - 交易记录: 2`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    }
}

initializeDatabase();
