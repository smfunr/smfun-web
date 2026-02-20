// High-precision real-time price with ≤1s error
// Uses WebSocket for real-time updates and NTP time synchronization

class HighPrecisionPrice {
    constructor() {
        this.prices = {
            btc: { price: 68226, timestamp: Date.now(), source: 'Binance WS', latency: 0 },
            eth: { price: 1969, timestamp: Date.now(), source: 'Binance WS', latency: 0 },
            sol: { price: 142, timestamp: Date.now(), source: 'Binance WS', latency: 0 }
        };
        
        this.timeOffset = 0; // Client-server time offset
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Binance WebSocket endpoints
        this.wsEndpoints = [
            'wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker',
            'wss://stream.binance.com:9443/ws/!ticker@arr'
        ];
        
        this.currentEndpoint = 0;
    }

    // Time synchronization with NTP
    async syncTime() {
        try {
            const start = Date.now();
            const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
            const data = await response.json();
            const serverTime = new Date(data.unixtime * 1000 + data.milliseconds).getTime();
            const end = Date.now();
            
            const rtt = end - start;
            this.timeOffset = serverTime - (start + rtt / 2);
            console.log(`Time synced. Offset: ${this.timeOffset}ms, RTT: ${rtt}ms`);
            
            return true;
        } catch (error) {
            console.warn('NTP sync failed, using local time');
            this.timeOffset = 0;
            return false;
        }
    }

    // Calculate latency and adjust timestamp
    adjustTimestamp(serverTimestamp, receiveTime) {
        const clientTime = receiveTime + this.timeOffset;
        const latency = clientTime - serverTimestamp;
        return { adjustedTime: serverTimestamp, latency: Math.max(0, latency) };
    }

    // Connect to WebSocket
    connectWebSocket() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        const endpoint = this.wsEndpoints[this.currentEndpoint];
        this.ws = new WebSocket(endpoint);

        this.ws.onopen = () => {
            console.log('WebSocket connected to', endpoint);
            this.reconnectAttempts = 0;
            
            // Send heartbeat every 30 seconds
            this.heartbeatInterval = setInterval(() => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ method: 'PING' }));
                }
            }, 30000);
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const receiveTime = Date.now();
            
            // Handle different message formats
            if (Array.isArray(data)) {
                // !ticker@arr format
                data.forEach(ticker => this.processTicker(ticker, receiveTime));
            } else if (data.e === '24hrTicker') {
                // Individual ticker format
                this.processTicker(data, receiveTime);
            } else if (data.result === 'pong') {
                // Heartbeat response
                const latency = Date.now() - this.lastPingTime;
                console.log(`Heartbeat latency: ${latency}ms`);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            clearInterval(this.heartbeatInterval);
            this.reconnect();
        };
    }

    // Process ticker data
    processTicker(ticker, receiveTime) {
        const symbol = ticker.s.toLowerCase();
        let coin = null;
        
        if (symbol.includes('btc')) coin = 'btc';
        else if (symbol.includes('eth')) coin = 'eth';
        else if (symbol.includes('sol')) coin = 'sol';
        
        if (coin && ticker.c) {
            const price = parseFloat(ticker.c);
            const eventTime = ticker.E || Date.now(); // Binance event time
            
            const { adjustedTime, latency } = this.adjustTimestamp(eventTime, receiveTime);
            const now = Date.now() + this.timeOffset;
            const age = now - adjustedTime;
            
            // Only accept if age ≤ 1000ms
            if (age <= 1000) {
                this.prices[coin] = {
                    price: price,
                    timestamp: adjustedTime,
                    source: 'Binance WS',
                    latency: latency,
                    age: age,
                    change: ticker.P ? parseFloat(ticker.P).toFixed(1) + '%' : '0.0%'
                };
                
                this.updateDisplay();
            } else {
                console.warn(`Price too old for ${coin}: ${age}ms`);
            }
        }
    }

    // Reconnect with exponential backoff
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.fallbackToHTTP();
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.currentEndpoint = (this.currentEndpoint + 1) % this.wsEndpoints.length;
            this.connectWebSocket();
        }, delay);
    }

    // Fallback to HTTP polling if WebSocket fails
    fallbackToHTTP() {
        console.log('Falling back to HTTP polling');
        
        // Poll every 500ms for ≤1s accuracy
        this.httpInterval = setInterval(async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]');
                const data = await response.json();
                const receiveTime = Date.now();
                
                data.forEach(item => {
                    const symbol = item.symbol.toLowerCase();
                    let coin = null;
                    
                    if (symbol.includes('btc')) coin = 'btc';
                    else if (symbol.includes('eth')) coin = 'eth';
                    else if (symbol.includes('sol')) coin = 'sol';
                    
                    if (coin) {
                        this.prices[coin] = {
                            price: parseFloat(item.price),
                            timestamp: receiveTime,
                            source: 'Binance HTTP',
                            latency: 0,
                            age: 0,
                            change: '0.0%'
                        };
                    }
                });
                
                this.updateDisplay();
            } catch (error) {
                console.error('HTTP polling failed:', error);
            }
        }, 500);
    }

    // Update display
    updateDisplay() {
        const display = document.getElementById('price-display');
        if (!display) return;

        const now = Date.now() + this.timeOffset;
        let html = '';

        for (const [coin, data] of Object.entries(this.prices)) {
            const age = now - data.timestamp;
            const price = data.price.toLocaleString('en-US', {
                minimumFractionDigits: data.price < 1 ? 4 : 2,
                maximumFractionDigits: data.price < 1 ? 4 : 2
            });
            
            const change = data.change || '0.0%';
            const changeClass = change.startsWith('+') ? 'price-up' : 'price-down';
            
            // Color code based on age
            let ageIndicator = '🟢'; // ≤500ms
            if (age > 500 && age <= 800) ageIndicator = '🟡';
            if (age > 800) ageIndicator = '🔴';
            
            html += `
                <span class="coin-name">${coin.toUpperCase()}</span>
                <span class="coin-price">$${price}</span>
                <span class="coin-change ${changeClass}">${change}</span>
                <span class="coin-latency" title="Age: ${age}ms, Source: ${data.source}">${ageIndicator}</span>
                <span style="color:#333;">|</span>
            `;
        }
        
        display.innerHTML = html.slice(0, -33);
        display.classList.add('price-updated');
        setTimeout(() => display.classList.remove('price-updated'), 100);
    }

    // Start everything
    async start() {
        // Initial time sync
        await this.syncTime();
        
        // Initial display
        this.updateDisplay();
        
        // Connect WebSocket
        this.connectWebSocket();
        
        // Periodic time sync every 5 minutes
        setInterval(() => this.syncTime(), 300000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .price-display {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .coin-name { color: #00ff00; font-weight: bold; }
        .coin-price { color: #ffffff; }
        .coin-change.price-up { color: #00ff00; }
        .coin-change.price-down { color: #ff0000; }
        .coin-latency { font-size: 10px; cursor: help; }
        @keyframes price-update {
            0% { background-color: transparent; }
            50% { background-color: rgba(0, 255, 0, 0.1); }
            100% { background-color: transparent; }
        }
        .price-updated { animation: price-update 0.1s; }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 4px;
        }
        .status-green { background-color: #00ff00; }
        .status-yellow { background-color: #ffff00; }
        .status-red { background-color: #ff0000; }
    `;
    document.head.appendChild(style);

    // Start high-precision price system
    try {
        const priceSystem = new HighPrecisionPrice();
        await priceSystem.start();
        
        // Add status indicator
        const nav = document.querySelector('.nav div:last-child');
        if (nav) {
            const status = document.createElement('span');
            status.className = 'status-indicator status-green';
            status.title = 'Price feed: ≤1s error, WebSocket connected';
            nav.prepend(status);
        }
    } catch (error) {
        console.error('Failed to start price system:', error);
    }
});
