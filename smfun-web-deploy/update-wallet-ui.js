// Update wallet UI to use real connections
document.addEventListener('DOMContentLoaded', () => {
    // Update wallet dropdown to use real connections
    const walletOptions = document.querySelectorAll('.wallet-option');
    
    walletOptions.forEach(option => {
        const walletId = option.dataset.wallet;
        option.onclick = async () => {
            const result = await window.SmFunWallet.connectWallet(walletId);
            
            if (result.success) {
                // Close dropdown
                const menu = option.closest('.wallet-menu');
                if (menu) menu.classList.remove('show');
                
                // Update chat with real connection info
                const chat = document.getElementById('chat');
                if (chat) {
                    const msg = document.createElement('div');
                    msg.className = 'chat-line';
                    msg.style.color = '#00ff00';
                    msg.textContent = `✅ Wallet connected: ${result.wallet} (${result.account.substring(0,8)}...) ${result.balance} ETH`;
                    chat.appendChild(msg);
                    chat.scrollTop = chat.scrollHeight;
                }
                
                // Enable ICO buy button if on ICO page
                const buyBtn = document.querySelector('button');
                if (buyBtn && buyBtn.textContent.includes('CONNECT WALLET')) {
                    buyBtn.textContent = `BUY WITH ${result.wallet.toUpperCase()}`;
                    buyBtn.style.background = 'linear-gradient(90deg, #00ff00, #00ffff)';
                    buyBtn.onclick = () => {
                        // Real transaction would go here
                        alert(`Ready to buy parts with ${result.wallet}\nAccount: ${result.account}\nBalance: ${result.balance} ETH`);
                    };
                }
            } else {
                // Show error
                alert(`Connection failed: ${result.error}`);
            }
        };
    });
    
    // Update disconnect functionality
    const walletBtns = document.querySelectorAll('.wallet-btn');
    walletBtns.forEach(btn => {
        // Add disconnect on double-click
        btn.ondblclick = () => {
            if (window.SmFunWallet.account) {
                if (confirm('Disconnect wallet?')) {
                    window.SmFunWallet.disconnect();
                }
            }
        };
    });
    
    // Check for auto-connection
    setTimeout(() => {
        if (window.SmFunWallet.account) {
            console.log('Auto-connected wallet:', window.SmFunWallet.getWalletInfo());
        }
    }, 1000);
});
