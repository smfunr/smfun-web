// 钱包连接后自动跳转到个人中心的逻辑

// 在首页钱包连接成功后跳转
function addWalletRedirect() {
    // 修改首页的钱包连接成功回调
    const indexContent = `async function connectWallet(walletType) {
                try {
                    if (typeof window.ethereum === 'undefined') {
                        alert(\`\${walletType} not detected. Please install the wallet extension.\`);
                        return;
                    }
                    
                    walletBtn.textContent = 'Connecting...';
                    walletBtn.style.background = '#333300';
                    walletBtn.style.color = '#ffff00';
                    
                    // Request account access
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    
                    if (accounts.length > 0) {
                        const account = accounts[0];
                        const shortAddress = \`\${account.substring(0, 6)}...\${account.substring(38)}\`;
                        
                        // Get balance
                        const balance = await window.ethereum.request({
                            method: 'eth_getBalance',
                            params: [account, 'latest']
                        });
                        
                        const ethBalance = (parseInt(balance) / 1e18).toFixed(4);
                        
                        // Update button with English text
                        walletBtn.textContent = \`\${shortAddress} (\${ethBalance} ETH)\`;
                        walletBtn.style.background = '#003300';
                        walletBtn.style.color = '#00ff00';
                        walletBtn.title = \`Connected with \${walletType}\\nBalance: \${ethBalance} ETH\`;
                        
                        // Save to localStorage
                        localStorage.setItem('smfun_wallet_account', account);
                        localStorage.setItem('smfun_wallet_chainId', await window.ethereum.request({ method: 'eth_chainId' }));
                        
                        // AUTO-REDIRECT TO PROFILE PAGE AFTER 2 SECONDS
                        setTimeout(() => {
                            window.location.href = 'profile.html';
                        }, 2000);
                        
                        // Show success message in chat
                        const chat = document.getElementById('chat');
                        const msg = document.createElement('div');
                        msg.className = 'chat-line';
                        msg.style.color = '#00ff00';
                        msg.innerHTML = \`✅ <strong>\${walletType}</strong> connected: \${shortAddress} (\${ethBalance} ETH)\\nRedirecting to profile...\`;
                        chat.appendChild(msg);
                        chat.scrollTop = chat.scrollHeight;
                        
                        // Listen for account changes
                        window.ethereum.on('accountsChanged', (newAccounts) => {
                            if (newAccounts.length > 0) {
                                const newAccount = newAccounts[0];
                                const newShortAddress = \`\${newAccount.substring(0, 6)}...\${newAccount.substring(38)}\`;
                                walletBtn.textContent = \`\${newShortAddress} (\${ethBalance} ETH)\`;
                                
                                const changeMsg = document.createElement('div');
                                changeMsg.className = 'chat-line';
                                changeMsg.style.color = '#ffff00';
                                changeMsg.textContent = \`🔄 Account changed to: \${newShortAddress}\`;
                                chat.appendChild(changeMsg);
                                chat.scrollTop = chat.scrollHeight;
                            } else {
                                walletBtn.textContent = 'Connect Wallet';
                                walletBtn.style.background = '#222';
                                walletBtn.style.color = '#00ff00';
                                walletBtn.title = '';
                            }
                        });
                        
                        // Listen for chain changes
                        window.ethereum.on('chainChanged', (chainId) => {
                            const chainMsg = document.createElement('div');
                            chainMsg.className = 'chat-line';
                            chainMsg.style.color = '#00ffff';
                            chainMsg.textContent = \`🔗 Network changed to: \${parseInt(chainId)}\`;
                            chat.appendChild(chainMsg);
                            chat.scrollTop = chat.scrollHeight;
                        });
                        
                    }
                } catch (error) {
                    console.error('Wallet connection error:', error);
                    walletBtn.textContent = 'Connect Wallet';
                    walletBtn.style.background = '#222';
                    walletBtn.style.color = '#00ff00';
                    
                    const chat = document.getElementById('chat');
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'chat-line';
                    errorMsg.style.color = '#ff0000';
                    errorMsg.textContent = \`❌ Wallet connection failed: \${error.message}\`;
                    chat.appendChild(errorMsg);
                    chat.scrollTop = chat.scrollHeight;
                }
            }`;
    
    return indexContent;
}

// 更新首页文件
const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

// 找到并替换connectWallet函数
const oldFunctionRegex = /async function connectWallet\(walletType\) \{[\s\S]*?\n\s*\}/;
const newFunction = addWalletRedirect();

if (indexHtml.match(oldFunctionRegex)) {
    indexHtml = indexHtml.replace(oldFunctionRegex, newFunction);
    fs.writeFileSync('index.html', indexHtml);
    console.log('✅ 首页钱包连接后自动跳转到个人中心已配置');
} else {
    console.log('❌ 未找到connectWallet函数');
}
