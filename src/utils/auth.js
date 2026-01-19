/**
 * 统一认证管理
 */

class AuthManager {
    constructor() {
        this.tokenKey = 'token';
        this.userKey = 'user';
        this.listeners = [];
    }

    /**
     * 获取Token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * 设置Token
     */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
        this.notifyListeners('login');
    }

    /**
     * 获取用户信息
     */
    getUser() {
        const userStr = localStorage.getItem(this.userKey);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * 设置用户信息
     */
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;

        // 检查 token 是否过期（JWT 简单检查）
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                this.logout();
                return false;
            }
        } catch {
            // Token 格式不正确
        }

        return true;
    }

    /**
     * 登出
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.notifyListeners('logout');
    }

    /**
     * 检查认证状态，未登录则跳转
     */
    checkAuth(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            // 保存当前页面地址用于登录后跳转
            const currentUrl = window.location.href;
            localStorage.setItem('redirectAfterLogin', currentUrl);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * 监听认证状态变化
     */
    onAuthChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * 通知监听器
     */
    notifyListeners(event) {
        this.listeners.forEach(callback => callback(event));
    }

    /**
     * 获取用户显示名称
     */
    getDisplayName() {
        const user = this.getUser();
        if (!user) return '游客';
        return user.nickname || user.username || '用户';
    }

    /**
     * 获取用户头像
     */
    getAvatar() {
        const user = this.getUser();
        return user?.avatar || null;
    }

    /**
     * 登录后跳转
     */
    redirectAfterLogin(defaultUrl = 'dashboard.html') {
        const savedUrl = localStorage.getItem('redirectAfterLogin');
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = savedUrl || defaultUrl;
    }
}

// 创建全局实例
const auth = new AuthManager();

// 监听 Token 过期事件
window.addEventListener('auth:expired', () => {
    if (typeof showToast === 'function') {
        showToast('登录已过期，请重新登录', 'warning');
    }
    setTimeout(() => {
        auth.checkAuth();
    }, 1500);
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, auth };
} else {
    window.AuthManager = AuthManager;
    window.auth = auth;
}
