/**
 * 全局配置文件
 * 统一管理API地址、路径等配置
 */

(function() {
    // 环境检测
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // API配置
    const API_CONFIG = {
        BASE_URL: isDevelopment 
            ? 'http://localhost:8080/api' 
            : 'http://42.194.245.66/api',
        TIMEOUT: 30000,
        RETRY_COUNT: 3
    };
    
    // 页面路径配置
    const PAGE_CONFIG = {
        BASE_PATH: isDevelopment ? '/src/pages' : '',
        HOME_PATH: isDevelopment ? '/home.html' : '/index.html'
    };
    
    // 页面路径映射
    const PAGES = {
        login: `${PAGE_CONFIG.BASE_PATH}/login.html`,
        register: `${PAGE_CONFIG.BASE_PATH}/register.html`,
        courses: `${PAGE_CONFIG.BASE_PATH}/courses.html`,
        courseDetail: `${PAGE_CONFIG.BASE_PATH}/course-detail.html`,
        study: `${PAGE_CONFIG.BASE_PATH}/study.html`,
        dashboard: `${PAGE_CONFIG.BASE_PATH}/dashboard.html`,
        profile: `${PAGE_CONFIG.BASE_PATH}/profile.html`,
        payment: `${PAGE_CONFIG.BASE_PATH}/payment.html`,
        orders: `${PAGE_CONFIG.BASE_PATH}/orders.html`,
        qa: `${PAGE_CONFIG.BASE_PATH}/qa.html`,
        notes: `${PAGE_CONFIG.BASE_PATH}/notes.html`,
        achievements: `${PAGE_CONFIG.BASE_PATH}/achievements.html`,
        certificates: `${PAGE_CONFIG.BASE_PATH}/certificates.html`,
        studyRoom: `${PAGE_CONFIG.BASE_PATH}/study-room.html`,
        studyPlan: `${PAGE_CONFIG.BASE_PATH}/study-plan.html`,
        pointsShop: `${PAGE_CONFIG.BASE_PATH}/points-shop.html`,
        home: PAGE_CONFIG.HOME_PATH
    };
    
    // 辅助函数
    const helpers = {
        // 获取页面URL
        getPageUrl(pageName, params = {}) {
            const url = PAGES[pageName] || '/';
            if (Object.keys(params).length > 0) {
                const queryString = new URLSearchParams(params).toString();
                return `${url}?${queryString}`;
            }
            return url;
        },
        
        // 导航到页面
        navigateTo(pageName, params = {}) {
            window.location.href = helpers.getPageUrl(pageName, params);
        },
        
        // 导航到登录页（带返回URL）
        navigateToLogin(returnUrl = null) {
            const url = returnUrl || window.location.href;
            helpers.navigateTo('login', { returnUrl: encodeURIComponent(url) });
        },
        
        // 检查登录状态
        checkAuth(redirectToLogin = true) {
            const token = localStorage.getItem('token');
            if (!token && redirectToLogin) {
                helpers.navigateToLogin();
                return false;
            }
            return !!token;
        },
        
        // 获取API URL
        getApiUrl(endpoint) {
            if (endpoint.startsWith('http')) {
                return endpoint;
            }
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }
            return API_CONFIG.BASE_URL + endpoint;
        }
    };
    
    // 导出到全局
    window.AppConfig = {
        isDevelopment,
        API: API_CONFIG,
        PAGES: PAGES,
        ...helpers
    };
    
    // 兼容旧代码
    window.API_BASE_URL = API_CONFIG.BASE_URL;
    window.getPageUrl = helpers.getPageUrl;
    window.navigateTo = helpers.navigateTo;
    window.navigateToLogin = helpers.navigateToLogin;
    window.checkAuth = helpers.checkAuth;
    
    console.log('AppConfig initialized:', {
        environment: isDevelopment ? 'Development' : 'Production',
        apiBase: API_CONFIG.BASE_URL,
        basePath: PAGE_CONFIG.BASE_PATH
    });
})();