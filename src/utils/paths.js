/**
 * 路径配置文件 - 集中管理所有页面路径
 * 生产环境和开发环境都能正确工作
 */

// 判断是否在开发环境
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 基础路径配置
const BASE_PATH = isDevelopment ? '/src/pages' : '';

// 页面路径映射
const PAGE_PATHS = {
    login: `${BASE_PATH}/login.html`,
    register: `${BASE_PATH}/register.html`,
    courses: `${BASE_PATH}/courses.html`,
    courseDetail: `${BASE_PATH}/course-detail.html`,
    study: `${BASE_PATH}/study.html`,
    dashboard: `${BASE_PATH}/dashboard.html`,
    profile: `${BASE_PATH}/profile.html`,
    payment: `${BASE_PATH}/payment.html`,
    orders: `${BASE_PATH}/orders.html`,
    qa: `${BASE_PATH}/qa.html`,
    notes: `${BASE_PATH}/notes.html`,
    achievements: `${BASE_PATH}/achievements.html`,
    certificates: `${BASE_PATH}/certificates.html`,
    studyRoom: `${BASE_PATH}/study-room.html`,
    studyPlan: `${BASE_PATH}/study-plan.html`,
    pointsShop: `${BASE_PATH}/points-shop.html`,
    home: isDevelopment ? '/home.html' : '/index.html'
};

// 获取页面路径的函数
function getPagePath(pageName, params = {}) {
    const path = PAGE_PATHS[pageName];
    if (!path) {
        console.warn(`Page path not found for: ${pageName}`);
        return '/';
    }
    
    // 添加查询参数
    if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        return `${path}?${queryString}`;
    }
    
    return path;
}

// 导航函数
function navigateTo(pageName, params = {}) {
    const path = getPagePath(pageName, params);
    window.location.href = path;
}

// 检查是否需要登录
function checkAuthAndNavigate(pageName, params = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        navigateTo('login', { returnUrl: encodeURIComponent(window.location.href) });
        return false;
    }
    if (pageName) {
        navigateTo(pageName, params);
    }
    return true;
}

// 导出到全局
window.AppPaths = {
    PAGE_PATHS,
    getPagePath,
    navigateTo,
    checkAuthAndNavigate,
    isDevelopment
};

// 为了兼容性，也导出到window对象
window.getPagePath = getPagePath;
window.navigateTo = navigateTo;
window.checkAuthAndNavigate = checkAuthAndNavigate;