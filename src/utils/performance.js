/**
 * 前端性能优化工具集
 */

class PerformanceOptimizer {
    constructor() {
        this.requestCache = new Map();
        this.imageCache = new Map();
        this.debounceTimers = new Map();
        this.observerInstances = new Map();
    }

    // 防抖函数
    debounce(func, wait, key) {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, wait);
            
            this.debounceTimers.set(key, timer);
        };
    }

    // 节流函数
    throttle(func, limit, key) {
        if (!this.throttleTimers) this.throttleTimers = new Map();
        
        return (...args) => {
            if (!this.throttleTimers.has(key)) {
                func.apply(this, args);
                this.throttleTimers.set(key, true);
                setTimeout(() => {
                    this.throttleTimers.delete(key);
                }, limit);
            }
        };
    }

    // HTTP请求缓存
    async cachedFetch(url, options = {}, cacheTime = 5 * 60 * 1000) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        if (this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < cacheTime) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            this.requestCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Cached fetch error:', error);
            throw error;
        }
    }

    // 批量请求处理
    async batchRequests(requests, batchSize = 5) {
        const results = [];
        
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            const batchPromises = batch.map(request => 
                typeof request === 'function' ? request() : request
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);
        }
        
        return results;
    }

    // 图片懒加载
    lazyLoadImages(selector = 'img[data-src]') {
        if (!('IntersectionObserver' in window)) {
            // 降级处理：直接加载所有图片
            document.querySelectorAll(selector).forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
            return;
        }

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        document.querySelectorAll(selector).forEach(img => {
            imageObserver.observe(img);
        });

        this.observerInstances.set('images', imageObserver);
    }

    // 虚拟滚动（简单实现）
    virtualScroll(container, items, itemHeight, visibleCount = 10) {
        const virtualHeight = items.length * itemHeight;
        const scrollTop = container.scrollTop;
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, items.length);
        
        return {
            visibleItems: items.slice(startIndex, endIndex),
            offsetY: startIndex * itemHeight,
            totalHeight: virtualHeight
        };
    }

    // DOM批量操作
    batchDOMUpdates(callback) {
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(callback);
        } else {
            setTimeout(callback, 16);
        }
    }

    // 内存清理
    cleanup() {
        this.requestCache.clear();
        this.imageCache.clear();
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        if (this.throttleTimers) {
            this.throttleTimers.clear();
        }
        
        this.observerInstances.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observerInstances.clear();
    }

    // 性能监控
    measurePerformance(name, fn) {
        return async (...args) => {
            const start = performance.now();
            const result = await fn(...args);
            const end = performance.now();
            console.log(`${name} took ${end - start} milliseconds`);
            return result;
        };
    }

    // 获取性能指标
    getPerformanceMetrics() {
        if (typeof performance === 'undefined') return {};
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return {};
        
        return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            cacheHitRate: this.requestCache.size > 0 ? 
                (this.requestCache.size / (this.requestCache.size + 1)) * 100 : 0
        };
    }
}

// 创建全局实例
window.performanceOptimizer = new PerformanceOptimizer();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    window.performanceOptimizer.cleanup();
});

export default PerformanceOptimizer;