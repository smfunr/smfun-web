// 真实钱包连接代码
const realWalletCode = `
        // Real Wallet Connection - English Interface
        document.addEventListener('DOMContentLoaded', () => {
            const walletBtn = document.getElementById('wallet-btn');
            const walletMenu = document.getElementById('wallet-menu');
            
            // Toggle wallet menu
            walletBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                walletMenu.classList.toggle('show');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', () => {
                walletMenu.classList.remove('show');
            });
            
            // Wallet selection - English labels
            document.querySelectorAll('.wallet-option').forEach(option => {
                option.addEventListener('click', async () => {
                    const wallet = option.dataset.wallet;
                    await connectWallet(wallet);
                    walletMenu.classList.remove('show');
                });
            });
            
            // Real wallet connection using EIP-1193
            async function connectWallet(walletType) {
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
                        
                        // Show success message in chat
                        const chat = document.getElementById('chat');
                        const msg = document.createElement('div');
                        msg.className = 'chat-line';
                        msg.style.color = '#00ff00';
                        msg.innerHTML = \`✅ <strong>\${walletType}</strong> connected: \${shortAddress} (\${ethBalance} ETH)\`;
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
                        
                        // Save to localStorage
                        localStorage.setItem('smfun_wallet_account', account);
                        localStorage.setItem('smfun_wallet_chainId', await window.ethereum.request({ method: 'eth_chainId' }));
                        
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
            }
            
            // Check for previous connection
            const savedAccount = localStorage.getItem('smfun_wallet_account');
            if (savedAccount) {
                const shortAddress = \`\${savedAccount.substring(0, 6)}...\${savedAccount.substring(38)}\`;
                walletBtn.textContent = \`\${shortAddress}\`;
                walletBtn.style.background = '#003300';
                walletBtn.style.color = '#00ff00';
                walletBtn.title = 'Previously connected - click to reconnect';
            }
        });
`;

// 读取并更新index.html
const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 替换钱包连接部分
const oldWalletCode = content.match(/\/\/ Wallet connection logic[\s\S]*?\/\/ Price display logic/);
if (oldWalletCode) {
    content = content.replace(oldWalletCode[0], realWalletCode + '\n\n        // Price display logic');
    fs.writeFileSync('index.html', content);
    console.log('✅ 首页钱包连接已更新为真实功能（英文界面）');
} else {
    console.log('❌ 未找到钱包连接代码位置');
}
