/**
 * API缓存管理器
 * 提供数据缓存功能以减少API请求，优化用户体验
 */

class ApiCacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.cacheConfig = {
            // 缓存时间配置 (毫秒)
            achievements: 5 * 60 * 1000,     // 5分钟
            talentProfile: 10 * 60 * 1000,   // 10分钟
            leaderboard: 2 * 60 * 1000,      // 2分钟
            mentorship: 5 * 60 * 1000,       // 5分钟
            dailyChallenges: 30 * 1000,      // 30秒 (需要实时更新)
            userProfile: 15 * 60 * 1000,     // 15分钟
            courses: 30 * 60 * 1000,         // 30分钟
            default: 60 * 1000               // 1分钟默认
        };

        this.pendingRequests = new Map();
        this.init();
    }

    init() {
        // 清理过期缓存定时器
        setInterval(() => this.cleanExpiredCache(), 60 * 1000);

        // 页面可见性变化时刷新关键数据
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshCriticalData();
            }
        });
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(url, params = {}) {
        const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
        return `${url}${sortedParams ? '?' + sortedParams : ''}`;
    }

    /**
     * 获取缓存类型的TTL
     */
    getTTL(cacheType) {
        return this.cacheConfig[cacheType] || this.cacheConfig.default;
    }

    /**
     * 设置缓存
     */
    set(key, data, cacheType = 'default') {
        const ttl = this.getTTL(cacheType);
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + ttl,
            cacheType
        };

        // 内存缓存
        this.memoryCache.set(key, cacheEntry);

        // 尝试持久化到sessionStorage (对于长期缓存)
        if (ttl >= 5 * 60 * 1000) {
            try {
                sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
            } catch (e) {
                // sessionStorage满了，清理旧数据
                this.clearSessionStorageCache();
            }
        }

        return data;
    }

    /**
     * 获取缓存
     */
    get(key) {
        // 先检查内存缓存
        let entry = this.memoryCache.get(key);

        // 如果内存中没有，检查sessionStorage
        if (!entry) {
            try {
                const stored = sessionStorage.getItem(`cache_${key}`);
                if (stored) {
                    entry = JSON.parse(stored);
                    // 恢复到内存缓存
                    this.memoryCache.set(key, entry);
                }
            } catch (e) {
                // 忽略解析错误
            }
        }

        if (!entry) return null;

        // 检查是否过期
        if (Date.now() > entry.expiry) {
            this.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * 删除缓存
     */
    delete(key) {
        this.memoryCache.delete(key);
        try {
            sessionStorage.removeItem(`cache_${key}`);
        } catch (e) {}
    }

    /**
     * 清除指定类型的缓存
     */
    clearByType(cacheType) {
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.cacheType === cacheType) {
                this.delete(key);
            }
        }
    }

    /**
     * 清除所有缓存
     */
    clearAll() {
        this.memoryCache.clear();
        try {
            Object.keys(sessionStorage)
                .filter(key => key.startsWith('cache_'))
                .forEach(key => sessionStorage.removeItem(key));
        } catch (e) {}
    }

    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
            if (now > entry.expiry) {
                this.delete(key);
            }
        }
    }

    /**
     * 清理sessionStorage缓存
     */
    clearSessionStorageCache() {
        try {
            Object.keys(sessionStorage)
                .filter(key => key.startsWith('cache_'))
                .forEach(key => sessionStorage.removeItem(key));
        } catch (e) {}
    }

    /**
     * 带缓存的fetch请求
     */
    async fetch(url, options = {}, cacheType = 'default') {
        const cacheKey = this.generateCacheKey(url, options.params || {});

        // 检查缓存
        if (!options.forceRefresh) {
            const cached = this.get(cacheKey);
            if (cached) {
                return { data: cached, fromCache: true };
            }
        }

        // 防止重复请求 (请求合并)
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        // 发起请求
        const requestPromise = this.makeRequest(url, options, cacheKey, cacheType);
        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }

    /**
     * 执行实际请求
     */
    async makeRequest(url, options, cacheKey, cacheType) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // 只缓存成功的响应
            if (result.code === 200 || result.success) {
                this.set(cacheKey, result.data, cacheType);
            }

            return { data: result.data, fromCache: false, response: result };
        } catch (error) {
            console.error('Cache fetch error:', error);
            throw error;
        }
    }

    /**
     * 刷新关键数据
     */
    refreshCriticalData() {
        // 清除即将过期的关键缓存
        const criticalTypes = ['dailyChallenges', 'leaderboard'];
        criticalTypes.forEach(type => this.clearByType(type));
    }

    /**
     * 预加载数据
     */
    async preload(urls) {
        const promises = urls.map(({ url, options, cacheType }) =>
            this.fetch(url, options, cacheType).catch(() => null)
        );
        await Promise.allSettled(promises);
    }

    /**
     * 获取缓存统计
     */
    getStats() {
        let memorySize = 0;
        let itemCount = this.memoryCache.size;
        let hitCount = 0;

        for (const [key, entry] of this.memoryCache.entries()) {
            memorySize += JSON.stringify(entry).length;
        }

        return {
            itemCount,
            memorySize: `${(memorySize / 1024).toFixed(2)} KB`,
            types: Array.from(new Set([...this.memoryCache.values()].map(e => e.cacheType)))
        };
    }
}

// 创建全局实例
const apiCache = new ApiCacheManager();

// 便捷方法
window.apiCache = {
    fetch: (url, options, cacheType) => apiCache.fetch(url, options, cacheType),
    get: (key) => apiCache.get(key),
    set: (key, data, type) => apiCache.set(key, data, type),
    clear: () => apiCache.clearAll(),
    clearType: (type) => apiCache.clearByType(type),
    stats: () => apiCache.getStats(),
    preload: (urls) => apiCache.preload(urls)
};

// 提供预配置的API调用函数
window.cachedApi = {
    getAchievements: async (forceRefresh = false) => {
        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8070/api'
            : 'http://42.194.245.66:8070/api';
        return apiCache.fetch(`${baseUrl}/achievements/my`, { forceRefresh }, 'achievements');
    },

    getTalentProfile: async (userId, forceRefresh = false) => {
        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8070/api'
            : 'http://42.194.245.66:8070/api';
        return apiCache.fetch(`${baseUrl}/talent/profile/${userId}`, { forceRefresh }, 'talentProfile');
    },

    getLeaderboard: async (type = 'overall', forceRefresh = false) => {
        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8070/api'
            : 'http://42.194.245.66:8070/api';
        return apiCache.fetch(`${baseUrl}/talent/leaderboard/${type}`, { forceRefresh }, 'leaderboard');
    },

    getDailyChallenges: async (forceRefresh = false) => {
        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8070/api'
            : 'http://42.194.245.66:8070/api';
        return apiCache.fetch(`${baseUrl}/daily-challenges/today`, { forceRefresh }, 'dailyChallenges');
    },

    getMentorship: async (forceRefresh = false) => {
        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8070/api'
            : 'http://42.194.245.66:8070/api';
        return apiCache.fetch(`${baseUrl}/mentorship/my`, { forceRefresh }, 'mentorship');
    }
};

console.log('API Cache Manager initialized');
