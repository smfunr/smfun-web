const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'admin');
const pages = ['dashboard', 'users', 'wallet', 'ico', 'transactions', 'config'];

// 先添加认证脚本到所有页面
pages.forEach(page => {
    const filePath = path.join(adminDir, `${page}.html`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 在第一个script标签前添加认证脚本
    content = content.replace('<script>', '<script src="auth-wallet.js"></script>\n    <script>');
    
    // 更新用户显示
    content = content.replace(
        '<div style="font-weight: bold;" id="admin-email">smfunr@gmail.com</div>',
        '<div style="font-weight: bold;" class="admin-address">Connecting...</div>'
    );
    
    content = content.replace(
        '<div style="font-size: 12px; color: #888;">Super Admin</div>',
        '<div style="font-size: 12px; color: #888;">Wallet Admin</div>'
    );
    
    // 添加余额显示
    content = content.replace(
        '</div>\n            <div class="user-badge">OWNER</div>',
        '</div>\n            <div style="font-size: 12px; color: #00ffff; margin-top: 2px;" class="admin-balance">0 ETH</div>\n            <div class="user-badge">OWNER</div>'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${page}.html`);
});

console.log('🎉 All admin pages updated with wallet authentication!');
