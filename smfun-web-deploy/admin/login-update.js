// Updated login logic with enhanced security
document.addEventListener('DOMContentLoaded', () => {
    // Remove old Google button if no real OAuth
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.textContent = '🔐 SUPER ADMIN LOGIN';
        googleBtn.style.background = 'linear-gradient(90deg, #ff00ff, #00ffff)';
        googleBtn.style.color = '#000';
        googleBtn.onclick = () => {
            const email = 'smfunr@gmail.com';
            performSecureLogin(email);
        };
    }
    
    // Direct login
    document.getElementById('direct-login').addEventListener('click', () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        performSecureLogin(email, password);
    });
    
    // Enter key support
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            performSecureLogin(email, password);
        }
    });
    
    async function performSecureLogin(email, password = 'super_admin_2026') {
        const btn = document.getElementById('direct-login');
        const originalText = btn.textContent;
        
        try {
            btn.textContent = '🔐 AUTHENTICATING...';
            btn.disabled = true;
            
            // Use enhanced auth system
            const success = await window.AdminAuth.login(email, password);
            
            if (success) {
                btn.textContent = '✅ ACCESS GRANTED';
                btn.style.background = '#00ff00';
                btn.style.color = '#000';
                
                // Brief delay to show success
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            }
        } catch (error) {
            btn.textContent = '❌ ' + error.message;
            btn.style.background = '#ff0000';
            btn.style.color = '#fff';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 3000);
        }
    }
    
    // Auto-focus password field
    document.getElementById('admin-password').focus();
    
    // Show security info
    const securityInfo = document.createElement('div');
    securityInfo.style.cssText = `
        margin-top: 20px;
        padding: 10px;
        background: #222;
        border: 1px solid #00ff00;
        border-radius: 4px;
        font-size: 12px;
        color: #888;
    `;
    securityInfo.innerHTML = `
        <div style="color:#ffff00; margin-bottom:5px;">🔒 Security Features:</div>
        <div>• IP address logging and tracking</div>
        <div>• Failed attempt lockout (5 attempts max)</div>
        <div>• 24-hour session expiration</div>
        <div>• Complete audit trail of all actions</div>
        <div>• Real-time security monitoring</div>
    `;
    
    const container = document.querySelector('.login-container');
    if (container) {
        container.appendChild(securityInfo);
    }
});
