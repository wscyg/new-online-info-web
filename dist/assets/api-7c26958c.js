const API_BASE_URL = 'http://42.194.245.66/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers,
                mode: 'cors',
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('=== API 401错误 ===');
                    console.error('请求URL:', `${API_BASE_URL}${url}`);
                    console.error('Token存在:', !!this.token);
                    console.error('即将清除token并跳转到登录页');
                    this.clearToken();
                    window.location.href = '/login';
                }
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
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

    async uploadFile(url, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers,
            body: formData,
            mode: 'cors',
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
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
        if (response.data && response.data.token) {
            this.api.setToken(response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
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