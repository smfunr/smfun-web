// Real wallet connection for sm.fun
// Supports: MetaMask, OKX Wallet, WalletConnect, Coinbase, Phantom

class RealWalletConnector {
    constructor() {
        this.connectedWallet = null;
        this.account = null;
        this.chainId = null;
        this.balance = null;
        this.provider = null;
        
        // Supported wallets
        this.supportedWallets = {
            metamask: {
                name: 'MetaMask',
                icon: '🦊',
                installUrl: 'https://metamask.io/download/',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask
            },
            okx: {
                name: 'OKX Wallet',
                icon: '🔶',
                installUrl: 'https://www.okx.com/web3',
                check: () => typeof window.okxwallet !== 'undefined'
            },
            walletconnect: {
                name: 'WalletConnect',
                icon: '⚡',
                installUrl: 'https://walletconnect.com/',
                check: () => true // Always available via QR code
            },
            coinbase: {
                name: 'Coinbase Wallet',
                icon: '🔵',
                installUrl: 'https://www.coinbase.com/wallet',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet
            },
            phantom: {
                name: 'Phantom',
                icon: '👻',
                installUrl: 'https://phantom.app/',
                check: () => typeof window.solana !== 'undefined' && window.solana.isPhantom
            }
        };
    }

    // Initialize wallet connection
    async init() {
        // Check for installed wallets
        this.detectInstalledWallets();
        
        // Auto-connect if previously connected
        await this.autoConnect();
        
        // Listen for account/chain changes
        this.setupEventListeners();
    }

    // Detect installed wallets
    detectInstalledWallets() {
        const installed = [];
        
        for (const [id, wallet] of Object.entries(this.supportedWallets)) {
            if (wallet.check()) {
                installed.push({
                    id,
                    name: wallet.name,
                    icon: wallet.icon,
                    installed: true
                });
            }
        }
        
        return installed;
    }

    // Connect to specific wallet
    async connectWallet(walletId) {
        try {
            const wallet = this.supportedWallets[walletId];
            if (!wallet) {
                throw new Error(`Wallet ${walletId} not supported`);
            }

            // Check if wallet is installed
            if (!wallet.check() && walletId !== 'walletconnect') {
                window.open(wallet.installUrl, '_blank');
                throw new Error(`${wallet.name} not installed. Opening download page...`);
            }

            let provider;
            
            switch (walletId) {
                case 'metamask':
                case 'coinbase':
                    provider = window.ethereum;
                    break;
                case 'okx':
                    provider = window.okxwallet;
                    break;
                case 'phantom':
                    provider = window.solana;
                    break;
                case 'walletconnect':
                    provider = await this.connectWalletConnect();
                    break;
                default:
                    throw new Error('Unknown wallet');
            }

            // Request account access
            const accounts = await provider.request({ 
                method: 'eth_requestAccounts' 
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Get chain ID
            const chainId = await provider.request({ 
                method: 'eth_chainId' 
            });

            // Get balance
            const balance = await provider.request({
                method: 'eth_getBalance',
                params: [accounts[0], 'latest']
            });

            // Update state
            this.connectedWallet = walletId;
            this.account = accounts[0];
            this.chainId = parseInt(chainId);
            this.balance = this.formatBalance(balance);
            this.provider = provider;

            // Save to localStorage
            this.saveConnection();

            // Update UI
            this.updateUI();

            // Dispatch event
            this.dispatchEvent('walletConnected', {
                wallet: walletId,
                account: this.account,
                chainId: this.chainId,
                balance: this.balance
            });

            return {
                success: true,
                wallet: wallet.name,
                account: this.account,
                chainId: this.chainId,
                balance: this.balance
            };

        } catch (error) {
            console.error('Wallet connection failed:', error);
            
            this.dispatchEvent('walletError', {
                wallet: walletId,
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    // WalletConnect integration
    async connectWalletConnect() {
        // In production, use @walletconnect/web3-provider
        // For now, simulate or use simple implementation
        throw new Error('WalletConnect integration requires additional setup. Please use MetaMask or OKX Wallet for now.');
    }

    // Auto-connect from localStorage
    async autoConnect() {
        const saved = localStorage.getItem('smfun_wallet_connection');
        if (!saved) return false;

        try {
            const { walletId, account, timestamp } = JSON.parse(saved);
            
            // Check if connection is recent (within 24 hours)
            const hoursAgo = (Date.now() - timestamp) / (1000 * 60 * 60);
            if (hoursAgo > 24) {
                localStorage.removeItem('smfun_wallet_connection');
                return false;
            }

            // Check if wallet is still available
            const wallet = this.supportedWallets[walletId];
            if (!wallet || !wallet.check()) {
                return false;
            }

            // Try to reconnect
            const result = await this.connectWallet(walletId);
            return result.success;

        } catch (error) {
            localStorage.removeItem('smfun_wallet_connection');
            return false;
        }
    }

    // Disconnect wallet
    disconnect() {
        const previousAccount = this.account;
        
        this.connectedWallet = null;
        this.account = null;
        this.chainId = null;
        this.balance = null;
        this.provider = null;
        
        localStorage.removeItem('smfun_wallet_connection');
        
        this.updateUI();
        
        this.dispatchEvent('walletDisconnected', {
            previousAccount
        });
    }

    // Save connection to localStorage
    saveConnection() {
        const connection = {
            walletId: this.connectedWallet,
            account: this.account,
            timestamp: Date.now()
        };
        
        localStorage.setItem('smfun_wallet_connection', JSON.stringify(connection));
    }

    // Format balance from wei to ETH
    formatBalance(balanceWei) {
        if (!balanceWei) return '0';
        
        const wei = BigInt(balanceWei);
        const eth = Number(wei) / 1e18;
        
        if (eth >= 1) {
            return eth.toFixed(4);
        } else if (eth >= 0.001) {
            return eth.toFixed(6);
        } else {
            return eth.toFixed(8);
        }
    }

    // Update UI elements
    updateUI() {
        // Update wallet button
        const walletButtons = document.querySelectorAll('.wallet-btn, #wallet-btn, #wallet-btn-ico');
        
        walletButtons.forEach(btn => {
            if (this.account) {
                // Shorten address: 0x1234...5678
                const shortAddress = this.account.substring(0, 6) + '...' + this.account.substring(38);
                btn.textContent = shortAddress;
                btn.title = `Connected: ${this.account}\nBalance: ${this.balance} ETH`;
                btn.style.background = '#003300';
                btn.style.color = '#00ff00';
            } else {
                btn.textContent = 'Connect Wallet';
                btn.title = 'Connect your wallet';
                btn.style.background = '';
                btn.style.color = '';
            }
        });

        // Update wallet info display
        const infoElements = document.querySelectorAll('.wallet-info');
        infoElements.forEach(el => {
            if (this.account) {
                const wallet = this.supportedWallets[this.connectedWallet];
                el.innerHTML = `
                    <div style="font-size: 12px;">
                        <div>${wallet?.icon || ''} ${wallet?.name || 'Wallet'}</div>
                        <div style="color: #888; font-size: 10px;">${this.account}</div>
                        <div style="color: #00ffff; font-size: 11px;">${this.balance} ETH</div>
                    </div>
                `;
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.provider) return;

        // Account changed
        if (this.provider.on) {
            this.provider.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accounts[0];
                    this.saveConnection();
                    this.updateUI();
                    this.dispatchEvent('accountsChanged', { accounts });
                }
            });

            // Chain changed
            this.provider.on('chainChanged', (chainId) => {
                this.chainId = parseInt(chainId);
                this.updateUI();
                this.dispatchEvent('chainChanged', { chainId });
            });

            // Disconnect
            this.provider.on('disconnect', () => {
                this.disconnect();
            });
        }
    }

    // Dispatch custom events
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(`smfun:${eventName}`, { detail });
        window.dispatchEvent(event);
    }

    // Get wallet info
    getWalletInfo() {
        return {
            connected: !!this.account,
            wallet: this.connectedWallet,
            account: this.account,
            chainId: this.chainId,
            balance: this.balance,
            provider: this.provider
        };
    }

    // Sign message (for authentication)
    async signMessage(message) {
        if (!this.account || !this.provider) {
            throw new Error('Wallet not connected');
        }

        try {
            const signature = await this.provider.request({
                method: 'personal_sign',
                params: [message, this.account]
            });

            return {
                success: true,
                signature,
                message,
                account: this.account
            };
        } catch (error) {
            console.error('Message signing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Send transaction
    async sendTransaction(to, value, data = '0x') {
        if (!this.account || !this.provider) {
            throw new Error('Wallet not connected');
        }

        try {
            const txHash = await this.provider.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.account,
                    to: to,
                    value: value,
                    data: data
                }]
            });

            return {
                success: true,
                txHash,
                from: this.account,
                to,
                value
            };
        } catch (error) {
            console.error('Transaction failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Initialize global wallet connector
window.SmFunWallet = new RealWalletConnector();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.SmFunWallet.init().catch(console.error);
    
    // Add wallet info display to pages
    addWalletInfoDisplay();
});

// Add wallet info display to pages
function addWalletInfoDisplay() {
    // Check if wallet info display already exists
    if (document.querySelector('.wallet-info-global')) return;
    
    // Create wallet info display
    const infoDiv = document.createElement('div');
    infoDiv.className = 'wallet-info-global';
    infoDiv.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #111;
        border: 1px solid #00ff00;
        border-radius: 8px;
        padding: 10px;
        font-size: 12px;
        color: #00ff00;
        z-index: 10000;
        display: none;
        max-width: 300px;
    `;
    
    document.body.appendChild(infoDiv);
}

// Update wallet info display
function updateWalletInfoDisplay(info) {
    const display = document.querySelector('.wallet-info-global');
    if (!display) return;
    
    if (info.connected) {
        const wallet = window.SmFunWallet.supportedWallets[info.wallet];
        display.innerHTML = `
            <div style="margin-bottom: 5px;">
                <strong>${wallet?.icon || ''} ${wallet?.name || 'Wallet'}</strong>
            </div>
            <div style="font-size: 10px; color: #888; margin-bottom: 3px;">
                ${info.account}
            </div>
            <div style="color: #00ffff;">
                ${info.balance} ETH
            </div>
            <div style="margin-top: 5px;">
                <button onclick="window.SmFunWallet.disconnect()" style="
                    background: #333;
                    color: #ff0000;
                    border: 1px solid #ff0000;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    cursor: pointer;
                ">Disconnect</button>
            </div>
        `;
        display.style.display = 'block';
    } else {
        display.style.display = 'none';
    }
}

// Listen for wallet events
window.addEventListener('smfun:walletConnected', (e) => {
    console.log('Wallet connected:', e.detail);
    updateWalletInfoDisplay(e.detail);
    
    // Show success message
    showWalletMessage(`✅ ${e.detail.wallet} connected`, 'success');
});

window.addEventListener('smfun:walletDisconnected', (e) => {
    console.log('Wallet disconnected:', e.detail);
    updateWalletInfoDisplay({ connected: false });
    
    // Show disconnect message
    showWalletMessage('🔌 Wallet disconnected', 'info');
});

window.addEventListener('smfun:walletError', (e) => {
    console.error('Wallet error:', e.detail);
    showWalletMessage(`❌ ${e.detail.error}`, 'error');
});

function showWalletMessage(text, type) {
    // Create or update message display
    let messageDiv = document.getElementById('wallet-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'wallet-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 15px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10001;
            display: none;
        `;
        document.body.appendChild(messageDiv);
    }
    
    // Set style based on type
    const styles = {
        success: { background: 'rgba(0,255,0,0.1)', border: '1px solid #00ff00', color: '#00ff00' },
        error: { background: 'rgba(255,0,0,0.1)', border: '1px solid #ff0000', color: '#ff0000' },
        info: { background: 'rgba(0,0,255,0.1)', border: '1px solid #0000ff', color: '#0000ff' }
    };
    
    Object.assign(messageDiv.style, styles[type] || styles.info);
    messageDiv.textContent = text;
    messageDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}
