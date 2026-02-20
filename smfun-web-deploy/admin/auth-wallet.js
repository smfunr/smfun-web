// 后台钱包认证系统
class AdminWalletAuth {
    constructor() {
        this.adminWallets = [
            '0x742d35Cc6634C0532925a3b844Bc9e90F1b6c168', // 示例管理员地址
            // 添加更多管理员地址
        ];
    }
    
    // 检查是否已登录
    checkAuth() {
        try {
            const session = localStorage.getItem('admin_wallet_session');
            if (!session) return false;
            
            const sessionData = JSON.parse(session);
            
            // 检查会话有效期（24小时）
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                this.logout();
                return false;
            }
            
            // 检查钱包地址是否是管理员
            const isAdmin = this.adminWallets.some(adminAddr => 
                adminAddr.toLowerCase() === sessionData.address.toLowerCase()
            );
            
            if (!isAdmin) {
                this.logout();
                return false;
            }
            
            return sessionData;
            
        } catch (error) {
            this.logout();
            return false;
        }
    }
    
    // 登出
    logout() {
        localStorage.removeItem('admin_wallet_session');
        window.location.href = 'login.html';
    }
    
    // 获取当前用户信息
    getCurrentUser() {
        const session = this.checkAuth();
        if (!session) return null;
        
        return {
            address: session.address,
            wallet: session.wallet,
            balance: session.balance,
            loginTime: session.loginTime
        };
    }
    
    // 更新用户显示
    updateUserDisplay() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        // 更新页面上的用户信息
        const userElements = document.querySelectorAll('.admin-address, .user-address');
        userElements.forEach(el => {
            el.textContent = `${user.address.substring(0, 6)}...${user.address.substring(38)}`;
            el.title = user.address;
        });
        
        // 更新余额显示
        const balanceElements = document.querySelectorAll('.admin-balance, .user-balance');
        balanceElements.forEach(el => {
            el.textContent = `${user.balance} ETH`;
        });
        
        // 更新登录时间
        const timeElements = document.querySelectorAll('.login-time');
        timeElements.forEach(el => {
            const loginTime = new Date(user.loginTime);
            el.textContent = loginTime.toLocaleString();
        });
    }
    
    // 初始化认证检查
    init() {
        // 检查认证状态
        const isAuthenticated = this.checkAuth();
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return false;
        }
        
        // 更新用户显示
        this.updateUserDisplay();
        
        // 设置登出按钮
        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', () => this.logout());
        });
        
        // 监听钱包变化
        this.setupWalletListeners();
        
        return true;
    }
    
    // 设置钱包监听器
    setupWalletListeners() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    // 用户断开连接
                    this.logout();
                } else {
                    // 检查新账户是否是管理员
                    const user = this.getCurrentUser();
                    const newAddress = accounts[0];
                    
                    if (user && user.address.toLowerCase() !== newAddress.toLowerCase()) {
                        // 账户变化，需要重新认证
                        this.logout();
                    }
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                // 链变化时刷新页面
                window.location.reload();
            });
        }
    }
    
    // 检查钱包连接状态
    async checkWalletConnection() {
        try {
            const user = this.getCurrentUser();
            if (!user) return false;
            
            // 检查钱包是否仍然连接
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_accounts' 
                });
                
                if (accounts.length === 0) {
                    this.logout();
                    return false;
                }
                
                const currentAddress = accounts[0];
                if (currentAddress.toLowerCase() !== user.address.toLowerCase()) {
                    this.logout();
                    return false;
                }
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Wallet connection check failed:', error);
            return false;
        }
    }
    
    // 定期检查钱包连接
    startConnectionMonitor() {
        // 每30秒检查一次钱包连接
        setInterval(() => {
            this.checkWalletConnection();
        }, 30000);
    }
}

// 创建全局认证实例
window.AdminAuth = new AdminWalletAuth();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 在登录页面不检查认证
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // 初始化认证
    const initialized = window.AdminAuth.init();
    
    if (initialized) {
        // 启动连接监控
        window.AdminAuth.startConnectionMonitor();
        
        // 更新页面标题显示用户
        const user = window.AdminAuth.getCurrentUser();
        if (user) {
            document.title = `sm.fun Admin - ${user.address.substring(0, 8)}...`;
        }
    }
});
