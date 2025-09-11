/**
 * 统一的用户认证组件
 * 处理登录态显示、用户菜单、认证状态管理
 */

class UserAuthComponent {
    constructor() {
        this.authManager = window.authManager || null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.initAttempts = 0;  // 防止无限递归
        this.maxInitAttempts = 50;  // 最多尝试50次（5秒）
        this.uiCreated = false;  // 标记UI是否已创建
        
        this.init();
    }

    init() {
        // 首次调用时创建UI
        if (!this.uiCreated) {
            this.createAuthUI();
            this.bindEvents();
            this.updateAuthState();
        }
        
        // 等待authManager加载
        if (!this.authManager && this.initAttempts < this.maxInitAttempts) {
            this.initAttempts++;
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // 监听认证状态变化
        if (window.appStateManager) {
            window.appStateManager.subscribe('user', (user) => {
                this.currentUser = user;
                this.updateAuthUI();
            });
            
            window.appStateManager.subscribe('isAuthenticated', (authenticated) => {
                this.isAuthenticated = authenticated;
                this.updateAuthUI();
            });
        }
    }

    createAuthUI() {
        // 如果已经创建过，直接返回
        if (this.uiCreated) {
            return;
        }
        
        // 查找导航栏容器，按优先级顺序（修正优先级）
        const selectors = [
            '.nav-menu',                    // 首选 - courses.html 中实际存在
            '.nav-right',                   // 次选 - profile.html 中存在
            '.nav-container .nav-menu',     // 第三选择
            '.navbar .nav-menu',           // 第四选择
            'nav .nav-menu',               // 第五选择
            '.header-content .nav-right'   // 最后选择
        ];
        
        let navContainer = null;
        for (const selector of selectors) {
            navContainer = document.querySelector(selector);
            if (navContainer) {
                console.log('Found nav container with selector:', selector);
                break;
            }
        }
        
        if (!navContainer) {
            console.warn('Navigation container not found, selectors tried:', selectors);
            // 尝试更宽泛的选择器
            navContainer = document.querySelector('nav') || document.querySelector('.navbar');
            if (navContainer) {
                console.log('Found nav container using fallback selector');
            } else {
                return;
            }
        }

        // 检查是否已经存在认证UI
        if (document.getElementById('authContainer') || document.getElementById('userProfile')) {
            console.log('Auth UI already exists');
            this.uiCreated = true;  // 标记UI已存在
            return;
        }

        // 创建认证容器
        const authContainer = this.createAuthContainer();
        const userProfile = this.createUserProfile();
        
        navContainer.appendChild(authContainer);
        navContainer.appendChild(userProfile);
        
        console.log('Auth UI created and appended to', navContainer);
        
        // 标记UI已创建
        this.uiCreated = true;
    }

    bindEvents() {
        // 监听登录按钮点击
        document.addEventListener('click', (e) => {
            if (e.target.matches('#loginBtn') || e.target.closest('#loginBtn')) {
                this.showLoginModal();
            }
            
            if (e.target.matches('#registerBtn') || e.target.closest('#registerBtn')) {
                this.showRegisterModal();
            }
            
            if (e.target.matches('#logoutBtn') || e.target.closest('#logoutBtn')) {
                this.handleLogout();
            }
            
            // 用户菜单切换
            if (e.target.matches('.user-trigger') || e.target.closest('.user-trigger')) {
                this.toggleUserMenu();
            }
        });

        // 点击外部关闭用户菜单
        document.addEventListener('click', (e) => {
            const userMenu = document.querySelector('.user-menu');
            if (userMenu && !userMenu.contains(e.target)) {
                userMenu.classList.remove('open');
            }
        });
    }

    async updateAuthState() {
        try {
            // 检查本地存储的用户信息
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            
            if (token && userStr) {
                try {
                    this.currentUser = JSON.parse(userStr);
                    this.isAuthenticated = true;
                } catch (parseError) {
                    console.error('Failed to parse user data:', parseError);
                    // 清除损坏的数据
                    localStorage.removeItem('user');
                    this.currentUser = null;
                    this.isAuthenticated = false;
                }
                
                // 如果有authManager，验证token是否有效
                if (this.authManager) {
                    if (this.authManager.isTokenExpired()) {
                        await this.authManager.refreshAccessToken();
                    }
                    
                    // 获取最新用户信息
                    await this.authManager.fetchUserInfo();
                    this.currentUser = this.authManager.user;
                }
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
            }
        } catch (error) {
            console.error('Auth state update failed:', error);
            this.handleAuthFailure();
        }
        
        this.updateAuthUI();
    }

    updateAuthUI() {
        this.updateNavbarAuth();
        this.updateUserProfile();
    }

    updateNavbarAuth() {
        // 查找认证容器
        let authContainer = document.getElementById('authContainer');
        let userProfile = document.getElementById('userProfile');

        if (!authContainer || !userProfile) {
            // 如果UI还未创建且未超过最大尝试次数，稍后再试
            if (!this.uiCreated && this.initAttempts < this.maxInitAttempts) {
                console.log('Auth UI not ready yet, will retry...');
                return;
            }
            // 超过最大尝试次数或UI应该已创建但找不到，记录警告但不再重试
            console.warn('Auth UI containers not found after initialization');
            return;
        }

        if (this.isAuthenticated && this.currentUser) {
            // 显示用户信息，隐藏登录按钮
            authContainer.style.display = 'none';
            userProfile.style.display = 'flex';
            
            // 更新用户信息
            this.updateUserProfileContent(userProfile);
        } else {
            // 显示登录按钮，隐藏用户信息
            authContainer.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }

    createAuthContainer() {
        const authContainer = document.createElement('div');
        authContainer.id = 'authContainer';
        authContainer.className = 'auth-container';
        authContainer.innerHTML = `
            <a href="login.html" id="loginBtn" class="btn btn-ghost">登录</a>
            <a href="register.html" id="registerBtn" class="btn btn-primary">注册</a>
        `;

        return authContainer;
    }

    createUserProfile() {
        const userProfile = document.createElement('div');
        userProfile.id = 'userProfile';
        userProfile.className = 'user-profile';
        userProfile.innerHTML = `
            <div class="user-menu">
                <div class="user-trigger">
                    <div class="user-avatar" id="userAvatar">
                        <span class="avatar-text"></span>
                    </div>
                    <div class="user-info">
                        <span class="user-name"></span>
                        <span class="dropdown-arrow">▼</span>
                    </div>
                </div>
                
                <div class="user-dropdown">
                    <div class="dropdown-header">
                        <div class="user-avatar large">
                            <span class="avatar-text"></span>
                        </div>
                        <div class="user-details">
                            <div class="user-name"></div>
                            <div class="user-email"></div>
                        </div>
                    </div>
                    
                    <div class="dropdown-menu">
                        <a href="profile.html" class="dropdown-item">
                            <span class="item-icon">👤</span>
                            <span>个人中心</span>
                        </a>
                        <a href="courses.html" class="dropdown-item">
                            <span class="item-icon">📚</span>
                            <span>我的课程</span>
                        </a>
                        <a href="orders.html" class="dropdown-item">
                            <span class="item-icon">📋</span>
                            <span>订单管理</span>
                        </a>
                        <div class="dropdown-divider"></div>
                        <button id="logoutBtn" class="dropdown-item logout">
                            <span class="item-icon">🚪</span>
                            <span>退出登录</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return userProfile;
    }

    updateUserProfileContent(userProfile) {
        if (!this.currentUser) return;

        const userName = this.currentUser.nickname || this.currentUser.username || this.currentUser.email || 'User';
        const userEmail = this.currentUser.email || '';
        const avatarText = userName.charAt(0).toUpperCase();

        // 更新所有用户名显示
        userProfile.querySelectorAll('.user-name').forEach(el => {
            el.textContent = userName;
        });

        // 更新邮箱显示
        userProfile.querySelectorAll('.user-email').forEach(el => {
            el.textContent = userEmail;
        });

        // 更新头像
        userProfile.querySelectorAll('.avatar-text').forEach(el => {
            el.textContent = avatarText;
        });

        // 如果有头像URL，使用头像图片
        if (this.currentUser.avatar) {
            userProfile.querySelectorAll('.user-avatar').forEach(el => {
                el.style.backgroundImage = `url(${this.currentUser.avatar})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.querySelector('.avatar-text').style.display = 'none';
            });
        }
    }

    updateUserProfile() {
        // 更新其他页面可能存在的用户信息显示
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText && this.currentUser) {
            welcomeText.textContent = `欢迎，${this.currentUser.nickname || this.currentUser.username}`;
        }
    }

    toggleUserMenu() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.classList.toggle('open');
        }
    }

    showLoginModal() {
        // 跳转到登录页面，保存当前页面用于返回
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `login.html?returnUrl=${returnUrl}`;
    }

    showRegisterModal() {
        // 跳转到注册页面，保存当前页面用于返回
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `register.html?returnUrl=${returnUrl}`;
    }

    async handleLogout() {
        if (this.authManager) {
            await this.authManager.logout();
        } else {
            // 备用登出逻辑
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '../../home.html';
        }
    }

    handleAuthFailure() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    // 公共方法：检查是否需要认证
    requireAuth() {
        if (!this.isAuthenticated) {
            // 显示需要登录的提示
            if (window.showNotification) {
                window.showNotification('请先登录您的账户', 'warning');
            } else {
                alert('请先登录您的账户');
            }
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
            return false;
        }
        return true;
    }
}

// 样式
const userAuthStyles = `
<style>
    .auth-container {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .btn-ghost {
        background: transparent;
        color: var(--dark, #1E293B);
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .btn-ghost:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    .btn-primary {
        background: linear-gradient(135deg, #3B82F6, #8B5CF6);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .user-profile {
        position: relative;
    }

    .user-menu {
        position: relative;
    }

    .user-trigger {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .user-trigger:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #3B82F6;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3B82F6, #8B5CF6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.875rem;
    }

    .user-avatar.large {
        width: 48px;
        height: 48px;
        font-size: 1.25rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .user-name {
        font-weight: 500;
        color: var(--dark, #1E293B);
    }

    .dropdown-arrow {
        color: var(--gray-500, #64748B);
        font-size: 0.75rem;
        transition: transform 0.2s;
    }

    .user-menu.open .dropdown-arrow {
        transform: rotate(180deg);
    }

    .user-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        width: 280px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.1);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s;
        z-index: 1000;
    }

    .user-menu.open .user-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .dropdown-header {
        padding: 1.5rem;
        border-bottom: 1px solid #E2E8F0;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .user-details {
        flex: 1;
    }

    .user-details .user-name {
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 0.25rem;
    }

    .user-email {
        color: var(--gray-500, #64748B);
        font-size: 0.875rem;
    }

    .dropdown-menu {
        padding: 0.5rem;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        color: var(--dark, #1E293B);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-size: 0.95rem;
    }

    .dropdown-item:hover {
        background: #F3F4F6;
    }

    .dropdown-item.logout {
        color: #EF4444;
    }

    .dropdown-item.logout:hover {
        background: #FEF2F2;
    }

    .item-icon {
        width: 20px;
        text-align: center;
    }

    .dropdown-divider {
        height: 1px;
        background: #E2E8F0;
        margin: 0.5rem 0;
    }

    /* 深色模式适配 */
    [data-theme="dark"] .btn-ghost {
        color: var(--dark, #F1F5F9);
        border-color: rgba(255, 255, 255, 0.2);
    }

    [data-theme="dark"] .btn-ghost:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    [data-theme="dark"] .user-trigger {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(255, 255, 255, 0.2);
    }

    [data-theme="dark"] .user-trigger:hover {
        background: rgba(30, 41, 59, 1);
        border-color: #60A5FA;
    }

    [data-theme="dark"] .user-dropdown {
        background: #1E293B;
        border-color: rgba(255, 255, 255, 0.2);
    }

    [data-theme="dark"] .dropdown-header {
        border-color: rgba(255, 255, 255, 0.2);
    }

    [data-theme="dark"] .dropdown-item:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    [data-theme="dark"] .dropdown-item.logout:hover {
        background: rgba(239, 68, 68, 0.1);
    }

    [data-theme="dark"] .dropdown-divider {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
`;

// 注入样式
if (!document.getElementById('user-auth-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'user-auth-styles';
    styleElement.innerHTML = userAuthStyles;
    document.head.appendChild(styleElement);
}

// 立即暴露类到全局
window.UserAuthComponent = UserAuthComponent;

// 等待DOM加载完成后创建全局实例
document.addEventListener('DOMContentLoaded', function() {
    if (!window.userAuth) {
        window.userAuth = new UserAuthComponent();
    }
});

// 确保组件在全局可用
console.log('UserAuthComponent loaded and available globally');