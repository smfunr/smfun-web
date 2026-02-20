// sm.fun API客户端
class SmFunAPI {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
    }
    
    // 健康检查
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'unhealthy', error: error.message };
        }
    }
    
    // 获取用户信息
    async getUser(walletAddress) {
        try {
            const response = await fetch(`${this.baseURL}/api/user/${walletAddress}`);
            return await response.json();
        } catch (error) {
            console.error('Get user failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取ICO统计
    async getICOStats() {
        try {
            const response = await fetch(`${this.baseURL}/api/ico/stats`);
            return await response.json();
        } catch (error) {
            console.error('Get ICO stats failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 购买ICO份额
    async buyICOShares(walletAddress, sharesCount) {
        try {
            const response = await fetch(`${this.baseURL}/api/ico/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    shares_count: sharesCount
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Buy ICO shares failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取交易统计
    async getTradingStats() {
        try {
            const response = await fetch(`${this.baseURL}/api/trading/stats`);
            return await response.json();
        } catch (error) {
            console.error('Get trading stats failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 执行交易
    async executeTrade(walletAddress, botId, assetPair, tradeType, amount, price) {
        try {
            const response = await fetch(`${this.baseURL}/api/trading/trade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    bot_id: botId,
                    asset_pair: assetPair,
                    trade_type: tradeType,
                    amount: amount,
                    price: price
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Execute trade failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取管理员仪表板
    async getAdminDashboard() {
        try {
            const response = await fetch(`${this.baseURL}/api/admin/dashboard`);
            return await response.json();
        } catch (error) {
            console.error('Get admin dashboard failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// 全局API实例
window.smFunAPI = new SmFunAPI();
