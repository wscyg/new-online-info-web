/**
 * API配置文件
 * 统一管理所有API端点
 * 自动根据环境切换BASE_URL
 */

// 环境检测
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname === '42.194.245.66' || !isDevelopment;

// API基础配置
const API_CONFIG = {
    // 基础URL
    BASE_URL: isDevelopment
        ? 'http://localhost:8070/api'
        : 'http://42.194.245.66:8070/api',

    // WebSocket URL
    WS_BASE_URL: isDevelopment
        ? 'ws://localhost:8070/ws'
        : 'ws://42.194.245.66:8070/ws',

    // 超时时间（毫秒）
    TIMEOUT: 30000,

    // 重试次数
    RETRY_COUNT: 3,

    // Token存储键
    TOKEN_KEY: 'token',

    // 环境标识
    ENVIRONMENT: isDevelopment ? 'development' : 'production'
};

// API端点配置
const API_ENDPOINTS = {
    // 认证相关
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        CHECK_USERNAME: '/auth/check-username',
        REFRESH_TOKEN: '/auth/refresh'
    },

    // 用户相关
    USER: {
        PROFILE: '/user/profile',
        UPDATE_PROFILE: '/user/profile',
        CHANGE_PASSWORD: '/user/change-password',
        AVATAR: '/user/avatar'
    },

    // 课程相关
    COURSE: {
        LIST: '/courses',
        DETAIL: '/courses',
        CHAPTERS: '/content/courses',
        CONTENT: '/content/chapters',
        SUBSCRIBE: '/orders/subscribe/course'
    },

    // 学习相关
    LEARNING: {
        PROGRESS: '/learning/progress',
        UPDATE_PROGRESS: '/learning/progress/update',
        STUDY_TIME: '/learning/study-time',
        CERTIFICATES: '/certificates/my'
    },

    // 签到相关
    CHECKIN: {
        CHECK_IN: '/checkin',
        STATS: '/checkin/stats',
        LEADERBOARD: '/checkin/leaderboard'
    },

    // 邀请相关
    INVITATION: {
        MY_CODE: '/invitation/my-code',
        MY_STATS: '/invitation/my-stats',
        REGISTER_WITH_CODE: '/invitation/register-with-code',
        LEADERBOARD: '/invitation/leaderboard'
    },

    // 抽奖相关
    LOTTERY: {
        DRAW: '/lottery/draw',
        MY_STATS: '/lottery/my-stats',
        POOLS: '/lottery/pools',
        POOL_PRIZES: '/lottery/pools',
        RECORDS: '/lottery/my-stats'
    },

    // PK相关
    PK: {
        MATCH: '/pk/match',
        START: '/pk/start',
        ANSWER: '/pk/answer',
        RESULT: '/pk/result',
        RANKINGS: '/pk/rankings',
        FRIENDS: '/pk/friends',
        REPLAY: '/pk/replay'
    },

    // 积分相关
    POINTS: {
        BALANCE: '/points/balance',
        TRANSACTIONS: '/points/transactions',
        SHOP: '/points-shop/items',
        EXCHANGE: '/points-shop/exchange'
    },

    // 成就相关
    ACHIEVEMENT: {
        LIST: '/achievements/my',
        UNLOCK: '/achievements/unlock',
        SHARE: '/achievements/share'
    },

    // 社交相关
    SOCIAL: {
        NOTES: '/notes',
        COMMENTS: '/comments',
        QA: '/qa',
        COMMUNITY: '/community'
    }
};

// 统一的API请求封装
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    // 获取Token
    getToken() {
        return localStorage.getItem(API_CONFIG.TOKEN_KEY);
    }

    // 设置Token
    setToken(token) {
        localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
    }

    // 清除Token
    clearToken() {
        localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    }

    // 构建完整URL
    buildURL(endpoint) {
        return `${this.baseURL}${endpoint}`;
    }

    // 构建请求头
    buildHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // GET请求
    async get(endpoint, params = {}) {
        const url = new URL(this.buildURL(endpoint));
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.buildHeaders(),
                signal: AbortSignal.timeout(this.timeout)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // POST请求
    async post(endpoint, data = {}, customHeaders = {}) {
        try {
            const response = await fetch(this.buildURL(endpoint), {
                method: 'POST',
                headers: this.buildHeaders(customHeaders),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.timeout)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // PUT请求
    async put(endpoint, data = {}) {
        try {
            const response = await fetch(this.buildURL(endpoint), {
                method: 'PUT',
                headers: this.buildHeaders(),
                body: JSON.stringify(data),
                signal: AbortSignal.timeout(this.timeout)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // DELETE请求
    async delete(endpoint) {
        try {
            const response = await fetch(this.buildURL(endpoint), {
                method: 'DELETE',
                headers: this.buildHeaders(),
                signal: AbortSignal.timeout(this.timeout)
            });

            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    // 处理响应
    async handleResponse(response) {
        if (!response.ok) {
            // 特殊处理401未授权
            if (response.status === 401) {
                this.clearToken();
                window.location.href = '/src/pages/login.html';
                throw new Error('未授权，请重新登录');
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 统一处理后端返回格式
        if (data.code && data.code !== 200) {
            throw new Error(data.message || '请求失败');
        }

        return data;
    }

    // 处理错误
    handleError(error) {
        console.error('API Error:', error);

        // 显示错误提示（如果有toast组件）
        if (window.showToast) {
            window.showToast(error.message, 'error');
        } else if (window.alert) {
            alert(error.message);
        }

        throw error;
    }
}

// 创建全局API客户端实例
const apiClient = new APIClient();

// 导出配置和客户端
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = {
        API_CONFIG,
        API_ENDPOINTS,
        APIClient,
        apiClient
    };
} else {
    // 浏览器环境 - 挂载到window对象
    window.API_CONFIG = API_CONFIG;
    window.API_ENDPOINTS = API_ENDPOINTS;
    window.APIClient = APIClient;
    window.apiClient = apiClient;
}

// 使用示例
/*
// 方式1: 使用apiClient（推荐）
const result = await apiClient.get('/courses');

// 方式2: 使用API_ENDPOINTS常量
const loginResult = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    username: 'user@example.com',
    password: 'password123'
});

// 方式3: 直接使用旧方式（向后兼容）
const response = await fetch(`${API_CONFIG.BASE_URL}/courses`, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});
*/

console.log(`🚀 API Config loaded - Environment: ${API_CONFIG.ENVIRONMENT}`);
console.log(`📡 API Base URL: ${API_CONFIG.BASE_URL}`);
