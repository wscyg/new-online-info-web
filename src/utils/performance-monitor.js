/**
 * 前端性能监控脚本 - 用于检测页面性能并提供优化建议
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
        this.startTime = performance.now();
        
        // 开始监控
        this.init();
    }
    
    init() {
        // 监控页面加载性能
        this.monitorPageLoad();
        
        // 监控网络请求
        this.monitorNetworkRequests();
        
        // 监控DOM操作
        this.monitorDOMOperations();
        
        // 监控内存使用
        this.monitorMemoryUsage();
        
        // 定期输出性能报告
        setInterval(() => this.generateReport(), 30000);
    }
    
    monitorPageLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.metrics.domContentLoaded = performance.now() - this.startTime;
            });
            
            window.addEventListener('load', () => {
                this.metrics.windowLoad = performance.now() - this.startTime;
                this.calculatePageMetrics();
            });
        } else {
            this.calculatePageMetrics();
        }
    }
    
    calculatePageMetrics() {
        if (!performance.getEntriesByType) return;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
            this.metrics.domInteractive = navigation.domInteractive - navigation.navigationStart;
            this.metrics.domComplete = navigation.domComplete - navigation.navigationStart;
            this.metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
        }
        
        // First Paint & First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            this.metrics[entry.name.replace('-', '')] = entry.startTime;
        });
    }
    
    monitorNetworkRequests() {
        const originalFetch = window.fetch;
        let requestCount = 0;
        let totalRequestTime = 0;
        
        window.fetch = async (...args) => {
            const startTime = performance.now();
            requestCount++;
            
            try {
                const response = await originalFetch.apply(this, args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                totalRequestTime += duration;
                
                // 记录慢请求
                if (duration > 1000) {
                    console.warn(`慢请求检测: ${args[0]} 耗时 ${duration.toFixed(2)}ms`);
                }
                
                this.metrics.networkRequests = {
                    count: requestCount,
                    averageTime: totalRequestTime / requestCount,
                    totalTime: totalRequestTime
                };
                
                return response;
            } catch (error) {
                console.error('网络请求失败:', error);
                throw error;
            }
        };
    }
    
    monitorDOMOperations() {
        let domOperations = 0;
        
        // 监控DOM变化
        const observer = new MutationObserver((mutations) => {
            domOperations += mutations.length;
            this.metrics.domOperations = domOperations;
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
        
        this.observers.push(observer);
    }
    
    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
                };
            }, 5000);
        }
    }
    
    // 测量函数执行时间
    measureFunction(fn, name) {
        return async (...args) => {
            const start = performance.now();
            const result = await fn.apply(this, args);
            const end = performance.now();
            
            if (!this.metrics.functionTimes) {
                this.metrics.functionTimes = {};
            }
            
            if (!this.metrics.functionTimes[name]) {
                this.metrics.functionTimes[name] = [];
            }
            
            this.metrics.functionTimes[name].push(end - start);
            
            // 只保留最近50次记录
            if (this.metrics.functionTimes[name].length > 50) {
                this.metrics.functionTimes[name].shift();
            }
            
            return result;
        };
    }
    
    // 生成性能报告
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            ...this.metrics
        };
        
        console.group('🚀 性能监控报告');
        
        // 页面加载性能
        if (this.metrics.loadComplete) {
            console.log(`📄 页面完全加载时间: ${this.metrics.loadComplete.toFixed(2)}ms`);
        }
        
        if (this.metrics.firstpaint) {
            console.log(`🎨 首次绘制时间: ${this.metrics.firstpaint.toFixed(2)}ms`);
        }
        
        if (this.metrics.firstcontentfulpaint) {
            console.log(`📝 首次内容绘制时间: ${this.metrics.firstcontentfulpaint.toFixed(2)}ms`);
        }
        
        // 网络性能
        if (this.metrics.networkRequests) {
            const net = this.metrics.networkRequests;
            console.log(`🌐 网络请求: ${net.count}次, 平均耗时: ${net.averageTime.toFixed(2)}ms`);
        }
        
        // 内存使用
        if (this.metrics.memory) {
            const mem = this.metrics.memory;
            console.log(`💾 内存使用: ${mem.used}MB / ${mem.total}MB (限制: ${mem.limit}MB)`);
        }
        
        // DOM操作
        if (this.metrics.domOperations) {
            console.log(`🏗️ DOM操作次数: ${this.metrics.domOperations}`);
        }
        
        // 函数性能
        if (this.metrics.functionTimes) {
            Object.keys(this.metrics.functionTimes).forEach(name => {
                const times = this.metrics.functionTimes[name];
                const avg = times.reduce((a, b) => a + b, 0) / times.length;
                const max = Math.max(...times);
                console.log(`⚡ ${name}: 平均 ${avg.toFixed(2)}ms, 最大 ${max.toFixed(2)}ms`);
            });
        }
        
        // 性能建议
        this.generateSuggestions();
        
        console.groupEnd();
        
        return report;
    }
    
    // 生成性能优化建议
    generateSuggestions() {
        const suggestions = [];
        
        // 检查页面加载时间
        if (this.metrics.loadComplete > 3000) {
            suggestions.push('⚠️ 页面加载时间过长，考虑优化资源加载');
        }
        
        // 检查网络请求
        if (this.metrics.networkRequests && this.metrics.networkRequests.count > 20) {
            suggestions.push('⚠️ 网络请求过多，考虑合并请求或使用缓存');
        }
        
        if (this.metrics.networkRequests && this.metrics.networkRequests.averageTime > 500) {
            suggestions.push('⚠️ 网络请求平均耗时较长，检查API性能或网络状况');
        }
        
        // 检查内存使用
        if (this.metrics.memory && this.metrics.memory.used > 50) {
            suggestions.push('⚠️ 内存使用较高，检查是否有内存泄漏');
        }
        
        // 检查DOM操作
        if (this.metrics.domOperations > 1000) {
            suggestions.push('⚠️ DOM操作频繁，考虑使用批量操作或虚拟滚动');
        }
        
        if (suggestions.length > 0) {
            console.group('💡 优化建议');
            suggestions.forEach(suggestion => console.log(suggestion));
            console.groupEnd();
        } else {
            console.log('✅ 性能表现良好！');
        }
    }
    
    // 清理监控器
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        
        // 恢复原始fetch
        if (window.originalFetch) {
            window.fetch = window.originalFetch;
        }
    }
}

// 自动启动性能监控（仅在开发环境）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('debug=true')) {
    window.performanceMonitor = new PerformanceMonitor();
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        if (window.performanceMonitor) {
            window.performanceMonitor.cleanup();
        }
    });
    
    console.log('🚀 性能监控已启动');
}

export default PerformanceMonitor;