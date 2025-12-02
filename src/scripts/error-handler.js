/**
 * 全局错误处理器
 * 提供统一的错误处理、用户友好提示和错误恢复机制
 */

class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
        this.errorMessages = {
            // 网络错误
            'NetworkError': '网络连接失败，请检查您的网络设置',
            'TypeError: Failed to fetch': '无法连接到服务器，请稍后重试',
            'AbortError': '请求已取消',
            'TimeoutError': '请求超时，请检查网络后重试',

            // HTTP状态码
            400: '请求参数错误',
            401: '登录已过期，请重新登录',
            403: '没有权限执行此操作',
            404: '请求的资源不存在',
            405: '请求方法不被允许',
            408: '请求超时',
            409: '数据冲突，请刷新后重试',
            422: '提交的数据格式不正确',
            429: '请求过于频繁，请稍后再试',
            500: '服务器内部错误，请稍后重试',
            502: '服务器暂时不可用',
            503: '服务正在维护中',
            504: '服务器响应超时',

            // 业务错误
            'TOKEN_EXPIRED': '登录已过期，请重新登录',
            'INSUFFICIENT_POINTS': '积分不足',
            'ALREADY_COMPLETED': '任务已完成',
            'NOT_FOUND': '数据不存在',
            'DUPLICATE': '数据已存在',
            'INVALID_OPERATION': '操作无效',

            // 默认
            'default': '操作失败，请稍后重试'
        };

        this.init();
    }

    init() {
        this.setupGlobalHandlers();
        this.createErrorUI();
    }

    setupGlobalHandlers() {
        // 捕获未处理的Promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            this.handleError(event.reason, 'unhandledrejection');
        });

        // 捕获全局错误
        window.addEventListener('error', (event) => {
            // 忽略脚本加载错误和非关键错误
            if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                console.warn('Resource load error:', event.target.src || event.target.href);
                return;
            }
            this.handleError(event.error, 'global');
        });

        // 拦截fetch请求错误
        this.interceptFetch();
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);

                // 处理非2xx响应
                if (!response.ok) {
                    const errorData = await response.clone().json().catch(() => ({}));
                    const error = new Error(errorData.message || self.getErrorMessage(response.status));
                    error.status = response.status;
                    error.data = errorData;

                    // 401 自动跳转登录
                    if (response.status === 401) {
                        self.handleAuthError();
                        throw error;
                    }

                    // 显示错误提示但不阻止响应
                    if (response.status >= 400) {
                        self.showError(error.message);
                    }
                }

                return response;
            } catch (error) {
                // 网络错误等
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    self.showError(self.errorMessages['TypeError: Failed to fetch']);
                }
                throw error;
            }
        };
    }

    handleError(error, source = 'unknown') {
        if (!error) return;

        const errorInfo = this.parseError(error);

        // 记录错误
        this.logError(errorInfo, source);

        // 显示用户友好的错误提示
        if (!errorInfo.silent) {
            this.showError(errorInfo.userMessage);
        }

        // 特殊错误处理
        if (errorInfo.requiresAuth) {
            this.handleAuthError();
        }
    }

    parseError(error) {
        const info = {
            original: error,
            message: '',
            userMessage: '',
            code: null,
            silent: false,
            requiresAuth: false
        };

        if (typeof error === 'string') {
            info.message = error;
            info.userMessage = this.getErrorMessage(error);
        } else if (error instanceof Error) {
            info.message = error.message;
            info.code = error.status || error.code;
            info.userMessage = this.getErrorMessage(error.status || error.message);

            if (error.status === 401 || error.message?.includes('TOKEN')) {
                info.requiresAuth = true;
            }
        } else if (error && typeof error === 'object') {
            info.message = error.message || error.error || JSON.stringify(error);
            info.code = error.code || error.status;
            info.userMessage = this.getErrorMessage(error.code || error.message);
        }

        return info;
    }

    getErrorMessage(key) {
        if (typeof key === 'number') {
            return this.errorMessages[key] || this.errorMessages.default;
        }
        if (typeof key === 'string') {
            // 尝试精确匹配
            if (this.errorMessages[key]) {
                return this.errorMessages[key];
            }
            // 尝试部分匹配
            for (const [pattern, message] of Object.entries(this.errorMessages)) {
                if (key.includes(pattern)) {
                    return message;
                }
            }
        }
        return this.errorMessages.default;
    }

    handleAuthError() {
        // 清除过期token
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 保存当前页面用于登录后返回
        const currentPath = window.location.pathname + window.location.search;
        if (!currentPath.includes('login')) {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
        }

        // 显示提示并跳转
        this.showError('登录已过期，请重新登录', () => {
            window.location.href = '/login.html';
        });
    }

    createErrorUI() {
        // 如果已存在全局通知系统，使用它
        if (window.globalNotifications) {
            return;
        }

        // 创建简单的错误提示容器
        if (!document.getElementById('error-toast-container')) {
            const container = document.createElement('div');
            container.id = 'error-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 100000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        // 添加样式
        if (!document.getElementById('error-handler-styles')) {
            const style = document.createElement('style');
            style.id = 'error-handler-styles';
            style.textContent = `
                .error-toast {
                    background: white;
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    max-width: 400px;
                    pointer-events: auto;
                    animation: errorSlideIn 0.3s ease;
                    border-left: 4px solid #ef4444;
                }

                .error-toast.warning {
                    border-left-color: #f59e0b;
                }

                .error-toast.info {
                    border-left-color: #3b82f6;
                }

                .error-toast-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #fef2f2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ef4444;
                    flex-shrink: 0;
                }

                .error-toast.warning .error-toast-icon {
                    background: #fffbeb;
                    color: #f59e0b;
                }

                .error-toast.info .error-toast-icon {
                    background: #eff6ff;
                    color: #3b82f6;
                }

                .error-toast-content {
                    flex: 1;
                }

                .error-toast-message {
                    color: #374151;
                    font-size: 14px;
                }

                .error-toast-action {
                    color: #667eea;
                    font-size: 13px;
                    cursor: pointer;
                    text-decoration: underline;
                    margin-top: 4px;
                }

                .error-toast-close {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 4px;
                    font-size: 16px;
                }

                .error-toast-close:hover {
                    color: #374151;
                }

                .error-toast.removing {
                    animation: errorSlideOut 0.3s ease forwards;
                }

                @keyframes errorSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes errorSlideOut {
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }

                /* 离线提示条 */
                .offline-banner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 12px 20px;
                    text-align: center;
                    font-weight: 500;
                    z-index: 100001;
                    transform: translateY(-100%);
                    transition: transform 0.3s ease;
                }

                .offline-banner.visible {
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
    }

    showError(message, onAction = null, type = 'error') {
        // 优先使用全局通知系统
        if (window.globalNotifications) {
            window.globalNotifications.toast(message, type);
            if (onAction) setTimeout(onAction, 3000);
            return;
        }

        const container = document.getElementById('error-toast-container');
        if (!container) {
            console.error('Error:', message);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `error-toast ${type}`;

        const icons = {
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="error-toast-icon">
                <i class="fas ${icons[type] || icons.error}"></i>
            </div>
            <div class="error-toast-content">
                <div class="error-toast-message">${message}</div>
                ${onAction ? '<div class="error-toast-action">点击处理</div>' : ''}
            </div>
            <button class="error-toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // 绑定事件
        const closeBtn = toast.querySelector('.error-toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        if (onAction) {
            const actionBtn = toast.querySelector('.error-toast-action');
            actionBtn.addEventListener('click', () => {
                this.removeToast(toast);
                onAction();
            });
        }

        // 自动移除
        setTimeout(() => {
            this.removeToast(toast);
            if (onAction && !toast.dataset.actioned) {
                onAction();
            }
        }, 5000);
    }

    removeToast(toast) {
        if (!toast || toast.dataset.removing) return;
        toast.dataset.removing = 'true';
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    showOfflineBanner() {
        let banner = document.querySelector('.offline-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'offline-banner';
            banner.innerHTML = '<i class="fas fa-wifi-slash"></i> 网络连接已断开，部分功能可能不可用';
            document.body.appendChild(banner);
        }
        setTimeout(() => banner.classList.add('visible'), 100);
    }

    hideOfflineBanner() {
        const banner = document.querySelector('.offline-banner');
        if (banner) {
            banner.classList.remove('visible');
        }
    }

    logError(errorInfo, source) {
        // 本地日志
        const logEntry = {
            timestamp: new Date().toISOString(),
            source,
            message: errorInfo.message,
            code: errorInfo.code,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        console.error('[ErrorHandler]', logEntry);

        // 保存到本地存储用于调试
        try {
            const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            logs.push(logEntry);
            // 只保留最近50条
            if (logs.length > 50) logs.shift();
            localStorage.setItem('errorLogs', JSON.stringify(logs));
        } catch (e) {}
    }

    /**
     * 带重试的请求封装
     */
    async fetchWithRetry(url, options = {}, retries = this.retryConfig.maxRetries) {
        let lastError;

        for (let i = 0; i <= retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    return response;
                }

                // 某些状态码不重试
                if ([400, 401, 403, 404, 422].includes(response.status)) {
                    throw new Error(this.getErrorMessage(response.status));
                }

                lastError = new Error(`HTTP ${response.status}`);
            } catch (error) {
                lastError = error;

                // 最后一次尝试不等待
                if (i < retries) {
                    const delay = Math.min(
                        this.retryConfig.baseDelay * Math.pow(2, i),
                        this.retryConfig.maxDelay
                    );
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * 获取错误日志 (调试用)
     */
    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('errorLogs') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * 清除错误日志
     */
    clearErrorLogs() {
        localStorage.removeItem('errorLogs');
    }
}

// 初始化
const errorHandler = new ErrorHandler();

// 网络状态监听
window.addEventListener('online', () => {
    errorHandler.hideOfflineBanner();
    if (window.globalNotifications) {
        window.globalNotifications.success('网络已恢复连接');
    }
});

window.addEventListener('offline', () => {
    errorHandler.showOfflineBanner();
});

// 暴露全局方法
window.errorHandler = {
    show: (message, type = 'error') => errorHandler.showError(message, null, type),
    handle: (error) => errorHandler.handleError(error),
    fetchWithRetry: (url, options, retries) => errorHandler.fetchWithRetry(url, options, retries),
    getLogs: () => errorHandler.getErrorLogs(),
    clearLogs: () => errorHandler.clearErrorLogs()
};

console.log('Error Handler initialized');
