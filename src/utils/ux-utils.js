/**
 * UX Enhancement Utilities - 用户体验增强工具函数
 * 提供各种增强用户体验的功能
 */

// ==================== 1. 图片懒加载 ====================
class LazyLoader {
    constructor(options = {}) {
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            this.options
        );
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
            }
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // 创建新图片对象预加载
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.classList.remove('lazy-image-placeholder');
        };
        tempImg.onerror = () => {
            img.classList.add('error');
            img.alt = '图片加载失败';
        };
        tempImg.src = src;
    }

    observe(elements) {
        elements.forEach(el => this.observer.observe(el));
    }

    static init() {
        const lazyImages = document.querySelectorAll('img.lazy-image');
        const loader = new LazyLoader();
        loader.observe(lazyImages);
        return loader;
    }
}

// ==================== 2. 平滑滚动 ====================
const smoothScroll = {
    to(target, duration = 800) {
        const targetElement = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function easeInOutCubic(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t * t + b;
            t -= 2;
            return c / 2 * (t * t * t + 2) + b;
        }

        requestAnimationFrame(animation);
    },

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    smoothScroll.to(href);
                }
            });
        });
    }
};

// ==================== 3. Toast 通知系统 ====================
class Toast {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon" style="font-size: 1.5rem;">${icons[type] || icons.info}</span>
            <span class="toast-message" style="flex: 1;">${message}</span>
            <button class="toast-close" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; opacity: 0.5; transition: opacity 0.3s;">×</button>
        `;

        this.container.appendChild(toast);

        // 关闭按钮
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    remove(toast) {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// 添加fadeOut动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(style);

// ==================== 4. 加载状态管理 ====================
const LoadingState = {
    show(element, text = '加载中...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        element.classList.add('btn-loading');
        element.setAttribute('disabled', 'true');
        element.dataset.originalText = element.textContent;
        element.textContent = text;
    },

    hide(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        element.classList.remove('btn-loading');
        element.removeAttribute('disabled');
        if (element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }
};

// ==================== 5. 骨架屏生成器 ====================
class SkeletonGenerator {
    static createCard(count = 1) {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            const card = document.createElement('div');
            card.className = 'skeleton-card';
            card.innerHTML = `
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            `;
            skeletons.push(card);
        }
        return skeletons;
    }

    static show(container, count = 3) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        const skeletons = this.createCard(count);
        skeletons.forEach(skeleton => container.appendChild(skeleton));
        return skeletons;
    }

    static hide(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        const skeletons = container.querySelectorAll('.skeleton-card');
        skeletons.forEach(skeleton => {
            skeleton.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => skeleton.remove(), 300);
        });
    }
}

// ==================== 6. 防抖和节流 ====================
const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit = 300) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ==================== 7. 动画触发器 ====================
class AnimationTrigger {
    constructor(options = {}) {
        this.options = {
            threshold: 0.1,
            rootMargin: '0px',
            ...options
        };

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            this.options
        );
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animation = element.dataset.animation || 'fade-in';
                element.classList.add(animation);

                if (!element.dataset.animateRepeat) {
                    this.observer.unobserve(element);
                }
            } else if (entry.target.dataset.animateRepeat) {
                entry.target.classList.remove(entry.target.dataset.animation || 'fade-in');
            }
        });
    }

    observe(elements) {
        elements.forEach(el => this.observer.observe(el));
    }

    static init() {
        const animatedElements = document.querySelectorAll('[data-animation]');
        const trigger = new AnimationTrigger();
        trigger.observe(animatedElements);
        return trigger;
    }
}

// ==================== 8. 数字滚动动画 ====================
const animateNumber = (element, target, duration = 1000) => {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (!element) return;

    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = Math.round(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
        element.classList.add('number-roll');
    }, 16);
};

// ==================== 9. 表单验证增强 ====================
class FormValidator {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^1[3-9]\d{9}$/;
        return re.test(phone);
    }

    static showError(input, message) {
        input.classList.add('shake', 'error');
        const errorDiv = input.parentElement.querySelector('.error-message') ||
                        document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';

        if (!input.parentElement.querySelector('.error-message')) {
            input.parentElement.appendChild(errorDiv);
        }

        setTimeout(() => input.classList.remove('shake'), 500);
    }

    static clearError(input) {
        input.classList.remove('error');
        const errorDiv = input.parentElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// ==================== 10. 性能优化：请求缓存 ====================
class RequestCache {
    constructor(maxAge = 5 * 60 * 1000) { // 默认5分钟
        this.cache = new Map();
        this.maxAge = maxAge;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }
}

// ==================== 11. 页面可见性检测 ====================
const PageVisibility = {
    isHidden: false,
    callbacks: [],

    init() {
        document.addEventListener('visibilitychange', () => {
            this.isHidden = document.hidden;
            this.callbacks.forEach(cb => cb(this.isHidden));
        });
    },

    onChange(callback) {
        this.callbacks.push(callback);
    }
};

// ==================== 12. 模态框管理 ====================
class Modal {
    constructor(options = {}) {
        this.options = {
            closeOnEscape: true,
            closeOnBackdrop: true,
            ...options
        };
        this.isOpen = false;
    }

    open(content) {
        if (this.isOpen) return;

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop fade-in';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content bounce-in';
        modalContent.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;
        modalContent.innerHTML = content;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        this.modal = modal;
        this.isOpen = true;

        // 事件监听
        if (this.options.closeOnBackdrop) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.close();
            });
        }

        if (this.options.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this.escapeHandler);
        }

        return this;
    }

    close() {
        if (!this.isOpen || !this.modal) return;

        this.modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
            document.body.style.overflow = '';
            this.isOpen = false;
        }, 300);

        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
    }
}

// ==================== 导出所有工具 ====================
window.UXUtils = {
    LazyLoader,
    smoothScroll,
    Toast: new Toast(),
    LoadingState,
    SkeletonGenerator,
    debounce,
    throttle,
    AnimationTrigger,
    animateNumber,
    FormValidator,
    RequestCache,
    PageVisibility,
    Modal
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化懒加载
    LazyLoader.init();

    // 初始化平滑滚动
    smoothScroll.init();

    // 初始化动画触发器
    AnimationTrigger.init();

    // 初始化页面可见性检测
    PageVisibility.init();

    console.log('✅ UX Enhancement Utils initialized');
});
