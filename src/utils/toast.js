/**
 * 统一消息提示组件
 * 支持成功、错误、警告、信息四种类型
 */

class Toast {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.defaultDuration = 3000;
        this.init();
    }

    init() {
        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);

        // 添加样式
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast-message {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: toastIn 0.3s ease-out;
                    pointer-events: auto;
                    max-width: 400px;
                    word-break: break-word;
                }
                .toast-message.toast-out {
                    animation: toastOut 0.3s ease-in forwards;
                }
                .toast-success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                }
                .toast-error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                }
                .toast-warning {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                }
                .toast-info {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                }
                .toast-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }
                @keyframes toastIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes toastOut {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.9);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    getIcon(type) {
        const icons = {
            success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        return icons[type] || icons.info;
    }

    show(message, type = 'info', duration = this.defaultDuration) {
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.innerHTML = `${this.getIcon(type)}<span>${message}</span>`;

        this.container.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);

        return toast;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration || 4000); // 错误显示更长时间
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// 创建全局实例
const toast = new Toast();

// 兼容旧的 showToast 函数
function showToast(message, type = 'info', duration = 3000) {
    return toast.show(message, type, duration);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Toast, toast, showToast };
} else {
    window.Toast = Toast;
    window.toast = toast;
    window.showToast = showToast;
}
