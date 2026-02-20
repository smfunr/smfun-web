const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP限制100个请求
});
app.use('/api/', limiter);

// 内存数据库
const users = [
    {
        id: 1,
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168',
        username: 'Admin',
        email: 'smfunr@gmail.com',
        membership_level: 'king',
        total_shares: 1000,
        total_investment: 100,
        total_profits: 25.5,
        invite_code: 'SMF-ADMIN',
        invite_count: 50,
        invite_earnings: 5.2,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
        username: 'TestUser_123',
        membership_level: 'gold',
        total_shares: 85,
        total_investment: 8.5,
        total_profits: 1.2,
        invite_code: 'SMF-TEST1',
        invite_count: 3,
        invite_earnings: 0.15,
        created_at: new Date().toISOString()
    }
];

const icoShares = [
    {
        id: 1,
        user_id: 1,
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168',
        shares_count: 500,
        eth_amount: 50,
        status: 'confirmed',
        purchase_date: new Date().toISOString()
    },
    {
        id: 2,
        user_id: 1,
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168',
        shares_count: 500,
        eth_amount: 50,
        status: 'confirmed',
        purchase_date: new Date().toISOString()
    },
    {
        id: 3,
        user_id: 2,
        wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
        shares_count: 85,
        eth_amount: 8.5,
        status: 'confirmed',
        purchase_date: new Date().toISOString()
    }
];

const profitRecords = [
    {
        id: 1,
        user_id: 1,
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168',
        amount: 5.2,
        source: 'platform_revenue',
        description: 'Platform fee distribution',
        status: 'completed',
        distribution_date: new Date().toISOString()
    },
    {
        id: 2,
        user_id: 1,
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168',
        amount: 3.8,
        source: 'trading_fee',
        description: 'Trading fee share',
        status: 'completed',
        distribution_date: new Date().toISOString()
    },
    {
        id: 3,
        user_id: 2,
        wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
        amount: 0.42,
        source: 'ico_distribution',
        description: 'Monthly ICO distribution',
        status: 'completed',
        distribution_date: new Date().toISOString()
    },
    {
        id: 4,
        user_id: 2,
        wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
        amount: 0.15,
        source: 'referral_bonus',
        description: 'Invite friend bonus',
        status: 'completed',
        distribution_date: new Date().toISOString()
    }
];

const tradeRecords = [
    {
        id: 1,
        user_id: 2,
        wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
        bot_id: 'AlphaBot_001',
        asset_pair: 'ETH/USDT',
        trade_type: 'buy',
        amount: 1.5,
        price: 1950.50,
        total_value: 2925.75,
        fee: 2.92,
        roi: 8.5,
        status: 'executed',
        executed_at: new Date().toISOString()
    },
    {
        id: 2,
        user_id: 2,
        wallet_address: '0x8f3a4c2d1e5b6a7c9d0f1e2a3b4c5d6e7f8a9b0',
        bot_id: 'BetaBot_002',
        asset_pair: 'BTC/USDT',
        trade_type: 'sell',
        amount: 0.05,
        price: 67250.80,
        total_value: 3362.54,
        fee: 3.36,
        roi: 12.3,
        status: 'executed',
        executed_at: new Date(Date.now() - 86400000).toISOString()
    }
];

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'sm.fun API',
        version: '1.0.0'
    });
});

// 用户API
app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        count: users.length,
        users: users.map(user => ({
            id: user.id,
            wallet_address: user.wallet_address,
            username: user.username,
            membership_level: user.membership_level,
            total_shares: user.total_shares,
            total_investment: user.total_investment,
            total_profits: user.total_profits,
            invite_code: user.invite_code,
            invite_count: user.invite_count,
            invite_earnings: user.invite_earnings,
            created_at: user.created_at
        }))
    });
});

// 根据钱包地址获取用户
app.get('/api/user/:walletAddress', (req, res) => {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const user = users.find(u => u.wallet_address.toLowerCase() === walletAddress);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    // 获取用户的ICO份额
    const userShares = icoShares.filter(share => share.user_id === user.id);
    
    // 获取用户的收益记录
    const userProfits = profitRecords.filter(profit => profit.user_id === user.id);
    
    // 获取用户的交易记录
    const userTrades = tradeRecords.filter(trade => trade.user_id === user.id);
    
    res.json({
        success: true,
        user: {
            id: user.id,
            wallet_address: user.wallet_address,
            username: user.username,
            membership_level: user.membership_level,
            total_shares: user.total_shares,
            total_investment: user.total_investment,
            total_profits: user.total_profits,
            invite_code: user.invite_code,
            invite_count: user.invite_count,
            invite_earnings: user.invite_earnings,
            created_at: user.created_at
        },
        shares: userShares,
        profits: userProfits,
        trades: userTrades
    });
});

// ICO API
app.get('/api/ico/stats', (req, res) => {
    const totalShares = icoShares.reduce((sum, share) => sum + share.shares_count, 0);
    const totalETH = icoShares.reduce((sum, share) => sum + share.eth_amount, 0);
    const totalParticipants = new Set(icoShares.map(share => share.user_id)).size;
    
    res.json({
        success: true,
        stats: {
            total_shares: totalShares,
            total_eth: totalETH,
            total_participants: totalParticipants,
            max_shares: 10000,
            progress_percentage: (totalShares / 10000 * 100).toFixed(2)
        },
        recent_purchases: icoShares.slice(-10).reverse()
    });
});

// 购买ICO份额
app.post('/api/ico/buy', (req, res) => {
    const { wallet_address, shares_count } = req.body;
    
    if (!wallet_address || !shares_count) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }
    
    // 查找用户
    let user = users.find(u => u.wallet_address.toLowerCase() === wallet_address.toLowerCase());
    
    // 如果用户不存在，创建新用户
    if (!user) {
        const newUserId = users.length + 1;
        const inviteCode = `SMF-${wallet_address.substring(2, 8).toUpperCase()}`;
        
        user = {
            id: newUserId,
            wallet_address: wallet_address,
            username: `User_${wallet_address.substring(2, 6)}`,
            membership_level: 'bronze',
            total_shares: 0,
            total_investment: 0,
            total_profits: 0,
            invite_code: inviteCode,
            invite_count: 0,
            invite_earnings: 0,
            created_at: new Date().toISOString()
        };
        
        users.push(user);
    }
    
    // 计算ETH金额（1 share = 0.1 ETH）
    const ethAmount = shares_count * 0.1;
    
    // 创建ICO份额记录
    const newShare = {
        id: icoShares.length + 1,
        user_id: user.id,
        wallet_address: wallet_address,
        shares_count: shares_count,
        eth_amount: ethAmount,
        status: 'confirmed',
        purchase_date: new Date().toISOString()
    };
    
    icoShares.push(newShare);
    
    // 更新用户信息
    user.total_shares += shares_count;
    user.total_investment += ethAmount;
    
    // 更新会员等级
    updateMembershipLevel(user);
    
    res.json({
        success: true,
        message: 'ICO shares purchased successfully',
        purchase: newShare,
        user: {
            total_shares: user.total_shares,
            total_investment: user.total_investment,
            membership_level: user.membership_level
        }
    });
});

// 更新会员等级
function updateMembershipLevel(user) {
    const total = user.total_shares;
    
    if (total >= 500) {
        user.membership_level = 'king';
    } else if (total >= 200) {
        user.membership_level = 'platinum';
    } else if (total >= 50) {
        user.membership_level = 'gold';
    } else if (total >= 10) {
        user.membership_level = 'silver';
    } else {
        user.membership_level = 'bronze';
    }
}

// 交易API
app.get('/api/trading/stats', (req, res) => {
    const totalTrades = tradeRecords.length;
    const totalVolume = tradeRecords.reduce((sum, trade) => sum + trade.total_value, 0);
    const totalFees = tradeRecords.reduce((sum, trade) => sum + trade.fee, 0);
    const avgROI = tradeRecords.reduce((sum, trade) => sum + (trade.roi || 0), 0) / totalTrades;
    
    res.json({
        success: true,
        stats: {
            total_trades: totalTrades,
            total_volume: totalVolume,
            total_fees: totalFees,
            avg_roi: avgROI.toFixed(2),
            active_bots: new Set(tradeRecords.map(trade => trade.bot_id)).size
        },
        recent_trades: tradeRecords.slice(-5).reverse()
    });
});

// 创建新交易
app.post('/api/trading/trade', (req, res) => {
    const { wallet_address, bot_id, asset_pair, trade_type, amount, price } = req.body;
    
    if (!wallet_address || !bot_id || !asset_pair || !trade_type || !amount || !price) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }
    
    const totalValue = amount * price;
    const fee = totalValue * 0.001; // 0.1% 手续费
    const roi = (Math.random() * 20 - 5).toFixed(2); // 模拟ROI
    
    const newTrade = {
        id: tradeRecords.length + 1,
        user_id: 2, // 模拟用户ID
        wallet_address: wallet_address,
        bot_id: bot_id,
        asset_pair: asset_pair,
        trade_type: trade_type,
        amount: amount,
        price: price,
        total_value: totalValue,
        fee: fee,
        roi: parseFloat(roi),
        status: 'executed',
        executed_at: new Date().toISOString()
    };
    
    tradeRecords.push(newTrade);
    
    res.json({
        success: true,
        message: 'Trade executed successfully',
        trade: newTrade
    });
});

// 管理员API
app.get('/api/admin/dashboard', (req, res) => {
    // 验证管理员（简化版）
    const adminWallet = '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168';
    
    const totalUsers = users.length;
    const totalICO = icoShares.reduce((sum, share) => sum + share.eth_amount, 0);
    const totalTradingVolume = tradeRecords.reduce((sum, trade) => sum + trade.total_value, 0);
    const totalFees = tradeRecords.reduce((sum, trade) => sum + trade.fee, 0);
    
    res.json({
        success: true,
        dashboard: {
            total_users: totalUsers,
            total_ico_eth: totalICO,
            total_trading_volume: totalTradingVolume,
            total_fees: totalFees,
            active_today: tradeRecords.filter(trade => 
                new Date(trade.executed_at).toDateString() === new Date().toDateString()
            ).length
        },
        recent_activity: {
            new_users: users.slice(-5).reverse(),
            recent_purchases: icoShares.slice(-5).reverse(),
            recent_trades: tradeRecords.slice(-5).reverse()
        }
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 sm.fun API服务器启动成功`);
    console.log(`📡 地址: http://localhost:${PORT}`);
    console.log(`🔧 环境: development`);
    console.log(`📊 健康检查: http://localhost:${PORT}/health`);
    console.log(`👥 用户API: http://localhost:${PORT}/api/users`);
    console.log(`🚀 ICO API: http://localhost:${PORT}/api/ico/stats`);
    console.log(`🤖 交易API: http://localhost:${PORT}/api/trading/stats`);
    console.log(`⚙️ 管理API: http://localhost:${PORT}/api/admin/dashboard`);
});
