/**
 * 现代化API服务
 * 增强版API服务，包含错误处理、重试机制、缓存等功能
 * 最后更新: 2025-08-30 13:00
 */

// 统一使用相对路径：开发环境由 Vite proxy 转发，生产环境由同域反代
const API_BASE_URL = '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.requestQueue = new Map();
        this.cache = new Map();
        this.refreshingToken = null; // Promise for ongoing token refresh
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

    // 刷新token（带锁机制防止并发刷新）
    async refreshAccessToken() {
        // 如果已有正在进行的刷新，等待其完成
        if (this.refreshingToken) {
            console.log('[API] Token refresh already in progress, waiting...');
            return this.refreshingToken;
        }

        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        // 创建刷新Promise并保存
        this.refreshingToken = (async () => {
            try {
                console.log('[API] Starting token refresh...');
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
                    console.log('[API] Token refresh successful');
                    return data.data.accessToken;
                }

                throw new Error('Token refresh failed: invalid response');
            } catch (error) {
                console.error('[API] Token refresh failed:', error);
                // 刷新失败，清除所有token
                this.clearToken();
                // 使用相对路径，兼容不同环境
                const loginPath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? '/src/pages/login.html'
                    : '/login.html';

                setTimeout(() => {
                    window.location.href = loginPath;
                }, 1000);

                throw error;
            } finally {
                // 清除刷新锁
                this.refreshingToken = null;
            }
        })();

        return this.refreshingToken;
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
                console.log('[API] Received 401, attempting token refresh...');
                try {
                    // 使用带锁的刷新方法，防止并发刷新
                    await this.refreshAccessToken();

                    // 使用新token重新请求
                    headers['Authorization'] = `Bearer ${this.token}`;
                    console.log('[API] Retrying request with new token...');
                    return fetch(`${API_BASE_URL}${url}`, {
                        ...options,
                        headers,
                        mode: 'cors',
                        credentials: 'include'
                    });
                } catch (refreshError) {
                    console.error('[API] Token refresh failed, returning 401 response');
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
        // 统一使用username字段
        const loginData = {
            username: credentials.username || credentials.loginAccount,
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

    async sendSmsVerification(phone, scene = 'register') {
        return this.api.post('/auth/send-sms-verification', null, { phone, scene });
    }

    async verifySmsCode(phone, code) {
        return this.api.post('/auth/verify-sms-code', { phone, code });
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

    async getMyCertificates(params = {}) {
        return this.api.get('/certificates/my', params);
    }

    async getCertificateById(certificateId) {
        return this.api.get(`/certificates/${certificateId}`);
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

    async getBundles(params = {}) {
        return this.api.get('/courses/bundles', params);
    }

    async getBundleById(bundleId) {
        return this.api.get(`/courses/bundles/${bundleId}`);
    }

    async getBundleCourses(bundleId, params = {}) {
        return this.api.get(`/courses/bundles/${bundleId}/courses`, params);
    }

    async getCoursePackage(courseId) {
        return this.api.get(`/courses/${courseId}/package`);
    }

    async getPackages(params = {}) {
        return this.api.get('/packages', params);
    }

    async getPackagesByCategory(categoryId, params = {}) {
        return this.api.get(`/categories/${categoryId}/packages`, params);
    }

    async addToWishlist(courseId) {
        return this.api.post('/wishlist', { courseId });
    }

    async removeFromWishlist(courseId) {
        return this.api.delete(`/wishlist/${courseId}`);
    }

    async getWishlist(params = {}) {
        return this.api.get('/wishlist', params);
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

    async getOrderStatus(orderNo) {
        return this.api.get(`/orders/status/${orderNo}`);
    }

    async getMyOrders(params = {}) {
        return this.api.get('/orders/my', params);
    }

    async checkCourseAccess(courseId) {
        return this.api.get(`/subscriptions/access/course/${courseId}`);
    }

    async createSubscription(subscriptionData) {
        return this.api.post('/subscriptions/create', subscriptionData);
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

class CommunityAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getNotes(params = {}) {
        return this.api.get('/community/notes', params);
    }

    async getNoteById(noteId) {
        return this.api.get(`/community/notes/${noteId}`);
    }

    async createNote(noteData) {
        return this.api.post('/community/notes/create', noteData);
    }

    async updateNote(noteId, noteData) {
        return this.api.put(`/community/notes/${noteId}`, noteData);
    }

    async deleteNote(noteId) {
        return this.api.delete(`/community/notes/${noteId}`);
    }

    async likeNote(noteId) {
        return this.api.post(`/community/notes/${noteId}/like`);
    }
}

class QAApi {
    constructor(apiService) {
        this.api = apiService;
    }

    async getQuestions(params = {}) {
        return this.api.get('/qa/questions', params);
    }

    async getQuestionById(questionId) {
        return this.api.get(`/qa/questions/${questionId}`);
    }

    async createQuestion(questionData) {
        return this.api.post('/qa/questions/create', questionData);
    }

    async answerQuestion(questionId, answerData) {
        return this.api.post(`/qa/questions/${questionId}/answer`, answerData);
    }

    async likeAnswer(answerId) {
        return this.api.post(`/qa/answers/${answerId}/like`);
    }

    async acceptAnswer(answerId) {
        return this.api.post(`/qa/answers/${answerId}/accept`);
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

class PkAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    // Battle management
    async createBattle(player1Id, player2Id, mode) {
        return this.api.post('/pk/battle/create', { player1Id, player2Id, mode });
    }

    async startBattle(battleId) {
        return this.api.post(`/pk/battle/${battleId}/start`);
    }

    async submitAnswer(battleId, questionId, answer, answerTime) {
        return this.api.post(`/pk/battle/${battleId}/answer`, {
            questionId,
            answer,
            answerTime
        });
    }

    async endBattle(battleId) {
        return this.api.post(`/pk/battle/${battleId}/end`);
    }

    async forfeitBattle(battleId) {
        return this.api.post(`/pk/battle/${battleId}/forfeit`);
    }

    async getBattleDetails(battleId) {
        return this.api.get(`/pk/battle/${battleId}`);
    }

    async getBattleHistory(page = 1, size = 20) {
        return this.api.get('/pk/battle/history', { page, size });
    }

    async getBattleReplay(battleId) {
        return this.api.get(`/pk/battle/${battleId}/replay`);
    }

    // Matching system
    async joinMatching(mode) {
        return this.api.post('/pk/matching/join', { mode });
    }

    async findMatch() {
        return this.api.post('/pk/matching/find');
    }

    async cancelMatching() {
        return this.api.post('/pk/matching/cancel');
    }

    async inviteFriend(friendId, mode) {
        return this.api.post('/pk/matching/invite', { friendId, mode });
    }

    async acceptInvite(inviteId) {
        return this.api.post(`/pk/matching/invite/${inviteId}/accept`);
    }

    async rejectInvite(inviteId) {
        return this.api.post(`/pk/matching/invite/${inviteId}/reject`);
    }

    // Battle modes
    async getBattleModes() {
        return this.api.get('/pk/modes');
    }

    // Online users
    async getOnlineUsers(page = 1, size = 20) {
        return this.api.get('/pk/users/online', { page, size });
    }
}

class FriendAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async searchUsers(keyword, page = 1, size = 20) {
        return this.api.get('/pk/friends/search', { keyword, page, size });
    }

    async sendRequest(toUserId, message = '') {
        return this.api.post('/pk/friends/request', { toUserId, message });
    }

    async acceptRequest(requestId) {
        return this.api.post(`/pk/friends/request/${requestId}/accept`);
    }

    async rejectRequest(requestId) {
        return this.api.post(`/pk/friends/request/${requestId}/reject`);
    }

    async getFriendList(page = 1, size = 50) {
        return this.api.get('/pk/friends/list', { page, size });
    }

    async getOnlineFriends() {
        return this.api.get('/pk/friends/online');
    }

    async deleteFriend(friendId) {
        return this.api.delete(`/pk/friends/${friendId}`);
    }

    async getPendingRequests() {
        return this.api.get('/pk/friends/requests/pending');
    }

    async getFriendProfile(friendId) {
        return this.api.get(`/pk/friends/${friendId}/profile`);
    }

    async blockUser(userId) {
        return this.api.post(`/pk/friends/${userId}/block`);
    }

    async unblockUser(userId) {
        return this.api.post(`/pk/friends/${userId}/unblock`);
    }
}

class RankingAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    async getLeaderboard(type = 'elo', period = 'all', limit = 100) {
        return this.api.get('/pk/rankings/leaderboard', { type, period, limit });
    }

    async getUserRanking(userId, type = 'elo', period = 'all') {
        return this.api.get(`/pk/rankings/user/${userId}`, { type, period });
    }

    async getMyRanking(type = 'elo', period = 'all') {
        return this.api.get('/pk/rankings/my', { type, period });
    }

    async getUserStats(userId) {
        return this.api.get(`/pk/rankings/stats/${userId}`);
    }

    async getMyStats() {
        return this.api.get('/pk/rankings/stats/my');
    }

    async getTierDistribution() {
        return this.api.get('/pk/rankings/tier-distribution');
    }

    async getTierInfo(tier) {
        return this.api.get(`/pk/rankings/tier/${tier}`);
    }

    async getUsersByTier(tier, page = 1, size = 20) {
        return this.api.get(`/pk/rankings/tier/${tier}/users`, { page, size });
    }
}

/**
 * 连续签到API
 * 提供签到、统计、排行榜等功能
 */
class CheckinAPI {
    constructor(apiService) {
        this.api = apiService;
    }

    /**
     * 每日签到
     */
    async dailyCheckIn() {
        return this.api.post('/checkin/daily');
    }

    /**
     * 获取签到统计
     */
    async getStats() {
        return this.api.get('/checkin/stats');
    }

    /**
     * 获取签到日历
     * @param {number} year - 年份（可选，默认当前年）
     * @param {number} month - 月份（可选，默认当前月）
     */
    async getCalendar(year = null, month = null) {
        const params = {};
        if (year) params.year = year;
        if (month) params.month = month;
        return this.api.get('/checkin/calendar', params);
    }

    /**
     * 补签
     * @param {string} date - 补签日期（格式：2025-11-05）
     */
    async makeupCheckIn(date) {
        return this.api.post('/checkin/makeup', null, { date });
    }

    /**
     * 获取签到排行榜
     * @param {number} limit - 返回数量（默认100）
     */
    async getLeaderboard(limit = 100) {
        return this.api.get('/checkin/leaderboard', { limit });
    }

    /**
     * 获取奖励配置
     */
    async getRewards() {
        return this.api.get('/checkin/rewards');
    }

    /**
     * 今日签到状态
     */
    async getTodayStatus() {
        return this.api.get('/checkin/today');
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
const communityAPI = new CommunityAPI(apiService);
const qaAPI = new QAApi(apiService);
const achievementAPI = new AchievementAPI(apiService);
const pkAPI = new PkAPI(apiService);
const friendAPI = new FriendAPI(apiService);
const rankingAPI = new RankingAPI(apiService);
const checkinAPI = new CheckinAPI(apiService);

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
    community: communityAPI,
    qa: qaAPI,
    achievement: achievementAPI,
    pk: pkAPI,
    friend: friendAPI,
    ranking: rankingAPI,
    checkin: checkinAPI,
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
    communityAPI,
    qaAPI,
    achievementAPI,
    pkAPI,
    friendAPI,
    rankingAPI,
    checkinAPI
};
