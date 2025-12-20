// Common Header Component
(function() {
    'use strict';

    // Header HTML Template
    const headerHTML = `
        <nav class="top-nav">
            <div class="nav-container">
                <div class="nav-left">
                    <a href="../../index.html" class="logo">AI未来学院</a>
                    <div class="nav-links">
                        <a href="dashboard.html" class="nav-link" data-page="dashboard">学习中心</a>
                        <a href="courses.html" class="nav-link" data-page="courses">课程</a>
                        <a href="diagnostic.html" class="nav-link" data-page="diagnostic">入学诊断</a>
                        <a href="pk-arena.html" class="nav-link" data-page="pk">PK竞技</a>
                        <a href="talent-radar.html" class="nav-link" data-page="talent">天赋雷达</a>
                        <a href="achievements.html" class="nav-link" data-page="achievements">成就</a>
                        <a href="daily-challenges.html" class="nav-link" data-page="challenges">每日挑战</a>
                        <a href="mentorship-dashboard.html" class="nav-link" data-page="mentorship">师徒</a>
                    </div>
                </div>
                <div class="user-menu-container">
                    <div class="user-info" onclick="CommonHeader.toggleUserMenu(event)">
                        <div class="user-avatar" id="userAvatar">U</div>
                        <span class="user-name" id="userName">加载中...</span>
                        <span class="dropdown-arrow">▼</span>
                    </div>
                    <div class="dropdown-menu" id="userDropdown">
                        <a href="profile.html" class="dropdown-item">
                            <span>👤</span> 个人资料
                        </a>
                        <a href="orders.html" class="dropdown-item">
                            <span>📦</span> 我的订单
                        </a>
                        <a href="certificates.html" class="dropdown-item">
                            <span>🎓</span> 我的证书
                        </a>
                        <a href="points-shop.html" class="dropdown-item">
                            <span>💎</span> 积分商城
                        </a>
                        <a href="study-plan.html" class="dropdown-item">
                            <span>📅</span> 学习计划
                        </a>
                        <a href="leaderboard.html" class="dropdown-item">
                            <span>🏅</span> 排行榜
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" onclick="CommonHeader.logout()">
                            <span>🚪</span> 退出登录
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Header Styles
    const headerStyles = `
        <style>
            .top-nav {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 0;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                position: sticky;
                top: 0;
                z-index: 1000;
            }

            .nav-container {
                max-width: 1400px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 2rem;
            }

            .nav-left {
                display: flex;
                align-items: center;
                gap: 2rem;
            }

            .logo {
                color: white;
                font-size: 1.5rem;
                font-weight: bold;
                padding: 1rem 0;
                text-decoration: none;
            }

            .nav-links {
                display: flex;
                gap: 0;
            }

            .nav-link {
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                padding: 1.5rem 1rem;
                transition: all 0.3s;
                position: relative;
            }

            .nav-link:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .nav-link.active {
                color: white;
            }

            .nav-link.active::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: white;
            }

            .user-menu-container {
                position: relative;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                padding: 0.5rem 1rem;
                border-radius: 2rem;
                background: rgba(255, 255, 255, 0.2);
                transition: all 0.3s;
            }

            .user-info:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .user-avatar {
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

            .user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .user-name {
                color: white;
                font-weight: 500;
            }

            .dropdown-arrow {
                color: white;
                font-size: 0.75rem;
                transition: transform 0.3s;
            }

            .user-menu-container.active .dropdown-arrow {
                transform: rotate(180deg);
            }

            .dropdown-menu {
                position: absolute;
                top: calc(100% + 0.5rem);
                right: 0;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                min-width: 220px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s;
            }

            .dropdown-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .dropdown-item {
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #333;
                text-decoration: none;
                transition: background 0.2s;
            }

            .dropdown-item:hover {
                background: #f7fafc;
            }

            .dropdown-item:first-child {
                border-radius: 0.5rem 0.5rem 0 0;
            }

            .dropdown-item:last-child {
                border-radius: 0 0 0.5rem 0.5rem;
            }

            .dropdown-divider {
                height: 1px;
                background: #e2e8f0;
                margin: 0.25rem 0;
            }

            @media (max-width: 768px) {
                .nav-links {
                    display: none;
                }
                
                .nav-container {
                    padding: 0 1rem;
                }
            }
        </style>
    `;

    // CommonHeader Object
    window.CommonHeader = {
        // Initialize header
        init: function(currentPage) {
            // Insert styles
            if (!document.getElementById('common-header-styles')) {
                const styleElement = document.createElement('div');
                styleElement.id = 'common-header-styles';
                styleElement.innerHTML = headerStyles;
                document.head.appendChild(styleElement.firstChild);
            }

            // Insert header HTML
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = headerHTML;
            } else {
                // If no container, prepend to body
                document.body.insertAdjacentHTML('afterbegin', headerHTML);
            }

            // Set active page
            if (currentPage) {
                const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }

            // Load user info
            this.loadUserInfo();

            // Setup event listeners
            this.setupEventListeners();
        },

        // Toggle user menu
        toggleUserMenu: function(event) {
            if (event) {
                event.stopPropagation();
            }
            const dropdown = document.getElementById('userDropdown');
            const container = document.querySelector('.user-menu-container');
            
            dropdown.classList.toggle('show');
            container.classList.toggle('active');
        },

        // Close dropdown when clicking outside
        setupEventListeners: function() {
            document.addEventListener('click', (event) => {
                const userMenu = document.querySelector('.user-menu-container');
                if (userMenu && !userMenu.contains(event.target)) {
                    document.getElementById('userDropdown').classList.remove('show');
                    userMenu.classList.remove('active');
                }
            });
        },

        // Load user info
        loadUserInfo: async function() {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch('/api/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const user = data.data.user;
                        
                        // Update user name
                        const nameElement = document.getElementById('userName');
                        if (nameElement) {
                            nameElement.textContent = user.nickname || user.username || '用户';
                        }
                        
                        // Update avatar
                        const avatarElement = document.getElementById('userAvatar');
                        if (avatarElement) {
                            if (user.avatar) {
                                avatarElement.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
                            } else {
                                const initial = (user.nickname || user.username || 'U').charAt(0).toUpperCase();
                                avatarElement.textContent = initial;
                            }
                        }
                    }
                } else if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error('Failed to load user info:', error);
            }
        },

        // Logout
        logout: function() {
            if (confirm('确定要退出登录吗？')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }
    };

    // Load utility scripts
    function loadUtilityScripts() {
        const scripts = [
            { id: 'global-notifications-script', path: 'global-notifications.js' },
            { id: 'error-handler-script', path: 'error-handler.js' },
            { id: 'api-cache-script', path: 'api-cache.js' }
        ];

        scripts.forEach(({ id, path }) => {
            if (document.getElementById(id)) return;

            const script = document.createElement('script');
            script.id = id;
            script.src = `../scripts/${path}`;
            script.onerror = () => {
                const altScript = document.createElement('script');
                altScript.src = `/src/scripts/${path}`;
                document.head.appendChild(altScript);
            };
            document.head.appendChild(script);
        });

        // Load mobile responsive CSS
        if (!document.getElementById('mobile-responsive-css')) {
            const link = document.createElement('link');
            link.id = 'mobile-responsive-css';
            link.rel = 'stylesheet';
            link.href = '../styles/mobile-responsive.css';
            link.onerror = () => {
                const altLink = document.createElement('link');
                altLink.rel = 'stylesheet';
                altLink.href = '/src/styles/mobile-responsive.css';
                document.head.appendChild(altLink);
            };
            document.head.appendChild(link);
        }
    }

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Auto detect current page from URL
            const path = window.location.pathname;
            const pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
            CommonHeader.init(pageName);
            loadUtilityScripts();
        });
    } else {
        const path = window.location.pathname;
        const pageName = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
        CommonHeader.init(pageName);
        loadUtilityScripts();
    }
})();