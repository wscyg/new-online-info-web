/**
 * 统一页面初始化
 * 所有页面引入此文件即可自动初始化主题、认证等
 */

(function() {
    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    function initPage() {
        // 初始化主题
        if (window.theme) {
            window.theme.init();
        }

        // 初始化加载状态管理
        if (window.loading) {
            // 已自动初始化
        }

        // 绑定全局事件
        bindGlobalEvents();

        // 触发页面初始化完成事件
        window.dispatchEvent(new CustomEvent('page:ready'));
    }

    function bindGlobalEvents() {
        // 认证过期处理
        window.addEventListener('auth:expired', () => {
            if (window.toast) {
                window.toast.warning('登录已过期，请重新登录');
            }
            setTimeout(() => {
                if (window.auth) {
                    window.auth.checkAuth();
                }
            }, 1500);
        });

        // 网络状态监听
        window.addEventListener('online', () => {
            if (window.toast) {
                window.toast.success('网络已恢复');
            }
        });

        window.addEventListener('offline', () => {
            if (window.toast) {
                window.toast.warning('网络已断开，请检查网络连接');
            }
        });

        // 全局错误处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (event.reason instanceof window.APIError) {
                // API 错误已经在 apiClient 中处理
                return;
            }
        });
    }
})();

/**
 * 页面工具函数
 */
const PageUtils = {
    /**
     * 安全地获取 URL 参数
     */
    getQueryParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },

    /**
     * 格式化日期
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 格式化相对时间
     */
    formatRelativeTime(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const now = new Date();
        const diff = now - d;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return '刚刚';
        if (minutes < 60) return \`\${minutes}分钟前\`;
        if (hours < 24) return \`\${hours}小时前\`;
        if (days < 30) return \`\${days}天前\`;

        return this.formatDate(date, 'YYYY-MM-DD');
    },

    /**
     * 格式化数字（千、万）
     */
    formatNumber(num) {
        if (!num || num === 0) return '0';
        if (num >= 10000) return (num / 10000).toFixed(1) + '万';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return String(num);
    },

    /**
     * 防抖
     */
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * 节流
     */
    throttle(fn, limit = 300) {
        let inThrottle = false;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 复制到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            if (window.toast) {
                window.toast.success('已复制到剪贴板');
            }
            return true;
        } catch (err) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                if (window.toast) {
                    window.toast.success('已复制到剪贴板');
                }
                return true;
            } catch (e) {
                if (window.toast) {
                    window.toast.error('复制失败');
                }
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    },

    /**
     * 滚动到元素
     */
    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const top = element.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    },

    /**
     * 检测是否移动端
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PageUtils };
} else {
    window.PageUtils = PageUtils;
}
