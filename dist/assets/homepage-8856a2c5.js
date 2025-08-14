// 首页功能模块
import './api.js';

class HomePage {
    constructor() {
        console.log('HomePage constructor called');
        this.init();
    }

    async init() {
        console.log('HomePage init called');
        this.checkAuthStatus();
        this.setupEventListeners();
        this.initializeAnimations();
    }

    // 检查用户登录状态
    checkAuthStatus() {
        console.log('=== 首页登录状态检查 ===');
        console.log('当前页面URL:', window.location.href);
        console.log('当前端口:', window.location.port);
        
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('Token:', token ? `存在 (长度: ${token.length})` : '不存在');
        console.log('User:', user ? `存在 (长度: ${user.length})` : '不存在');
        
        // 列出所有localStorage项目
        console.log('=== localStorage所有项目 ===');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value ? `${value.substring(0, 50)}...` : 'null');
        }
        
        const authContainer = document.getElementById('authContainer');
        const userProfile = document.getElementById('userProfile');
        
        if (token && user) {
            try {
                const userData = JSON.parse(user);
                this.showUserProfile(userData);
                if (authContainer) authContainer.style.display = 'none';
                if (userProfile) userProfile.style.display = 'block';
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.showAuthButtons();
            }
        } else {
            this.showAuthButtons();
        }
    }

    // 显示用户资料
    showUserProfile(user) {
        const userName = document.getElementById('userName');
        const userPoints = document.getElementById('userPoints');
        
        if (userName) userName.textContent = user.username || user.nickname || '用户';
        if (userPoints) userPoints.textContent = user.points || '0';
        
        // 设置用户头像
        this.setUserAvatar(user.avatar);
        
        // 设置下拉菜单中的小头像
        this.setUserAvatarSmall(user.avatar);
        
        // 加载订单数量徽章
        this.loadOrderBadge();
    }

    // 显示登录注册按钮
    showAuthButtons() {
        const authContainer = document.getElementById('authContainer');
        const userProfile = document.getElementById('userProfile');
        
        if (authContainer) authContainer.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }

    // 设置用户头像
    setUserAvatar(avatarType = 'default') {
        const avatarImg = document.getElementById('userAvatar');
        const avatars = {
            'default': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%234a9eff'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/></svg>",
            'tech': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23ff6b6b'/><rect x='15' y='12' width='10' height='8' fill='white' rx='2'/><rect x='12' y='22' width='16' height='10' fill='white' rx='3'/><circle cx='16' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='20' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='24' cy='26' r='1.5' fill='%23ff6b6b'/></svg>",
            'ai': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%2310b981'/><circle cx='20' cy='20' r='12' fill='none' stroke='white' stroke-width='2'/><circle cx='20' cy='20' r='6' fill='white'/><circle cx='20' cy='20' r='2' fill='%2310b981'/><path d='M20 8 L22 14 L20 20 L18 14 Z' fill='white'/><path d='M32 20 L26 22 L20 20 L26 18 Z' fill='white'/><path d='M20 32 L18 26 L20 20 L22 26 Z' fill='white'/><path d='M8 20 L14 18 L20 20 L14 22 Z' fill='white'/></svg>",
            'robot': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23f59e0b'/><rect x='12' y='14' width='16' height='12' fill='white' rx='2'/><circle cx='16' cy='18' r='2' fill='%23f59e0b'/><circle cx='24' cy='18' r='2' fill='%23f59e0b'/><rect x='18' y='22' width='4' height='2' fill='%23f59e0b' rx='1'/><circle cx='20' cy='10' r='2' fill='white'/></svg>",
            'student': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%237c3aed'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='15' y='8' width='10' height='4' fill='%237c3aed' rx='2'/><rect x='18' y='6' width='4' height='2' fill='white' rx='1'/></svg>",
            'expert': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23dc2626'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='14' y='10' width='12' height='6' fill='%23dc2626' rx='3'/><circle cx='17' cy='13' r='1' fill='white'/><circle cx='20' cy='13' r='1' fill='white'/><circle cx='23' cy='13' r='1' fill='white'/></svg>"
        };
        
        if (avatarImg) {
            avatarImg.src = avatars[avatarType] || avatars.default;
        }
    }

    // 设置下拉菜单中的小头像
    setUserAvatarSmall(avatarType = 'default') {
        const avatarImg = document.getElementById('userAvatarSmall');
        const avatars = {
            'default': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%234a9eff'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/></svg>",
            'tech': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23ff6b6b'/><rect x='15' y='12' width='10' height='8' fill='white' rx='2'/><rect x='12' y='22' width='16' height='10' fill='white' rx='3'/><circle cx='16' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='20' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='24' cy='26' r='1.5' fill='%23ff6b6b'/></svg>",
            'ai': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%2310b981'/><circle cx='20' cy='20' r='12' fill='none' stroke='white' stroke-width='2'/><circle cx='20' cy='20' r='6' fill='white'/><circle cx='20' cy='20' r='2' fill='%2310b981'/><path d='M20 8 L22 14 L20 20 L18 14 Z' fill='white'/><path d='M32 20 L26 22 L20 20 L26 18 Z' fill='white'/><path d='M20 32 L18 26 L20 20 L22 26 Z' fill='white'/><path d='M8 20 L14 18 L20 20 L14 22 Z' fill='white'/></svg>",
            'robot': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23f59e0b'/><rect x='12' y='14' width='16' height='12' fill='white' rx='2'/><circle cx='16' cy='18' r='2' fill='%23f59e0b'/><circle cx='24' cy='18' r='2' fill='%23f59e0b'/><rect x='18' y='22' width='4' height='2' fill='%23f59e0b' rx='1'/><circle cx='20' cy='10' r='2' fill='white'/></svg>",
            'student': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%237c3aed'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='15' y='8' width='10' height='4' fill='%237c3aed' rx='2'/><rect x='18' y='6' width='4' height='2' fill='white' rx='1'/></svg>",
            'expert': "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23dc2626'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='14' y='10' width='12' height='6' fill='%23dc2626' rx='3'/><circle cx='17' cy='13' r='1' fill='white'/><circle cx='20' cy='13' r='1' fill='white'/><circle cx='23' cy='13' r='1' fill='white'/></svg>"
        };
        
        if (avatarImg) {
            avatarImg.src = avatars[avatarType] || avatars.default;
        }
    }

    // 加载订单徽章
    async loadOrderBadge() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            // 从API获取用户订单数量
            const response = await fetch('http://42.194.245.66:8070/api/orders/count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            let pendingOrderCount = 0;
            if (response.ok) {
                const data = await response.json();
                if (data.code === 200 && data.data) {
                    pendingOrderCount = data.data.pending || 0;
                }
            } else {
                // 如果API不可用，使用备选方案：不显示徽章
                console.log('订单API不可用，跳过徽章显示');
            }
            
            const orderBadge = document.getElementById('orderBadge');
            if (orderBadge && pendingOrderCount > 0) {
                orderBadge.textContent = pendingOrderCount;
                orderBadge.style.display = 'flex';
            } else if (orderBadge) {
                orderBadge.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load order badge:', error);
            // API失败时隐藏徽章
            const orderBadge = document.getElementById('orderBadge');
            if (orderBadge) {
                orderBadge.style.display = 'none';
            }
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 用户菜单切换
        window.toggleUserMenu = () => {
            const userMenu = document.getElementById('userMenu');
            if (userMenu) {
                userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
            }
        };

        // 头像选择器
        window.showAvatarSelector = () => {
            const avatarSelector = document.getElementById('avatarSelector');
            if (avatarSelector) {
                avatarSelector.style.display = 'block';
            }
        };

        window.hideAvatarSelector = () => {
            const avatarSelector = document.getElementById('avatarSelector');
            if (avatarSelector) {
                avatarSelector.style.display = 'none';
            }
        };

        window.selectAvatar = (avatarType) => {
            this.setUserAvatar(avatarType);
            this.setUserAvatarSmall(avatarType);
            // 保存头像选择到本地存储
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.avatar = avatarType;
            localStorage.setItem('user', JSON.stringify(user));
            this.hideAvatarSelector();
        };

        // 退出登录
        window.logout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.checkAuthStatus();
            // 可选：显示退出成功提示
            window.notification?.success('已退出登录');
            // 刷新页面或重新检查状态
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        };

        // 点击页面其他地方关闭用户菜单
        document.addEventListener('click', (e) => {
            const userProfile = document.getElementById('userProfile');
            const userMenu = document.getElementById('userMenu');
            
            if (userProfile && userMenu && !userProfile.contains(e.target)) {
                userMenu.style.display = 'none';
            }
        });

        // 监听存储变化（用于同步多标签页的登录状态）
        window.addEventListener('storage', (e) => {
            if (e.key === 'token' || e.key === 'user') {
                this.checkAuthStatus();
            }
        });
    }

    // 初始化动画效果
    initializeAnimations() {
        // 导航栏滚动效果
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            const currentScrollY = window.scrollY;
            
            if (navbar) {
                if (currentScrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                
                // 自动隐藏/显示导航栏
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollY = currentScrollY;
        });

        // 创建浮动星星
        this.createFloatingStars();
        
        // 创建流线效果
        this.createFlowLines();
    }

    // 创建浮动星星
    createFloatingStars() {
        const starsContainer = document.getElementById('stars');
        if (!starsContainer) return;

        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: twinkle ${Math.random() * 3 + 2}s infinite;
            `;
            starsContainer.appendChild(star);
        }
    }

    // 创建流线效果
    createFlowLines() {
        const flowContainer = document.getElementById('flowLines');
        if (!flowContainer) return;

        for (let i = 0; i < 5; i++) {
            const line = document.createElement('div');
            line.className = 'flow-line';
            line.style.cssText = `
                position: absolute;
                width: 1px;
                height: 100px;
                background: linear-gradient(to bottom, transparent, rgba(74, 158, 255, 0.6), transparent);
                left: ${Math.random() * 100}%;
                top: -100px;
                animation: flowDown ${Math.random() * 3 + 4}s infinite linear;
                animation-delay: ${Math.random() * 2}s;
            `;
            flowContainer.appendChild(line);
        }
    }
}

// CSS动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
    }
    
    @keyframes flowDown {
        0% { transform: translateY(-100px) scaleY(0); opacity: 0; }
        10% { transform: translateY(-50px) scaleY(1); opacity: 1; }
        90% { transform: translateY(calc(100vh + 50px)) scaleY(1); opacity: 1; }
        100% { transform: translateY(calc(100vh + 100px)) scaleY(0); opacity: 0; }
    }
    
    .navbar {
        transition: transform 0.3s ease, background-color 0.3s ease;
    }
    
    .navbar.scrolled {
        background-color: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(20px);
    }
    
    .user-menu {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background: rgba(17, 24, 39, 0.98);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        min-width: 280px;
        max-width: 320px;
        padding: 0;
        z-index: 1000;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: menuSlideDown 0.2s ease-out;
        margin-top: 8px;
    }
    
    @keyframes menuSlideDown {
        from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .user-info-card {
        padding: 20px 16px;
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        border-radius: 16px 16px 0 0;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
    }
    
    .user-info-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        border-radius: 16px 16px 0 0;
        pointer-events: none;
    }
    
    .user-avatar-small {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(74, 158, 255, 0.3);
        flex-shrink: 0;
        position: relative;
        z-index: 1;
    }
    
    .user-avatar-small img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .user-details {
        flex: 1;
        position: relative;
        z-index: 1;
    }
    
    .user-name {
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 4px;
        line-height: 1.2;
    }
    
    .user-level {
        color: #a5b4fc;
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        background: rgba(74, 158, 255, 0.2);
        border-radius: 12px;
        display: inline-block;
    }
    
    .user-points {
        text-align: center;
        position: relative;
        z-index: 1;
    }
    
    .points-count {
        display: block;
        color: #fbbf24;
        font-weight: 700;
        font-size: 18px;
        line-height: 1;
    }
    
    .points-label {
        color: #9ca3af;
        font-size: 11px;
        margin-top: 2px;
        display: block;
    }
    
    .menu-section {
        padding: 8px 0;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #d1d5db;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        cursor: pointer;
        position: relative;
        gap: 12px;
    }
    
    .menu-item:hover {
        background: rgba(74, 158, 255, 0.08);
        color: #ffffff;
        padding-left: 24px;
    }
    
    .menu-item.logout-item {
        color: #f87171;
    }
    
    .menu-item.logout-item:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #fca5a5;
    }
    
    .menu-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
        flex-shrink: 0;
    }
    
    .menu-badge {
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .menu-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 0 16px;
    }
    
    .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: border-color 0.3s;
    }
    
    .user-avatar:hover {
        border-color: rgba(74, 158, 255, 0.6);
    }
    
    .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .user-profile {
        position: relative;
    }
    
    .avatar-selector-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .avatar-selector-content {
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
    }
    
    .avatar-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .avatar-selector-header h3 {
        color: #ffffff;
        margin: 0;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .avatar-options {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }
    
    .avatar-option {
        width: 60px;
        height: 60px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        transition: border-color 0.3s;
        margin: 0 auto;
    }
    
    .avatar-option:hover {
        border-color: rgba(74, 158, 255, 0.6);
    }
    
    .avatar-option img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

document.head.appendChild(style);

// 初始化首页
document.addEventListener('DOMContentLoaded', () => {
    console.log('HomePage initializing...');
    try {
        new HomePage();
        console.log('HomePage initialized successfully');
    } catch (error) {
        console.error('Error initializing HomePage:', error);
    }
});

export default HomePage;