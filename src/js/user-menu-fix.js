// User Menu Fix for Profile and Courses Pages
(function() {
    'use strict';

    // Enhanced toggleUserMenu function
    window.toggleUserMenu = function(event) {
        if (event) {
            event.stopPropagation();
        }
        
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            // Toggle visibility
            if (userMenu.style.display === 'block') {
                userMenu.style.display = 'none';
            } else {
                userMenu.style.display = 'block';
                
                // Update user info if logged in
                updateUserMenuInfo();
            }
        }
    };

    // Update user information in the menu
    function updateUserMenuInfo() {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                
                // Update username
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = userData.nickname || userData.username || '用户';
                }
                
                // Update points
                const userPointsElement = document.getElementById('userPoints');
                if (userPointsElement) {
                    userPointsElement.textContent = userData.points || '0';
                }
                
                // Update avatar if exists
                const userAvatarElement = document.getElementById('userAvatar');
                if (userAvatarElement && userData.avatar) {
                    userAvatarElement.src = userData.avatar;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }

    // Logout function
    window.logout = function() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            
            // Show notification if function exists
            if (typeof showNotification === 'function') {
                showNotification('已退出登录', 'success');
            }
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    };

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const userProfile = document.querySelector('.user-profile');
        const userMenu = document.getElementById('userMenu');
        
        if (userMenu && userProfile && !userProfile.contains(event.target)) {
            userMenu.style.display = 'none';
        }
    });

    // Ensure menu styles are correct
    function fixMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .user-menu {
                display: none;
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                min-width: 250px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                z-index: 10001;
                transition: all 0.3s ease;
            }
            
            .user-profile {
                position: relative;
            }
            
            .user-avatar {
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .user-avatar:hover {
                transform: scale(1.05);
            }
            
            .user-menu.show {
                display: block !important;
            }
            
            .menu-item {
                display: flex;
                align-items: center;
                padding: 0.8rem 1rem;
                color: #475569;
                text-decoration: none;
                transition: all 0.3s ease;
                gap: 0.8rem;
            }
            
            .menu-item:hover {
                background: rgba(59, 130, 246, 0.05);
                color: #0f172a;
            }
            
            .menu-divider {
                height: 1px;
                background: #e2e8f0;
                margin: 0.25rem 0;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixMenuStyles();
        });
    } else {
        fixMenuStyles();
    }
})();