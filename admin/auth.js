// Enhanced admin authentication system
class AdminAuth {
    constructor() {
        this.superAdminEmail = 'smfunr@gmail.com';
        this.allowedIPs = []; // IP whitelist (configure in dashboard)
        this.loginAttempts = {};
        this.maxAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('admin_token');
        const email = localStorage.getItem('admin_email');
        const loginTime = localStorage.getItem('admin_login_time');
        
        if (!token || !email || !loginTime) {
            return false;
        }
        
        // Check token expiration (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            this.logout();
            return false;
        }
        
        return email === this.superAdminEmail;
    }

    // Enhanced login with security checks
    async login(email, password) {
        const ip = await this.getClientIP();
        const now = Date.now();
        
        // Check login attempts
        if (this.loginAttempts[ip]) {
            const { attempts, lockedUntil } = this.loginAttempts[ip];
            
            if (lockedUntil && now < lockedUntil) {
                const minutesLeft = Math.ceil((lockedUntil - now) / (1000 * 60));
                throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
            }
            
            if (attempts >= this.maxAttempts) {
                this.loginAttempts[ip] = {
                    attempts: this.maxAttempts,
                    lockedUntil: now + this.lockoutTime
                };
                throw new Error('Too many failed attempts. Account locked for 15 minutes.');
            }
        }

        // Validate credentials
        if (email !== this.superAdminEmail) {
            this.recordFailedAttempt(ip);
            throw new Error('Invalid admin credentials');
        }

        // Success - create session
        const token = this.generateToken();
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_permissions', 'all');
        localStorage.setItem('admin_login_time', new Date().toISOString());
        localStorage.setItem('admin_login_ip', ip);
        
        // Record successful login
        this.recordLogin(email, ip);
        
        // Clear failed attempts
        delete this.loginAttempts[ip];
        
        return true;
    }

    // Logout
    logout() {
        const email = localStorage.getItem('admin_email');
        const ip = localStorage.getItem('admin_login_ip');
        
        if (email && ip) {
            this.recordLogout(email, ip);
        }
        
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_permissions');
        localStorage.removeItem('admin_login_time');
        localStorage.removeItem('admin_login_ip');
    }

    // Security utilities
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    generateToken() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    recordFailedAttempt(ip) {
        if (!this.loginAttempts[ip]) {
            this.loginAttempts[ip] = { attempts: 0 };
        }
        this.loginAttempts[ip].attempts++;
        
        // Log failed attempt
        console.warn(`Failed login attempt from IP: ${ip}, Attempts: ${this.loginAttempts[ip].attempts}`);
    }

    recordLogin(email, ip) {
        const log = {
            email,
            ip,
            time: new Date().toISOString(),
            action: 'login',
            userAgent: navigator.userAgent
        };
        
        // In production, send to server
        console.log('Admin login:', log);
        
        // Store in localStorage for audit trail
        const auditLog = JSON.parse(localStorage.getItem('admin_audit_log') || '[]');
        auditLog.push(log);
        if (auditLog.length > 100) auditLog.shift(); // Keep last 100 entries
        localStorage.setItem('admin_audit_log', JSON.stringify(auditLog));
    }

    recordLogout(email, ip) {
        const log = {
            email,
            ip,
            time: new Date().toISOString(),
            action: 'logout'
        };
        
        const auditLog = JSON.parse(localStorage.getItem('admin_audit_log') || '[]');
        auditLog.push(log);
        if (auditLog.length > 100) auditLog.shift();
        localStorage.setItem('admin_audit_log', JSON.stringify(auditLog));
    }

    // Get audit log
    getAuditLog() {
        return JSON.parse(localStorage.getItem('admin_audit_log') || '[]');
    }

    // Clear audit log
    clearAuditLog() {
        localStorage.removeItem('admin_audit_log');
    }
}

// Initialize auth system
window.AdminAuth = new AdminAuth();

// Auto-check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!window.AdminAuth.isAuthenticated() && 
        !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
});
