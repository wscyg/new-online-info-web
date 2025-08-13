// API配置
const API_BASE_URL = 'http://42.194.245.66:8070/api';

// 用户认证状态
let isAuthenticated = false;
let currentUser = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    animateStats();
    checkAuthStatus();
});

// 初始化应用
function initializeApp() {
    // 添加滚动效果
    window.addEventListener('scroll', handleScroll);
    
    // 添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 初始化表单事件
    initializeForms();
}

// 滚动处理
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
}

// 统计数字动画
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElement = entry.target;
                const targetCount = parseInt(statElement.dataset.count);
                animateNumber(statElement, targetCount);
                observer.unobserve(statElement);
            }
        });
    }, observerOptions);
    
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

// 数字动画函数
function animateNumber(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}

// 滚动到功能区域
function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 显示登录弹窗
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 隐藏登录弹窗
function hideLogin() {
    document.getElementById('loginModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 显示注册弹窗
function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 隐藏注册弹窗
function hideRegister() {
    document.getElementById('registerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 初始化表单
function initializeForms() {
    // 登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 注册表单
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(event) {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (event.target === loginModal) {
            hideLogin();
        }
        if (event.target === registerModal) {
            hideRegister();
        }
    });
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username') || e.target.elements[0].value,
        password: formData.get('password') || e.target.elements[1].value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 保存token和用户信息
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            
            currentUser = result.data.user;
            isAuthenticated = true;
            
            updateAuthUI();
            hideLogin();
            
            showNotification('登录成功！', 'success');
            
            // 可选：重定向到学习中心
            setTimeout(() => {
                window.location.href = 'src/pages/dashboard.html';
            }, 1500);
            
        } else {
            showNotification(result.message || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showNotification('登录失败，请检查网络连接', 'error');
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const password = formData.get('password') || e.target.elements[2].value;
    const confirmPassword = formData.get('confirmPassword') || e.target.elements[3].value;
    
    if (password !== confirmPassword) {
        showNotification('密码不匹配', 'error');
        return;
    }
    
    const registerData = {
        username: formData.get('username') || e.target.elements[0].value,
        email: formData.get('email') || e.target.elements[1].value,
        password: password
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            hideRegister();
            showNotification('注册成功！请登录', 'success');
            setTimeout(showLogin, 1000);
        } else {
            showNotification(result.message || '注册失败', 'error');
        }
    } catch (error) {
        console.error('注册错误:', error);
        showNotification('注册失败，请检查网络连接', 'error');
    }
}

// 检查认证状态
function checkAuthStatus() {
    console.log('=== main.js 认证状态检查 ===');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Token:', token ? `存在 (长度: ${token.length})` : '不存在');
    console.log('User:', user ? `存在 (长度: ${user.length})` : '不存在');
    
    if (token && user) {
        try {
            console.log('尝试解析用户数据:', user);
            currentUser = JSON.parse(user);
            isAuthenticated = true;
            console.log('用户数据解析成功:', currentUser.username);
            updateAuthUI();
        } catch (error) {
            console.error('用户信息解析错误:', error);
            console.error('原始用户数据:', user);
            console.warn('即将清除localStorage - 这可能是导致登录状态丢失的原因');
            // 暂时注释掉自动清除，用于调试
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
        }
    } else {
        console.log('Token或User数据缺失，未执行认证');
    }
}

// 更新认证UI
function updateAuthUI() {
    const authContainer = document.querySelector('.nav-auth');
    
    if (isAuthenticated && currentUser) {
        authContainer.innerHTML = `
            <div class="user-menu">
                <span class="welcome-text">欢迎，${currentUser.username}</span>
                <button class="btn-logout" onclick="handleLogout()">退出</button>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <button class="btn-login" onclick="showLogin()">登录</button>
            <button class="btn-register" onclick="showRegister()">注册</button>
        `;
    }
}

// 处理退出登录
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    isAuthenticated = false;
    updateAuthUI();
    showNotification('已退出登录', 'info');
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">&times;</button>
        </div>
    `;
    
    // 添加样式（如果不存在）
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 3000;
                min-width: 300px;
                padding: 1rem;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                animation: slideInNotification 0.3s ease-out;
            }
            
            .notification-success { background: linear-gradient(135deg, #10b981, #059669); }
            .notification-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .notification-info { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: 1rem;
            }
            
            @keyframes slideInNotification {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// 工具函数：获取认证头
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 工具函数：API请求
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        const result = await response.json();
        
        // 处理认证失败
        if (response.status === 401) {
            handleLogout();
            showNotification('登录已过期，请重新登录', 'error');
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('API请求错误:', error);
        showNotification('网络请求失败', 'error');
        return null;
    }
}

// 导出函数供其他页面使用
window.apiRequest = apiRequest;
window.getAuthHeaders = getAuthHeaders;
window.showNotification = showNotification;
window.isAuthenticated = () => isAuthenticated;
window.getCurrentUser = () => currentUser;