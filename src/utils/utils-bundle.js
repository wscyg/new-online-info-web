/**
 * 统一工具模块入口
 * 页面只需引入此文件即可获得所有公共功能
 */

// ==================== 配置 ====================
const APP_CONFIG = {
    API_BASE: '/api',
    TIMEOUT: 30000,
    RETRY_COUNT: 2,
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    THEME_KEY: 'theme'
};

// ==================== Toast 通知 ====================
class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        const colors = {
            success: { bg: '#10B981', border: '#059669' },
            error: { bg: '#EF4444', border: '#DC2626' },
            warning: { bg: '#F59E0B', border: '#D97706' },
            info: { bg: '#3B82F6', border: '#2563EB' }
        };
        const color = colors[type] || colors.info;

        toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-message">${message}</span>`;
        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            background: ${color.bg};
            border-left: 4px solid ${color.border};
            border-radius: 8px;
            color: white;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            pointer-events: auto;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration) { this.show(message, 'error', duration); }
    warning(message, duration) { this.show(message, 'warning', duration); }
    info(message, duration) { this.show(message, 'info', duration); }
}

// ==================== API 客户端 ====================
class APIClient {
    constructor(baseUrl = APP_CONFIG.API_BASE) {
        this.baseUrl = baseUrl;
        this.timeout = APP_CONFIG.TIMEOUT;
        this.retryCount = APP_CONFIG.RETRY_COUNT;
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    async request(url, options = {}, retries = this.retryCount) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

        try {
            const response = await fetch(this.baseUrl + url, {
                ...options,
                headers: { ...this.getHeaders(), ...options.headers },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.status === 401) {
                window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new Error('登录已过期');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `请求失败: ${response.status}`);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }

            if (retries > 0 && !['登录已过期'].includes(error.message)) {
                await new Promise(r => setTimeout(r, 1000));
                return this.request(url, options, retries - 1);
            }

            throw error;
        }
    }

    get(url, options) { return this.request(url, { method: 'GET', ...options }); }
    post(url, data, options) { return this.request(url, { method: 'POST', body: JSON.stringify(data), ...options }); }
    put(url, data, options) { return this.request(url, { method: 'PUT', body: JSON.stringify(data), ...options }); }
    delete(url, options) { return this.request(url, { method: 'DELETE', ...options }); }
}

// ==================== 认证管理 ====================
class AuthManager {
    getToken() { return localStorage.getItem(APP_CONFIG.TOKEN_KEY); }
    setToken(token) { localStorage.setItem(APP_CONFIG.TOKEN_KEY, token); }

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(APP_CONFIG.USER_KEY));
        } catch { return null; }
    }
    setUser(user) { localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user)); }

    isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                this.logout();
                return false;
            }
        } catch {}
        return true;
    }

    logout() {
        localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
        localStorage.removeItem(APP_CONFIG.USER_KEY);
    }

    checkAuth(redirectUrl = 'login.html') {
        if (!this.isLoggedIn()) {
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    redirectAfterLogin(defaultUrl = 'dashboard.html') {
        const savedUrl = localStorage.getItem('redirectAfterLogin');
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = savedUrl || defaultUrl;
    }

    getDisplayName() {
        const user = this.getUser();
        return user?.nickname || user?.username || '用户';
    }

    getAvatar() {
        return this.getUser()?.avatar || null;
    }
}

// ==================== 主题管理 ====================
class ThemeManager {
    constructor() {
        this.storageKey = APP_CONFIG.THEME_KEY;
        this.defaultTheme = 'dark';
    }

    getTheme() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) return saved;
        if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
        return this.defaultTheme;
    }

    setTheme(theme) {
        localStorage.setItem(this.storageKey, theme);
        this.applyTheme(theme);
    }

    toggle() {
        const newTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
    }

    init() {
        const theme = this.getTheme();
        this.applyTheme(theme);

        // 监听系统主题变化
        window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(this.storageKey)) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // 绑定主题切换按钮
        document.addEventListener('click', e => {
            if (e.target.closest('.theme-toggle, #themeToggle, [data-theme-toggle]')) {
                this.toggle();
            }
        });

        return theme;
    }
}

// ==================== 加载状态管理 ====================
class LoadingManager {
    constructor() {
        this.overlay = null;
        this.count = 0;
    }

    init() {
        if (this.overlay) return;
        this.overlay = document.createElement('div');
        this.overlay.id = 'global-loading';
        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke-width="4"/></svg>
                <span class="loading-text">加载中...</span>
            </div>
        `;
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: none; justify-content: center;
            align-items: center; z-index: 9999; backdrop-filter: blur(4px);
        `;
        document.body.appendChild(this.overlay);
        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('loading-styles')) return;
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            @keyframes rotate { 100% { transform: rotate(360deg); } }
            @keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }
            .loading-spinner { display: flex; flex-direction: column; align-items: center; gap: 16px; }
            .loading-spinner svg { width: 50px; height: 50px; animation: rotate 1s linear infinite; }
            .loading-spinner circle { stroke: #3b82f6; stroke-linecap: round; animation: dash 1.5s ease-in-out infinite; }
            .loading-text { color: white; font-size: 14px; }
            .btn-loading { position: relative; pointer-events: none; opacity: 0.7; }
            .btn-loading::after { content: ''; position: absolute; width: 16px; height: 16px; top: 50%; left: 50%; margin: -8px 0 0 -8px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: rotate 0.8s linear infinite; }
            .skeleton { background: linear-gradient(90deg, #2a2a3e 25%, #3a3a4e 50%, #2a2a3e 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: 4px; }
            @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; text-align: center; color: #888; }
            .empty-state h3 { font-size: 18px; margin-bottom: 8px; color: #aaa; }
        `;
        document.head.appendChild(style);
    }

    show(text = '加载中...') {
        this.init();
        this.count++;
        const textEl = this.overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = text;
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.count = Math.max(0, this.count - 1);
        if (this.count === 0 && this.overlay) {
            this.overlay.style.display = 'none';
        }
    }

    forceHide() {
        this.count = 0;
        if (this.overlay) this.overlay.style.display = 'none';
    }

    setButtonLoading(btn, isLoading, text = null) {
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.classList.add('btn-loading');
            btn.disabled = true;
            btn.textContent = '';
        } else {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
            btn.textContent = text || btn.dataset.originalText || '提交';
        }
    }

    createSkeleton(type = 'card', count = 1) {
        const templates = {
            card: '<div class="skeleton" style="height:200px;border-radius:12px;"></div>',
            text: '<div class="skeleton" style="height:16px;margin-bottom:8px;"></div>',
            list: '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;"><div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div><div style="flex:1;"><div class="skeleton" style="height:16px;width:40%;margin-bottom:8px;"></div><div class="skeleton" style="height:14px;width:80%;"></div></div></div>'
        };
        return Array(count).fill(templates[type] || templates.card).join('');
    }

    createEmptyState(message = '暂无数据', subMessage = '') {
        return `<div class="empty-state"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.5;margin-bottom:16px;"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg><h3>${message}</h3>${subMessage ? `<p>${subMessage}</p>` : ''}</div>`;
    }
}

// ==================== 页面工具 ====================
const PageUtils = {
    getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    },

    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const pad = n => String(n).padStart(2, '0');
        return format
            .replace('YYYY', d.getFullYear())
            .replace('MM', pad(d.getMonth() + 1))
            .replace('DD', pad(d.getDate()))
            .replace('HH', pad(d.getHours()))
            .replace('mm', pad(d.getMinutes()))
            .replace('ss', pad(d.getSeconds()));
    },

    formatRelativeTime(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const diff = Date.now() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 30) return `${days}天前`;
        return this.formatDate(date);
    },

    formatNumber(num) {
        if (!num) return '0';
        if (num >= 10000) return (num / 10000).toFixed(1) + '万';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return String(num);
    },

    debounce(fn, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    throttle(fn, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            window.toast?.success('已复制到剪贴板');
            return true;
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                window.toast?.success('已复制到剪贴板');
                return true;
            } catch {
                window.toast?.error('复制失败');
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    },

    scrollToElement(selector, offset = 0) {
        const el = document.querySelector(selector);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};

// ==================== 模态框 ====================
const Modal = {
    show(options) {
        const { title = '', content = '', confirmText = '确定', cancelText = '取消', onConfirm, onCancel, showCancel = true } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                ${title ? `<h3 class="modal-title">${title}</h3>` : ''}
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    ${showCancel ? `<button class="modal-btn modal-btn-cancel">${cancelText}</button>` : ''}
                    <button class="modal-btn modal-btn-confirm">${confirmText}</button>
                </div>
            </div>
        `;
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; justify-content: center;
            align-items: center; z-index: 10001; backdrop-filter: blur(4px);
        `;

        const contentEl = modal.querySelector('.modal-content');
        contentEl.style.cssText = `
            background: #1e1e2e; border-radius: 16px; padding: 24px;
            max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        const close = () => modal.remove();

        modal.querySelector('.modal-btn-confirm')?.addEventListener('click', () => {
            onConfirm?.();
            close();
        });
        modal.querySelector('.modal-btn-cancel')?.addEventListener('click', () => {
            onCancel?.();
            close();
        });
        modal.addEventListener('click', e => {
            if (e.target === modal) close();
        });

        // 添加样式
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal-title { margin: 0 0 16px; font-size: 18px; color: #fff; }
                .modal-body { color: #aaa; line-height: 1.6; margin-bottom: 24px; }
                .modal-footer { display: flex; gap: 12px; justify-content: flex-end; }
                .modal-btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: all 0.2s; }
                .modal-btn-cancel { background: #374151; color: #fff; }
                .modal-btn-cancel:hover { background: #4b5563; }
                .modal-btn-confirm { background: #3b82f6; color: #fff; }
                .modal-btn-confirm:hover { background: #2563eb; }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
        return { close };
    },

    confirm(message, onConfirm) {
        return this.show({ title: '确认', content: message, onConfirm });
    },

    alert(message, onClose) {
        return this.show({ title: '提示', content: message, showCancel: false, onConfirm: onClose });
    }
};

// ==================== 全局实例 ====================
const toast = new ToastManager();
const api = new APIClient();
const auth = new AuthManager();
const theme = new ThemeManager();
const loading = new LoadingManager();

// ==================== 页面初始化 ====================
function initPage() {
    // 初始化主题
    theme.init();

    // 初始化加载管理器
    loading.addStyles();

    // 全局事件监听
    window.addEventListener('auth:expired', () => {
        toast.warning('登录已过期，请重新登录');
        setTimeout(() => auth.checkAuth(), 1500);
    });

    window.addEventListener('online', () => toast.success('网络已恢复'));
    window.addEventListener('offline', () => toast.warning('网络已断开'));

    // 全局错误处理
    window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
    });

    // 触发页面就绪事件
    window.dispatchEvent(new CustomEvent('page:ready'));
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// ==================== 导出到全局 ====================
window.toast = toast;
window.api = api;
window.auth = auth;
window.theme = theme;
window.loading = loading;
window.PageUtils = PageUtils;
window.Modal = Modal;
window.APP_CONFIG = APP_CONFIG;

// 兼容旧代码
window.showToast = (msg, type) => toast[type] ? toast[type](msg) : toast.info(msg);
window.apiClient = api;

// ==================== UX增强组件 ====================

/**
 * 骨架屏生成器 - 更丰富的骨架屏模板
 */
const Skeleton = {
    // 课程卡片骨架屏
    courseCard: () => `
        <div class="skeleton-card" style="background:#1e1e2e;border-radius:16px;padding:16px;margin-bottom:16px;">
            <div class="skeleton" style="width:100%;height:160px;border-radius:12px;margin-bottom:12px;"></div>
            <div class="skeleton" style="width:70%;height:20px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:50%;height:16px;margin-bottom:12px;"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="skeleton" style="width:60px;height:24px;border-radius:12px;"></div>
                <div class="skeleton" style="width:80px;height:32px;border-radius:8px;"></div>
            </div>
        </div>
    `,

    // 列表项骨架屏
    listItem: () => `
        <div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #2a2a3e;">
            <div class="skeleton" style="width:48px;height:48px;border-radius:50%;flex-shrink:0;"></div>
            <div style="flex:1;">
                <div class="skeleton" style="width:60%;height:16px;margin-bottom:8px;"></div>
                <div class="skeleton" style="width:40%;height:14px;"></div>
            </div>
            <div class="skeleton" style="width:60px;height:24px;border-radius:4px;"></div>
        </div>
    `,

    // 统计卡片骨架屏
    statCard: () => `
        <div style="background:#1e1e2e;border-radius:12px;padding:20px;">
            <div class="skeleton" style="width:40px;height:40px;border-radius:8px;margin-bottom:12px;"></div>
            <div class="skeleton" style="width:80px;height:28px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:60px;height:14px;"></div>
        </div>
    `,

    // 排行榜骨架屏
    leaderboard: (count = 5) => Array(count).fill(`
        <div style="display:flex;gap:12px;align-items:center;padding:12px;background:#1e1e2e;border-radius:8px;margin-bottom:8px;">
            <div class="skeleton" style="width:24px;height:24px;border-radius:4px;"></div>
            <div class="skeleton" style="width:40px;height:40px;border-radius:50%;"></div>
            <div style="flex:1;">
                <div class="skeleton" style="width:100px;height:16px;margin-bottom:6px;"></div>
                <div class="skeleton" style="width:60px;height:12px;"></div>
            </div>
            <div class="skeleton" style="width:50px;height:20px;border-radius:4px;"></div>
        </div>
    `).join(''),

    // 表格骨架屏
    table: (rows = 5, cols = 4) => `
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr>${Array(cols).fill('<th style="padding:12px;"><div class="skeleton" style="height:16px;"></div></th>').join('')}</tr>
            </thead>
            <tbody>
                ${Array(rows).fill(`<tr>${Array(cols).fill('<td style="padding:12px;"><div class="skeleton" style="height:14px;"></div></td>').join('')}</tr>`).join('')}
            </tbody>
        </table>
    `,

    // 渲染骨架屏到容器
    render(container, type, count = 1) {
        const generator = this[type];
        if (generator && container) {
            container.innerHTML = typeof count === 'number' && count > 1
                ? Array(count).fill('').map(() => generator()).join('')
                : generator(count);
        }
    }
};

/**
 * 空状态组件 - 更友好的空状态提示
 */
const EmptyState = {
    templates: {
        default: { icon: '📭', title: '暂无数据', desc: '数据将在这里显示' },
        course: { icon: '📚', title: '还没有课程', desc: '探索课程库，开启学习之旅', action: { text: '浏览课程', href: 'courses.html' } },
        search: { icon: '🔍', title: '没有找到匹配的内容', desc: '试试其他关键词或清除筛选条件' },
        achievement: { icon: '🏆', title: '暂无成就', desc: '完成挑战，解锁专属徽章' },
        checkin: { icon: '📅', title: '开始签到吧', desc: '连续签到可获得更多奖励' },
        message: { icon: '💬', title: '暂无消息', desc: '新消息将在这里显示' },
        order: { icon: '🛒', title: '暂无订单', desc: '购买课程后订单将显示在这里' },
        note: { icon: '📝', title: '暂无笔记', desc: '学习时随手记录，知识更牢固' },
        friend: { icon: '👥', title: '暂无好友', desc: '邀请朋友一起学习，共同进步' },
        error: { icon: '❌', title: '加载失败', desc: '请检查网络连接后重试', action: { text: '重新加载', onclick: 'location.reload()' } },
        offline: { icon: '📡', title: '网络已断开', desc: '请检查网络连接' }
    },

    render(type = 'default', options = {}) {
        const template = this.templates[type] || this.templates.default;
        const { icon, title, desc, action } = { ...template, ...options };

        let actionHtml = '';
        if (action) {
            if (action.href) {
                actionHtml = `<a href="${action.href}" class="empty-state-action">${action.text}</a>`;
            } else if (action.onclick) {
                actionHtml = `<button onclick="${action.onclick}" class="empty-state-action">${action.text}</button>`;
            }
        }

        return `
            <div class="empty-state-container">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-desc">${desc}</p>
                ${actionHtml}
            </div>
        `;
    },

    // 渲染到容器
    show(container, type, options) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.innerHTML = this.render(type, options);
        }
    }
};

/**
 * 网络状态监测器
 */
const NetworkStatus = {
    isOnline: navigator.onLine,
    listeners: [],

    init() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // 定期检测网络状态
        setInterval(() => this.checkConnection(), 30000);
    },

    handleOnline() {
        this.isOnline = true;
        toast.success('网络已恢复');
        this.notify('online');
        this.hideOfflineBanner();
    },

    handleOffline() {
        this.isOnline = false;
        toast.warning('网络已断开，部分功能可能不可用');
        this.notify('offline');
        this.showOfflineBanner();
    },

    showOfflineBanner() {
        if (document.getElementById('offline-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.innerHTML = '📡 网络已断开，请检查网络连接';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; padding: 8px;
            background: #F59E0B; color: #1e1e2e; text-align: center;
            font-size: 14px; z-index: 10002; font-weight: 500;
        `;
        document.body.prepend(banner);
    },

    hideOfflineBanner() {
        document.getElementById('offline-banner')?.remove();
    },

    async checkConnection() {
        try {
            const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' });
            if (!this.isOnline && response.ok) {
                this.handleOnline();
            }
        } catch {
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    },

    onStatusChange(callback) {
        this.listeners.push(callback);
    },

    notify(status) {
        this.listeners.forEach(cb => cb(status));
    }
};

/**
 * 表单验证增强
 */
const FormValidator = {
    rules: {
        required: (value) => !!value?.trim() || '此字段不能为空',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '请输入有效的邮箱地址',
        phone: (value) => /^1[3-9]\d{9}$/.test(value) || '请输入有效的手机号',
        minLength: (min) => (value) => value.length >= min || `至少需要${min}个字符`,
        maxLength: (max) => (value) => value.length <= max || `最多${max}个字符`,
        match: (fieldId) => (value) => value === document.getElementById(fieldId)?.value || '两次输入不一致',
        pattern: (regex, msg) => (value) => regex.test(value) || msg
    },

    validate(form, rules) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const field = form.querySelector(`[name="${fieldName}"]`) || form.querySelector(`#${fieldName}`);
            if (!field) continue;

            const value = field.value;
            for (const rule of fieldRules) {
                const result = typeof rule === 'function' ? rule(value) : this.rules[rule]?.(value);
                if (result !== true) {
                    errors[fieldName] = result;
                    isValid = false;
                    this.showFieldError(field, result);
                    break;
                } else {
                    this.clearFieldError(field);
                }
            }
        }

        return { isValid, errors };
    },

    showFieldError(field, message) {
        field.classList.add('field-error');
        let errorEl = field.parentElement.querySelector('.field-error-msg');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error-msg';
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    },

    clearFieldError(field) {
        field.classList.remove('field-error');
        field.parentElement.querySelector('.field-error-msg')?.remove();
    },

    // 实时验证
    bindRealTimeValidation(form, rules) {
        for (const fieldName of Object.keys(rules)) {
            const field = form.querySelector(`[name="${fieldName}"]`) || form.querySelector(`#${fieldName}`);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validate(form, { [fieldName]: rules[fieldName] });
                });
            }
        }
    }
};

/**
 * 交互反馈增强
 */
const Feedback = {
    // 按钮点击波纹效果
    ripple(element) {
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.cssText = `
                position: absolute; border-radius: 50%; background: rgba(255,255,255,0.3);
                width: ${size}px; height: ${size}px; left: ${e.clientX - rect.left - size/2}px;
                top: ${e.clientY - rect.top - size/2}px; animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    },

    // 数据更新闪烁效果
    highlight(element, color = '#3b82f6') {
        element.style.transition = 'background-color 0.3s';
        element.style.backgroundColor = color + '33';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 1000);
    },

    // 成功/错误抖动效果
    shake(element) {
        element.style.animation = 'shake 0.5s ease';
        setTimeout(() => element.style.animation = '', 500);
    },

    // 添加到全局样式
    init() {
        if (document.getElementById('feedback-styles')) return;
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.textContent = `
            @keyframes ripple { to { transform: scale(4); opacity: 0; } }
            @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-5px); } 40%,80% { transform: translateX(5px); } }
            .field-error { border-color: #ef4444 !important; }
            .field-error-msg { color: #ef4444; font-size: 12px; margin-top: 4px; display: block; }
            .empty-state-container { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; text-align: center; }
            .empty-state-icon { font-size: 64px; margin-bottom: 16px; }
            .empty-state-title { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-bottom: 8px; }
            .empty-state-desc { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }
            .empty-state-action { padding: 10px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; text-decoration: none; }
            .empty-state-action:hover { background: #2563eb; }
        `;
        document.head.appendChild(style);
    }
};

// 初始化UX增强
Feedback.init();
NetworkStatus.init();

// 导出到全局
window.Skeleton = Skeleton;
window.EmptyState = EmptyState;
window.NetworkStatus = NetworkStatus;
window.FormValidator = FormValidator;
window.Feedback = Feedback;
