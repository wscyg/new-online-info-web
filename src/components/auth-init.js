/**
 * 通用认证初始化脚本
 * 确保所有页面都能正确显示登录状态
 */

(function() {
    console.log('===== Auth Init Script Started =====');
    console.log('Current page:', window.location.pathname);
    console.log('LocalStorage before init:');
    console.log('- token:', localStorage.getItem('token'));
    console.log('- user:', localStorage.getItem('user'));
    
    // 添加一个全局标记，防止多次初始化
    if (window.__authInitialized) {
        console.log('Auth already initialized, skipping');
        return;
    }
    window.__authInitialized = true;
    
    // 创建简单的认证UI组件
    function createAuthUI() {
        console.log('Creating auth UI...');
        
        // 清除旧的UI（如果存在）
        const oldAuth = document.getElementById('authContainer');
        const oldProfile = document.getElementById('userProfile');
        if (oldAuth) {
            console.log('Removing old auth container');
            oldAuth.remove();
        }
        if (oldProfile) {
            console.log('Removing old user profile');
            oldProfile.remove();
        }
        
        const navContainers = [
            '.nav-menu',
            '.nav-right',
            '.navbar-nav',
            'nav ul',
            '.header-right'
        ];
        
        let navContainer = null;
        for (const selector of navContainers) {
            navContainer = document.querySelector(selector);
            if (navContainer) {
                console.log('Found nav container:', selector);
                break;
            }
        }
        
        if (!navContainer) {
            console.warn('No navigation container found');
            return;
        }
        
        // 检查是否已存在认证UI
        if (document.getElementById('authContainer') || document.getElementById('userProfile')) {
            console.log('Auth UI already exists');
            return;
        }
        
        // 获取用户信息
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        console.log('Auth check - Token exists:', !!token);
        console.log('Auth check - User data exists:', !!userStr);
        
        if (token && userStr) {
            try {
                // 尝试解析用户数据
                let user = null;
                
                // 处理不同的数据格式
                try {
                    user = JSON.parse(userStr);
                } catch (e) {
                    console.error('Failed to parse user data as JSON:', e);
                    // 如果不是有效的JSON，可能是字符串格式的用户名
                    if (typeof userStr === 'string' && userStr.length > 0) {
                        user = { username: userStr };
                    }
                }
                
                if (!user) {
                    console.error('Invalid user data, showing login buttons');
                    createLoginButtons();
                    return;
                }
                
                // 提取用户名（兼容多种字段名）
                const userName = user.nickname || user.username || user.name || user.loginAccount || user.email || 'User';
                const avatarText = userName.charAt(0).toUpperCase();
                
                // 创建用户菜单
                const userProfile = document.createElement('div');
                userProfile.id = 'userProfile';
                userProfile.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    margin-left: 1rem;
                    position: relative;
                `;
                
                userProfile.innerHTML = `
                    <div class="user-menu-wrapper" style="position: relative;">
                        <div class="user-trigger" style="
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            padding: 0.5rem 1rem;
                            background: rgba(255,255,255,0.95);
                            border: 1px solid rgba(0,0,0,0.1);
                            border-radius: 25px;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                            <div style="
                                width: 32px;
                                height: 32px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-weight: 600;
                                font-size: 14px;
                            ">${avatarText}</div>
                            <span style="font-weight: 500; color: #1E293B;">${userName}</span>
                            <span style="font-size: 12px; color: #64748B;">▼</span>
                        </div>
                        <div class="user-dropdown" style="
                            position: absolute;
                            top: calc(100% + 0.5rem);
                            right: 0;
                            width: 280px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                            border: 1px solid rgba(0,0,0,0.1);
                            display: none;
                            z-index: 1000;
                        ">
                            <div style="padding: 1rem;">
                                <div style="padding: 0.5rem 0; border-bottom: 1px solid #E2E8F0; margin-bottom: 0.5rem;">
                                    <div style="font-weight: 600; color: #1E293B;">${userName}</div>
                                    <div style="font-size: 0.875rem; color: #64748B;">${user.email || ''}</div>
                                </div>
                                <a href="/src/pages/profile.html" style="
                                    display: block;
                                    padding: 0.75rem 1rem;
                                    text-decoration: none;
                                    color: #1E293B;
                                    border-radius: 6px;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='none'">
                                    👤 个人中心
                                </a>
                                <a href="/src/pages/courses.html" style="
                                    display: block;
                                    padding: 0.75rem 1rem;
                                    text-decoration: none;
                                    color: #1E293B;
                                    border-radius: 6px;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='none'">
                                    📚 我的课程
                                </a>
                                <a href="/src/pages/orders.html" style="
                                    display: block;
                                    padding: 0.75rem 1rem;
                                    text-decoration: none;
                                    color: #1E293B;
                                    border-radius: 6px;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='none'">
                                    📋 订单管理
                                </a>
                                <div style="margin: 0.5rem 0; border-top: 1px solid #E2E8F0;"></div>
                                <button onclick="handleLogout()" style="
                                    display: block;
                                    width: 100%;
                                    padding: 0.75rem 1rem;
                                    background: none;
                                    border: none;
                                    text-align: left;
                                    color: #EF4444;
                                    cursor: pointer;
                                    border-radius: 6px;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='none'">
                                    🚪 退出登录
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                navContainer.appendChild(userProfile);
                
                // 添加下拉菜单交互
                const trigger = userProfile.querySelector('.user-trigger');
                const dropdown = userProfile.querySelector('.user-dropdown');
                
                trigger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const isVisible = dropdown.style.display === 'block';
                    dropdown.style.display = isVisible ? 'none' : 'block';
                });
                
                // 点击外部关闭下拉菜单
                document.addEventListener('click', function() {
                    dropdown.style.display = 'none';
                });
                
                console.log('User menu created for:', userName);
            } catch (error) {
                console.error('Error parsing user data:', error);
                createLoginButtons();
            }
        } else {
            createLoginButtons();
        }
        
        function createLoginButtons() {
            const authContainer = document.createElement('div');
            authContainer.id = 'authContainer';
            authContainer.style.cssText = `
                display: inline-flex;
                gap: 1rem;
                align-items: center;
                margin-left: 1rem;
            `;
            
            authContainer.innerHTML = `
                <a href="/src/pages/login.html" style="
                    padding: 0.5rem 1.2rem;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 6px;
                    text-decoration: none;
                    color: #1E293B;
                    font-weight: 500;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='none'">
                    登录
                </a>
                <a href="/src/pages/register.html" style="
                    padding: 0.5rem 1.2rem;
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    color: white;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.2s;
                " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                    注册
                </a>
            `;
            
            navContainer.appendChild(authContainer);
            console.log('Login buttons created');
        }
    }
    
    // 全局退出登录函数
    window.handleLogout = function() {
        console.log('User logout initiated');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // 跳转到登录页面
        window.location.href = '/src/pages/login.html';
    };
    
    // 初始化函数
    function initAuth() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createAuthUI);
        } else {
            createAuthUI();
        }
    }
    
    // 立即执行初始化
    initAuth();
    
    // 暴露全局函数供其他页面调用
    window.initializeAuth = initAuth;
    window.refreshAuthUI = function() {
        // 移除旧的UI
        const oldAuth = document.getElementById('authContainer');
        const oldProfile = document.getElementById('userProfile');
        if (oldAuth) oldAuth.remove();
        if (oldProfile) oldProfile.remove();
        // 重新创建
        createAuthUI();
    };
    
    console.log('Auth initialization script loaded');
})();