/**
 * 现代化API服务
 * 增强版API服务，包含错误处理、重试机制、缓存等功能
 * 最后更新: 2025-08-30 13:00
 */

// 根据环境动态设置API基础URL - 强制刷新版本
const API_BASE_URL = (function() {
    const hostname = window.location.hostname;
    console.log('[API] 当前hostname:', hostname);
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // 开发环境
        console.log('[API] 使用开发环境API:', 'http://localhost:8080/api');
        return 'http://localhost:8080/api';
    } else {
        // 生产环境，使用当前访问的域名或IP
        const apiUrl = `${window.location.protocol}//${window.location.host}/api`;
        console.log('[API] 使用生产环境API:', apiUrl);
        return apiUrl;
    }
})();

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.requestQueue = new Map();
        this.cache = new Map();
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            retryableStatuses: [408, 429, 500, 502, 503, 504]
        };
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    setRefreshToken(refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
    }

    clearToken() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.cache.clear();
    }

    // 生成缓存key
    getCacheKey(url, options) {
        return `${url}_${JSON.stringify(options)}`;
    }

    // 缓存GET请求
    setCache(key, data, ttl = 300000) { // 默认5分钟缓存
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    // 防重复请求
    async dedupRequest(key, requestFn) {
        if (this.requestQueue.has(key)) {
            return this.requestQueue.get(key);
        }

        const promise = requestFn().finally(() => {
            this.requestQueue.delete(key);
        });

        this.requestQueue.set(key, promise);
        return promise;
    }

    // 刷新token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.setToken(data.data.accessToken);
                if (data.data.refreshToken) {
                    this.setRefreshToken(data.data.refreshToken);
                }
                return data.data.accessToken;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        // 刷新失败，清除所有token
        this.clearToken();
        // 使用相对路径，兼容不同环境
        const loginPath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? '/src/pages/login.html' 
            : '/login.html';
        window.location.href = loginPath;
        throw new Error('Token refresh failed');
    }

    // 重试机制
    async retryRequest(requestFn, retries = 0) {
        try {
            return await requestFn();
        } catch (error) {
            const isRetryable = this.retryConfig.retryableStatuses.includes(error.status) ||
                               error.name === 'TypeError'; // 网络错误
            
            if (retries < this.retryConfig.maxRetries && isRetryable) {
                const delay = this.retryConfig.retryDelay * Math.pow(2, retries); // 指数退避
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.retryRequest(requestFn, retries + 1);
            }
            
            throw error;
        }
    }

    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const requestFn = async () => {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers,
                mode: 'cors',
                credentials: 'include'
            });

            // 处理401错误，尝试刷新token
            if (response.status === 401 && this.token && this.refreshToken) {
                try {
                    await this.refreshAccessToken();
                    // 使用新token重新请求
                    headers['Authorization'] = `Bearer ${this.token}`;
                    return fetch(`${API_BASE_URL}${url}`, {
                        ...options,
                        headers,
                        mode: 'cors',
                        credentials: 'include'
                    });
                } catch (refreshError) {
                    // 刷新失败，返回原始401响应
                    return response;
                }
            }

            return response;
        };

        try {
            const response = await this.retryRequest(requestFn);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.response = data;
                
                if (response.status === 401) {
                    this.clearToken();
                    window.appState?.setState('notification', {
                        type: 'warning',
                        title: '登录已过期',
                        message: '请重新登录'
                    });
                    
                    setTimeout(() => {
                        const loginPath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                            ? '/src/pages/login.html'
                            : '/login.html';
                        window.location.href = loginPath;
                    }, 1500);
                }
                
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', {
                url: `${API_BASE_URL}${url}`,
                error: error.message,
                status: error.status
            });
            
            // 网络错误处理
            if (error.name === 'TypeError') {
                window.appState?.setState('notification', {
                    type: 'error',
                    title: '网络错误',
                    message: '请检查网络连接'
                });
            }
            
            throw error;
        }
    }

    async get(url, params = {}, options = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        // 检查缓存
        if (options.cache !== false) {
            const cacheKey = this.getCacheKey(fullUrl, { method: 'GET' });
            const cached = this.getCache(cacheKey);
            if (cached) {
                return cached;
            }
        }
        
        const requestKey = `GET_${fullUrl}`;
        return this.dedupRequest(requestKey, async () => {
            const result = await this.request(fullUrl, { method: 'GET' });
            
            // 缓存GET请求结果
            if (options.cache !== false) {
                const cacheKey = this.getCacheKey(fullUrl, { method: 'GET' });
                this.setCache(cacheKey, result, options.cacheTTL);
            }
            
            return result;
        });
    }

    async post(url, body = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(url, body = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }

    // 批量请求
    async batch(requests) {
        const promises = requests.map(({ method, url, body, params }) => {
            switch (method.toLowerCase()) {
                case 'get':
                    return this.get(url, params);
                case 'post':
                    return this.post(url, body);
                case 'put':
                    return this.put(url, body);
                case 'delete':
                    return this.delete(url);
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
        });

        return Promise.allSettled(promises);
    }

    // 上传文件（增强版）
    async uploadFile(url, file, additionalData = {}, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'POST',
                headers,
                body: formData,
                mode: 'cors',
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                throw error;
            }

            return data;
        } catch (error) {
            if (options.onError) {
                options.onError(error);
            }
            throw error;
        }
    }

    // 下载文件
    async downloadFile(url, filename) {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'GET',
                headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }
}

class AuthAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async register(userData) {
        const response = await this.api.post('/auth/register', userData);
        if (response.data && response.data.token) {
            this.api.setToken(response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async login(credentials) {
        // 适配后端接口，将username转换为loginAccount
        const loginData = {
            loginAccount: credentials.username || credentials.loginAccount,
            password: credentials.password,
            loginType: credentials.loginType || 'password',
            deviceType: 'web'
        };
        const response = await this.api.post('/auth/login', loginData);
        
        // 处理后端返回的嵌套数据结构
        let tokenData, userData;
        if (response.code === 200 && response.data) {
            // 后端返回格式: {code: 200, data: {token: "...", user: {...}}}
            tokenData = response.data.token;
            userData = response.data.user;
        } else if (response.data && response.data.token) {
            // 备用格式: {data: {token: "...", user: {...}}}
            tokenData = response.data.token;
            userData = response.data.user;
        }
        
        if (tokenData) {
            this.api.setToken(tokenData);
            if (userData) {
                // 确保用户数据完整性
                const completeUserData = {
                    ...userData,
                    loginAccount: credentials.loginAccount || credentials.username,
                    loginTime: new Date().toISOString()
                };
                localStorage.setItem('user', JSON.stringify(completeUserData));
                console.log('User data saved to localStorage:', completeUserData);
            }
        }
        
        return response;
    }

    async checkUsername(username) {
        return this.api.get('/auth/check-username', { username });
    }

    async checkEmail(email) {
        return this.api.get('/auth/check-email', { email });
    }

    async checkPhone(phone) {
        return this.api.get('/auth/check-phone', { phone });
    }

    logout() {
        this.api.clearToken();
        window.location.href = '/';
    }
}

class UserAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getProfile() {
        return this.api.get('/user/profile');
    }

    async updateProfile(userData) {
        return this.api.put('/user/profile', userData);
    }

    async changePassword(passwordData) {
        return this.api.put('/user/password', passwordData);
    }

    async getStats() {
        return this.api.get('/user/stats');
    }

    async dailyCheckin() {
        return this.api.post('/user/checkin');
    }

    async uploadAvatar(file) {
        return this.api.uploadFile('/user/avatar', file);
    }

    async getReferralCode() {
        return this.api.get('/user/referral-code');
    }

    async getOrders(params = {}) {
        return this.api.get('/user/orders', params);
    }

    async getCertificates() {
        return this.api.get('/user/certificates');
    }

    async getSkills() {
        return this.api.get('/user/skills');
    }

    async getLearningCalendar(year, month) {
        return this.api.get('/user/learning-calendar', { year, month });
    }

    async getRecentCourses() {
        return this.api.get('/user/recent-courses');
    }

    async getLearningPaths() {
        return this.api.get('/user/learning-paths');
    }

    async getWeeklyProgress() {
        return this.api.get('/user/weekly-progress');
    }

    async downloadCertificate(certificateId) {
        return this.api.downloadFile(`/user/certificates/${certificateId}/download`, `certificate-${certificateId}.pdf`);
    }

    async updateSettings(settings) {
        return this.api.put('/user/settings', settings);
    }

    async getSettings() {
        return this.api.get('/user/settings');
    }
}

class CourseAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getCourses(params = {}) {
        return this.api.get('/courses', params);
    }

    async getCourseById(id) {
        return this.api.get(`/courses/${id}`);
    }

    async getCourseBySlug(slug) {
        return this.api.get(`/courses/slug/${slug}`);
    }

    async getCoursesByCategory(categoryId, params = {}) {
        return this.api.get(`/courses/category/${categoryId}`, params);
    }

    async getRecommendedCourses() {
        return this.api.get('/courses/recommended');
    }

    async getHotCourses() {
        return this.api.get('/courses/hot');
    }

    async getFreeCourses() {
        return this.api.get('/courses/free');
    }

    async searchCourses(keyword, params = {}) {
        return this.api.get('/courses/search', { keyword, ...params });
    }

    async getCourseStats(courseId) {
        return this.api.get(`/courses/${courseId}/stats`);
    }

    async checkSubscriptionStatus(courseId) {
        return this.api.get(`/courses/${courseId}/subscription-status`);
    }

    async purchaseCourse(courseId) {
        return this.api.post(`/courses/${courseId}/purchase`);
    }
}

class ContentAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getCourseChapters(courseId) {
        return this.api.get(`/content/courses/${courseId}/chapters`);
    }

    async getChapterDetails(chapterId) {
        return this.api.get(`/content/chapters/${chapterId}`);
    }

    async searchContent(keyword, params = {}) {
        return this.api.get('/content/search', { keyword, ...params });
    }

    async updateChapterProgress(chapterId, progress) {
        return this.api.post(`/content/chapters/${chapterId}/progress`, { progress });
    }

    async getUserCourseProgress(courseId) {
        return this.api.get(`/content/courses/${courseId}/my-progress`);
    }
}

class LearningAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async startLearningChapter(chapterId) {
        return this.api.post(`/learning/start/${chapterId}`);
    }

    async updateProgress(progressData) {
        return this.api.post('/learning/progress/update', progressData);
    }

    async getCourseProgress(courseId) {
        return this.api.get(`/learning/progress/course/${courseId}`);
    }

    async getStatistics() {
        return this.api.get('/learning/statistics');
    }
}

class PaymentAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async createAlipayPayment(paymentData) {
        return this.api.post('/payment/alipay/create', paymentData);
    }

    async createPayment(paymentData) {
        return this.api.post('/payment/create', paymentData);
    }

    async getPaymentStatus(orderNo) {
        return this.api.get(`/payment/status/${orderNo}`);
    }

    async createPointsPayment(paymentData) {
        return this.api.post('/payment/points/create', paymentData);
    }

    async requestRefund(refundData) {
        return this.api.post('/payment/refund', refundData);
    }

    async getPaymentRecords(params = {}) {
        return this.api.get('/payment/records', params);
    }
}

class OrderAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async createOrder(orderData) {
        return this.api.post('/orders/create', orderData);
    }

    async subscribeCourse(courseId) {
        return this.api.post(`/orders/subscribe/course/${courseId}`);
    }

    async getSubscriptions(params = {}) {
        return this.api.get('/orders/subscriptions', params);
    }

    async checkAccess(params) {
        return this.api.get('/orders/access-check', params);
    }

    async cancelSubscription(subscriptionId) {
        return this.api.post(`/orders/cancel/${subscriptionId}`);
    }

    async subscribeVIP(vipData) {
        return this.api.post('/orders/vip/subscribe', vipData);
    }
}

class StudyRoomAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async createRoom(roomData) {
        return this.api.post('/studyrooms/create', roomData);
    }

    async joinRoom(roomId) {
        return this.api.post(`/studyrooms/${roomId}/join`);
    }

    async leaveRoom(roomId) {
        return this.api.post(`/studyrooms/${roomId}/leave`);
    }

    async getRoomsList(params = {}) {
        return this.api.get('/studyrooms/list', params);
    }

    async sendMessage(roomId, message) {
        return this.api.post(`/studyrooms/${roomId}/message`, { message });
    }

    async getRoomMessages(roomId, params = {}) {
        return this.api.get(`/studyrooms/${roomId}/messages`, params);
    }
}

class PointsAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getBalance() {
        return this.api.get('/points/balance');
    }

    async getHistory(params = {}) {
        return this.api.get('/points/history', params);
    }

    async dailyCheckin() {
        return this.api.post('/points/checkin');
    }

    async getStatistics() {
        return this.api.get('/points/statistics');
    }

    async redeemPoints(redeemData) {
        return this.api.post('/points/redeem', redeemData);
    }
}

class CommentAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async createComment(commentData) {
        return this.api.post('/comments/create', commentData);
    }

    async getComments(params = {}) {
        return this.api.get('/comments/list', params);
    }

    async likeComment(commentId) {
        return this.api.post(`/comments/${commentId}/like`);
    }

    async deleteComment(commentId) {
        return this.api.delete(`/comments/${commentId}`);
    }

    async getUserComments(params = {}) {
        return this.api.get('/comments/user', params);
    }

    async getHotComments(params = {}) {
        return this.api.get('/comments/hot', params);
    }
}

class AchievementAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getUserAchievements() {
        return this.api.get('/achievements/user');
    }

    async getAllAchievements() {
        return this.api.get('/achievements/all');
    }

    async initializeAchievements() {
        return this.api.post('/achievements/initialize');
    }
}

const apiService = new ApiService();
const authAPI = new AuthAPI(apiService);
const userAPI = new UserAPI(apiService);
const courseAPI = new CourseAPI(apiService);
const contentAPI = new ContentAPI(apiService);
const learningAPI = new LearningAPI(apiService);
const paymentAPI = new PaymentAPI(apiService);
const orderAPI = new OrderAPI(apiService);
const studyRoomAPI = new StudyRoomAPI(apiService);
const pointsAPI = new PointsAPI(apiService);
const commentAPI = new CommentAPI(apiService);
const achievementAPI = new AchievementAPI(apiService);

window.API = {
    auth: authAPI,
    user: userAPI,
    course: courseAPI,
    content: contentAPI,
    learning: learningAPI,
    payment: paymentAPI,
    order: orderAPI,
    studyRoom: studyRoomAPI,
    points: pointsAPI,
    comment: commentAPI,
    achievement: achievementAPI,
    service: apiService
};

export {
    apiService,
    authAPI,
    userAPI,
    courseAPI,
    contentAPI,
    learningAPI,
    paymentAPI,
    orderAPI,
    studyRoomAPI,
    pointsAPI,
    commentAPI,
    achievementAPI
};