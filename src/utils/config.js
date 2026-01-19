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
        BASE_URL: '/api',
        TIMEOUT: 30000,
        RETRY_COUNT: 3,
        // API端点配置
        ENDPOINTS: {
            // 认证相关
            auth: {
                login: '/auth/login',
                register: '/auth/register',
                logout: '/auth/logout',
                forgotPassword: '/auth/forgot-password',
                resetPassword: '/auth/reset-password',
                sendEmailVerification: '/auth/send-email-verification',
                verifyEmailCode: '/auth/verify-email-code',
                checkUsername: '/auth/check-username',
                checkEmail: '/auth/check-email'
            },
            // 用户相关
            user: {
                profile: '/user/profile',
                updateProfile: '/user/profile',
                uploadAvatar: '/user/avatar',
                verifyEmail: '/user/verify-email',
                verifyPhone: '/user/verify-phone',
                changePassword: '/user/change-password',
                statistics: '/user/statistics'
            },
            // 课程相关
            courses: {
                list: '/courses',
                detail: '/courses/:id',
                chapters: '/content/courses/:id/chapters',
                content: '/content/chapters/:id/content',
                enroll: '/courses/:id/enroll',
                myProgress: '/content/courses/:id/my-progress',
                updateProgress: '/content/chapters/:id/progress'
            },
            // 订阅和支付
            subscription: {
                create: '/subscription/create',
                check: '/subscription/check',
                list: '/subscription/list',
                cancel: '/subscription/:id/cancel'
            },
            payment: {
                create: '/payment/create',
                query: '/payment/query/:orderNo',
                callback: '/payment/callback',
                refund: '/payment/refund'
            },
            // 学习相关
            learning: {
                progress: '/learning/progress',
                statistics: '/learning/statistics',
                recentActivity: '/learning/recent-activity'
            },
            // 其他
            notifications: '/notifications',
            points: '/points',
            achievements: '/achievements'
        }
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
        getApiUrl(endpoint, params = {}) {
            if (endpoint.startsWith('http')) {
                return endpoint;
            }
            if (!endpoint.startsWith('/')) {
                endpoint = '/' + endpoint;
            }

            // 替换路径参数 (e.g., /courses/:id -> /courses/123)
            Object.keys(params).forEach(key => {
                endpoint = endpoint.replace(`:${key}`, params[key]);
            });

            return API_CONFIG.BASE_URL + endpoint;
        },

        // 构建完整的API请求配置
        buildApiRequest(endpoint, options = {}) {
            const config = {
                url: helpers.getApiUrl(endpoint, options.params),
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: options.timeout || API_CONFIG.TIMEOUT
            };

            // 添加认证token
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            // 添加请求体
            if (options.data) {
                config.body = JSON.stringify(options.data);
            }

            return config;
        },

        // 通用API请求函数（带错误处理和重试）
        async apiRequest(endpoint, options = {}) {
            const config = helpers.buildApiRequest(endpoint, options);
            let lastError;

            // 重试逻辑
            for (let attempt = 0; attempt <= (options.retryCount || API_CONFIG.RETRY_COUNT); attempt++) {
                try {
                    const response = await fetch(config.url, {
                        method: config.method,
                        headers: config.headers,
                        body: config.body
                    });

                    // 处理未授权
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        if (options.redirectOnUnauth !== false) {
                            helpers.navigateToLogin();
                        }
                        throw new Error('未授权，请重新登录');
                    }

                    // 解析响应
                    const data = await response.json();

                    // 检查业务逻辑错误
                    if (!response.ok || !data.success) {
                        throw new Error(data.message || `请求失败: ${response.status}`);
                    }

                    return data;

                } catch (error) {
                    lastError = error;

                    // 如果是最后一次尝试，抛出错误
                    if (attempt === (options.retryCount || API_CONFIG.RETRY_COUNT)) {
                        throw lastError;
                    }

                    // 等待后重试
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }

            throw lastError;
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
