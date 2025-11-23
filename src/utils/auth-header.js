/**
 * 全局登录状态组件
 * 自动在页面上显示用户登录状态和用户菜单
 */

const AuthHeader = {
    // API基础路径
    apiBase: 'http://localhost:8070/api',

    // 用户数据
    userData: null,

    /**
     * 初始化登录状态组件
     * @param {string} containerId - 容器元素ID
     * @param {object} options - 配置选项
     */
    async init(containerId = 'auth-header', options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Auth header container #${containerId} not found`);
            return;
        }

        // 默认选项
        const config = {
            showLinks: true,  // 是否显示导航链接
            links: [
                { href: '/src/pages/dashboard.html', text: '学习中心' },
                { href: '/src/pages/courses.html', text: '课程' },
                { href: '/src/pages/qa.html', text: '问答' },
                { href: '/src/pages/notes.html', text: '笔记' },
                { href: '/src/pages/achievements.html', text: '成就' }
            ],
            ...options
        };

        // 检查登录状态
        const token = localStorage.getItem('token');
        if (!token) {
            this.renderGuestHeader(container, config);
            return;
        }

        // 加载用户信息
        try {
            await this.loadUserInfo(token);
            this.renderUserHeader(container, config);
        } catch (error) {
            console.error('Failed to load user info:', error);
            this.renderGuestHeader(container, config);
        }
    },

    /**
     * 加载用户信息
     */
    async loadUserInfo(token) {
        const response = await fetch(`${this.apiBase}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to get user info');
        }

        this.userData = data.data.user;
    },

    /**
     * 渲染访客状态头部
     */
    renderGuestHeader(container, config) {
        container.innerHTML = `
            <style>
                .auth-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .auth-nav-links {
                    display: flex;
                    gap: 1.5rem;
                }
                .auth-nav-link {
                    color: white;
                    text-decoration: none;
                    opacity: 0.9;
                    transition: opacity 0.3s;
                }
                .auth-nav-link:hover {
                    opacity: 1;
                }
                .auth-guest-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .auth-btn {
                    padding: 0.5rem 1.5rem;
                    border-radius: 0.5rem;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.3s;
                    border: none;
                    cursor: pointer;
                }
                .auth-btn-login {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                .auth-btn-login:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                .auth-btn-register {
                    background: white;
                    color: #667eea;
                }
                .auth-btn-register:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
            </style>
            <div class="auth-header">
                ${config.showLinks ? `
                    <div class="auth-nav-links">
                        ${config.links.map(link => `
                            <a href="${link.href}" class="auth-nav-link">${link.text}</a>
                        `).join('')}
                    </div>
                ` : '<div></div>'}
                <div class="auth-guest-actions">
                    <span style="opacity: 0.8;">未登录</span>
                    <a href="/src/pages/login.html" class="auth-btn auth-btn-login">登录</a>
                    <a href="/src/pages/register.html" class="auth-btn auth-btn-register">注册</a>
                </div>
            </div>
        `;
    },

    /**
     * 渲染用户登录状态头部
     */
    renderUserHeader(container, config) {
        const user = this.userData;
        const displayName = user.nickname || user.username || '用户';
        const avatarLetter = displayName.charAt(0).toUpperCase();

        container.innerHTML = `
            <style>
                .auth-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .auth-nav-links {
                    display: flex;
                    gap: 1.5rem;
                }
                .auth-nav-link {
                    color: white;
                    text-decoration: none;
                    opacity: 0.9;
                    transition: opacity 0.3s;
                }
                .auth-nav-link:hover {
                    opacity: 1;
                }
                .auth-user-menu {
                    position: relative;
                }
                .auth-user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 1rem;
                    border-radius: 2rem;
                    background: rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .auth-user-info:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                .auth-user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #667eea;
                    font-weight: bold;
                    overflow: hidden;
                }
                .auth-user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .auth-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    right: 0;
                    background: white;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    min-width: 200px;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                    transition: all 0.3s;
                    z-index: 1000;
                }
                .auth-dropdown.show {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                .auth-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    color: #2d3748;
                    text-decoration: none;
                    transition: all 0.2s;
                    border-bottom: 1px solid #e2e8f0;
                }
                .auth-dropdown-item:last-child {
                    border-bottom: none;
                }
                .auth-dropdown-item:hover {
                    background: #f7fafc;
                }
                .auth-dropdown-divider {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 0.5rem 0;
                }
                .auth-points-badge {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 1rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                }
            </style>
            <div class="auth-header">
                ${config.showLinks ? `
                    <div class="auth-nav-links">
                        ${config.links.map(link => `
                            <a href="${link.href}" class="auth-nav-link">${link.text}</a>
                        `).join('')}
                    </div>
                ` : '<div></div>'}
                <div class="auth-user-menu">
                    <div class="auth-user-info" onclick="AuthHeader.toggleDropdown()">
                        <div class="auth-user-avatar">
                            ${user.avatar ?
                                `<img src="${user.avatar}" alt="${displayName}">` :
                                avatarLetter
                            }
                        </div>
                        <span class="auth-user-name">${displayName}</span>
                        <span class="auth-points-badge">${user.points || 0} 积分</span>
                        <span style="font-size: 0.75rem;">▼</span>
                    </div>
                    <div class="auth-dropdown" id="authDropdown">
                        <a href="/src/pages/profile.html" class="auth-dropdown-item">
                            <span>👤</span> 个人资料
                        </a>
                        <a href="/src/pages/my-courses.html" class="auth-dropdown-item">
                            <span>📚</span> 我的课程
                        </a>
                        <a href="/src/pages/orders.html" class="auth-dropdown-item">
                            <span>📦</span> 我的订单
                        </a>
                        <a href="/src/pages/achievements.html" class="auth-dropdown-item">
                            <span>🏆</span> 我的成就
                        </a>
                        <a href="/src/pages/certificates.html" class="auth-dropdown-item">
                            <span>🎓</span> 我的证书
                        </a>
                        <div class="auth-dropdown-divider"></div>
                        <a href="#" class="auth-dropdown-item" onclick="AuthHeader.logout(); return false;">
                            <span>🚪</span> 退出登录
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 切换下拉菜单
     */
    toggleDropdown() {
        const dropdown = document.getElementById('authDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },

    /**
     * 登出
     */
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/src/pages/login.html';
        }
    }
};

// 点击页面其他地方关闭下拉菜单
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('authDropdown');
    const userMenu = document.querySelector('.auth-user-menu');
    if (dropdown && userMenu && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// 导出全局对象
window.AuthHeader = AuthHeader;
