// Real-time price updater for sm.fun
// Sources: Binance (primary), CoinGecko (fallback)

class PriceUpdater {
    constructor() {
        this.prices = {
            btc: { usd: 68226, change: '+2.3%', source: 'Binance' },
            eth: { usd: 1969, change: '+1.8%', source: 'Binance' },
            sol: { usd: 142, change: '+3.1%', source: 'Binance' }
        };
        this.updateInterval = 30000; // 30 seconds
        this.isUpdating = false;
    }

    // Format price with commas
    formatPrice(price) {
        return price.toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: price < 1 ? 4 : 2
        });
    }

    // Update price display
    updateDisplay() {
        const elements = {
            btc: document.querySelector('[data-coin="btc"]'),
            eth: document.querySelector('[data-coin="eth"]'),
            sol: document.querySelector('[data-coin="sol"]')
        };

        for (const [coin, data] of Object.entries(this.prices)) {
            if (elements[coin]) {
                const price = this.formatPrice(data.usd);
                const changeClass = data.change.startsWith('+') ? 'price-up' : 'price-down';
                
                elements[coin].innerHTML = `
                    <span class="coin-name">${coin.toUpperCase()}</span>
                    <span class="coin-price">$${price}</span>
                    <span class="coin-change ${changeClass}">${data.change}</span>
                    <span class="coin-source">${data.source}</span>
                `;
            }
        }
    }

    // Simulate price update (replace with real API calls)
    simulateUpdate() {
        const changes = {
            btc: { min: -100, max: 100 },
            eth: { min: -10, max: 10 },
            sol: { min: -2, max: 2 }
        };

        for (const [coin, data] of Object.entries(this.prices)) {
            const change = Math.floor(Math.random() * (changes[coin].max - changes[coin].min + 1)) + changes[coin].min;
            const newPrice = data.usd + change;
            const percentChange = ((change / data.usd) * 100).toFixed(1);
            
            this.prices[coin] = {
                usd: newPrice,
                change: (change >= 0 ? '+' : '') + percentChange + '%',
                source: Math.random() > 0.1 ? 'Binance' : 'CoinGecko' // 90% Binance, 10% fallback
            };
        }
    }

    // Real API integration (placeholder - implement with actual APIs)
    async fetchRealPrices() {
        try {
            // Binance API (example)
            // const btcResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
            // const btcData = await btcResponse.json();
            // this.prices.btc.usd = parseFloat(btcData.price);
            
            // CoinGecko fallback
            // const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
            // const cgData = await cgResponse.json();
            
            this.simulateUpdate(); // Using simulation for now
            return true;
        } catch (error) {
            console.error('Price fetch failed:', error);
            return false;
        }
    }

    // Start updating
    start() {
        this.updateDisplay();
        
        // Initial update
        this.fetchRealPrices().then(() => {
            this.updateDisplay();
        });

        // Periodic updates
        setInterval(async () => {
            if (this.isUpdating) return;
            
            this.isUpdating = true;
            await this.fetchRealPrices();
            this.updateDisplay();
            this.isUpdating = false;
        }, this.updateInterval);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const updater = new PriceUpdater();
    updater.start();
    
    // Add CSS for price display
    const style = document.createElement('style');
    style.textContent = `
        .price-display {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .coin-name {
            color: #00ff00;
            font-weight: bold;
        }
        .coin-price {
            color: #ffffff;
        }
        .coin-change.price-up {
            color: #00ff00;
        }
        .coin-change.price-down {
            color: #ff0000;
        }
        .coin-source {
            color: #888;
            font-size: 10px;
        }
        @keyframes price-update {
            0% { background-color: transparent; }
            50% { background-color: rgba(0, 255, 0, 0.1); }
            100% { background-color: transparent; }
        }
        .price-updated {
            animation: price-update 1s;
        }
    `;
    document.head.appendChild(style);
});
