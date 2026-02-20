// 更新ICO页面钱包连接后跳转

const fs = require('fs');
let icoHtml = fs.readFileSync('ico.html', 'utf8');

// 在ICO页面的connectWallet函数中添加跳转逻辑
const redirectCode = `
                        // AUTO-REDIRECT TO PROFILE PAGE AFTER SUCCESSFUL CONNECTION
                        setTimeout(() => {
                            window.location.href = 'profile.html';
                        }, 2000);`;

// 在保存到localStorage后添加跳转代码
const saveStorageCode = `// Save to localStorage
                        localStorage.setItem('smfun_wallet_account', account);
                        localStorage.setItem('smfun_wallet_chainId', await window.ethereum.request({ method: 'eth_chainId' }));`;

// 在保存代码后添加跳转
if (icoHtml.includes(saveStorageCode)) {
    const newCode = saveStorageCode + redirectCode;
    icoHtml = icoHtml.replace(saveStorageCode, newCode);
    
    // 同时更新成功消息
    icoHtml = icoHtml.replace(
        'alert(`Wallet connected: ${this.account.substring(0, 6)}...${this.account.substring(38)}`);',
        'alert(`Wallet connected! Redirecting to profile...`);'
    );
    
    fs.writeFileSync('ico.html', icoHtml);
    console.log('✅ ICO页面钱包连接后自动跳转到个人中心已配置');
} else {
    console.log('❌ 未找到保存localStorage的代码');
}
