// sm.fun 前端 API 集成
class SmFunAPI {
    constructor(baseURL = 'https://api.sm.fun') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('smfun_token');
        this.user = JSON.parse(localStorage.getItem('smfun_user') || 'null');
    }

    // 设置认证令牌
    setToken(token) {
        this.token = token;
        localStorage.setItem('smfun_token', token);
    }

    // 设置用户信息
    setUser(user) {
        this.user = user;
        localStorage.setItem('smfun_user', JSON.stringify(user));
    }

    // 清除认证
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('smfun_token');
        localStorage.removeItem('smfun_user');
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API 请求错误:', error);
            throw error;
        }
    }

    // 用户认证
    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.success) {
            this.setToken(data.token);
            this.setUser(data.user);
        }

        return data;
    }

    async walletLogin(walletAddress, signature, message) {
        const data = await this.request('/api/auth/wallet-login', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, signature, message })
        });

        if (data.success) {
            this.setToken(data.token);
            this.setUser(data.user);
        }

        return data;
    }

    async logout() {
        await this.request('/api/auth/logout', {
            method: 'POST'
        });
        this.clearAuth();
    }

    async getCurrentUser() {
        if (!this.token) return null;
        
        try {
            const data = await this.request('/api/auth/me');
            return data.user;
        } catch (error) {
            this.clearAuth();
            return null;
        }
    }

    // 用户管理
    async updateProfile(profileData) {
        return this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(oldPassword, newPassword) {
        return this.request('/api/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
    }

    // 钱包管理
    async getWalletBalance() {
        return this.request('/api/wallet/balance');
    }

    async getWalletTransactions(page = 1, limit = 20) {
        return this.request(`/api/wallet/transactions?page=${page}&limit=${limit}`);
    }

    async withdrawFunds(amount, address) {
        return this.request('/api/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount, address })
        });
    }

    // ICO 功能
    async getICOInfo() {
        return this.request('/api/ico/info');
    }

    async buyParts(amount) {
        return this.request('/api/ico/buy', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }

    async getMyParts() {
        return this.request('/api/ico/my-parts');
    }

    async getICOParticipants(page = 1, limit = 20) {
        return this.request(`/api/ico/participants?page=${page}&limit=${limit}`);
    }

    // 交易功能
    async getMarketData() {
        return this.request('/api/transactions/market');
    }

    async placeOrder(orderData) {
        return this.request('/api/transactions/order', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getMyOrders(status = 'all', page = 1, limit = 20) {
        return this.request(`/api/transactions/orders?status=${status}&page=${page}&limit=${limit}`);
    }

    async getTransactionHistory(page = 1, limit = 20) {
        return this.request(`/api/transactions/history?page=${page}&limit=${limit}`);
    }

    // 邀请系统
    async getInviteInfo() {
        return this.request('/api/users/invite');
    }

    async getInviteTree() {
        return this.request('/api/users/invite-tree');
    }

    // 管理员功能
    async adminLogin(email, password) {
        const data = await this.request('/api/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.success) {
            this.setToken(data.token);
            this.setUser({ ...data.admin, role: 'admin' });
        }

        return data;
    }

    async getAdminStats() {
        return this.request('/api/admin/stats');
    }

    async getAdminUsers(page = 1, limit = 20, filters = {}) {
        const query = new URLSearchParams({ page, limit, ...filters }).toString();
        return this.request(`/api/admin/users?${query}`);
    }

    async updateUserStatus(userId, status) {
        return this.request(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async getAdminTransactions(page = 1, limit = 20, filters = {}) {
        const query = new URLSearchParams({ page, limit, ...filters }).toString();
        return this.request(`/api/admin/transactions?${query}`);
    }

    async getAdminICOStats() {
        return this.request('/api/admin/ico-stats');
    }

    // 系统状态
    async getSystemHealth() {
        return this.request('/health');
    }
}

// 全局 API 实例
window.SmFunAPI = new SmFunAPI();

// 自动检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
    const api = window.SmFunAPI;
    
    // 检查是否有令牌
    if (api.token) {
        try {
            const user = await api.getCurrentUser();
            if (user) {
                console.log('用户已登录:', user.email);
                
                // 更新 UI
                updateUIForLoggedInUser(user);
            } else {
                api.clearAuth();
            }
        } catch (error) {
            api.clearAuth();
        }
    }
});

// 更新 UI 显示登录状态
function updateUIForLoggedInUser(user) {
    // 更新导航栏
    const loginButtons = document.querySelectorAll('.login-btn, .register-btn');
    const userButtons = document.querySelectorAll('.user-btn, .profile-btn');
    
    loginButtons.forEach(btn => btn.style.display = 'none');
    userButtons.forEach(btn => {
        btn.style.display = 'inline-block';
        if (btn.classList.contains('user-btn')) {
            btn.textContent = user.username || user.email.substring(0, 10) + '...';
        }
    });
    
    // 更新钱包显示
    if (user.walletAddress) {
        const walletElements = document.querySelectorAll('.wallet-address');
        walletElements.forEach(el => {
            el.textContent = `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}`;
            el.title = user.walletAddress;
        });
    }
    
    // 更新会员等级显示
    if (user.membershipLevel) {
        const levelElements = document.querySelectorAll('.membership-level');
        levelElements.forEach(el => {
            el.textContent = user.membershipLevel.toUpperCase();
            el.className = `membership-level level-${user.membershipLevel}`;
        });
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmFunAPI;
}
