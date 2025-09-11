// Universal User Menu Component
// This handles user authentication, profile display, and menu interactions across all pages

class UserMenuManager {
    constructor() {
        this.currentUser = null;
        this.isMenuOpen = false;
        this.authCheckInterval = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.startAuthCheck();
    }

    // 定期检查认证状态
    startAuthCheck() {
        // 每30秒检查一次认证状态
        this.authCheckInterval = setInterval(() => {
            this.checkAuth();
        }, 30000);
    }

    // 停止认证检查
    stopAuthCheck() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        const authContainer = document.getElementById('authContainer');
        const userProfile = document.getElementById('userProfile');
        
        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                if (authContainer) authContainer.style.display = 'none';
                if (userProfile) userProfile.style.display = 'flex';
                
                this.updateUserDisplay();
            } catch (error) {
                console.error('用户数据解析失败:', error);
                this.logout();
            }
        } else {
            if (authContainer) authContainer.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        }
    }

    updateUserDisplay() {
        const userName = document.getElementById('userName');
        const userPoints = document.getElementById('userPoints');
        const userAvatar = document.getElementById('userAvatar');
        
        if (this.currentUser) {
            if (userName) {
                userName.textContent = this.currentUser.username || this.currentUser.name || '用户';
            }
            if (userPoints) {
                userPoints.textContent = this.currentUser.points || 0;
            }
            if (userAvatar && this.currentUser.avatar) {
                userAvatar.src = this.currentUser.avatar;
            }
        }
    }

    setupEventListeners() {
        // Global click handler to close menu when clicking outside
        document.addEventListener('click', (event) => {
            const userProfile = document.querySelector('.user-profile');
            const userMenu = document.getElementById('userMenu');
            
            if (userProfile && !userProfile.contains(event.target)) {
                this.closeMenu();
            }
        });

        // Escape key to close menu
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        const userMenu = document.getElementById('userMenu');
        if (!userMenu) return;

        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            userMenu.classList.add('show');
        } else {
            userMenu.classList.remove('show');
        }
        
        // Add accessibility attributes
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            userAvatar.setAttribute('aria-expanded', this.isMenuOpen);
        }
    }

    closeMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu && this.isMenuOpen) {
            userMenu.classList.remove('show');
            this.isMenuOpen = false;
            
            const userAvatar = document.querySelector('.user-avatar');
            if (userAvatar) {
                userAvatar.setAttribute('aria-expanded', 'false');
            }
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        
        // Clear user data
        this.currentUser = null;
        this.closeMenu();
        
        // Update UI
        const authContainer = document.getElementById('authContainer');
        const userProfile = document.getElementById('userProfile');
        
        if (authContainer) authContainer.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
        
        // Redirect to home page
        window.location.href = '/index.html';
    }

    // Method to be called from HTML onclick handlers
    handleAvatarClick(event) {
        event.stopPropagation();
        this.toggleMenu();
    }

    handleLogout(event) {
        event.preventDefault();
        if (confirm('确定要退出登录吗？')) {
            this.logout();
        }
    }
}

// Create global instance
let userMenuManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    userMenuManager = new UserMenuManager();
    
    // Make functions available globally for onclick handlers
    window.toggleUserMenu = () => userMenuManager.toggleMenu();
    window.handleLogout = () => userMenuManager.handleLogout();
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserMenuManager;
}