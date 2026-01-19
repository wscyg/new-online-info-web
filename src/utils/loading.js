/**
 * 统一加载状态管理
 */

class LoadingManager {
    constructor() {
        this.overlay = null;
        this.count = 0;
        this.init();
    }

    init() {
        // 创建全局加载遮罩
        this.overlay = document.createElement('div');
        this.overlay.id = 'global-loading-overlay';
        this.overlay.innerHTML = \`
            <div class="loading-spinner">
                <svg viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
                </svg>
                <span class="loading-text">加载中...</span>
            </div>
        \`;
        this.overlay.style.cssText = \`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
        \`;
        document.body.appendChild(this.overlay);

        // 添加样式
        if (!document.getElementById('loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = \`
                .loading-spinner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .loading-spinner svg {
                    width: 50px;
                    height: 50px;
                    animation: rotate 1s linear infinite;
                }
                .loading-spinner circle {
                    stroke: #3b82f6;
                    stroke-linecap: round;
                    animation: dash 1.5s ease-in-out infinite;
                }
                .loading-text {
                    color: white;
                    font-size: 14px;
                }
                @keyframes rotate {
                    100% { transform: rotate(360deg); }
                }
                @keyframes dash {
                    0% {
                        stroke-dasharray: 1, 150;
                        stroke-dashoffset: 0;
                    }
                    50% {
                        stroke-dasharray: 90, 150;
                        stroke-dashoffset: -35;
                    }
                    100% {
                        stroke-dasharray: 90, 150;
                        stroke-dashoffset: -124;
                    }
                }

                /* 按钮加载状态 */
                .btn-loading {
                    position: relative;
                    pointer-events: none;
                    opacity: 0.7;
                }
                .btn-loading::after {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    top: 50%;
                    left: 50%;
                    margin-left: -8px;
                    margin-top: -8px;
                    border: 2px solid transparent;
                    border-top-color: currentColor;
                    border-radius: 50%;
                    animation: rotate 0.8s linear infinite;
                }

                /* 骨架屏 */
                .skeleton {
                    background: linear-gradient(90deg, #2a2a3e 25%, #3a3a4e 50%, #2a2a3e 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                    border-radius: 4px;
                }
                .skeleton-text {
                    height: 16px;
                    margin-bottom: 8px;
                }
                .skeleton-title {
                    height: 24px;
                    width: 60%;
                    margin-bottom: 12px;
                }
                .skeleton-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
                .skeleton-card {
                    height: 200px;
                    border-radius: 12px;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* 空状态 */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                    color: #888;
                }
                .empty-state svg {
                    width: 80px;
                    height: 80px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                .empty-state h3 {
                    font-size: 18px;
                    margin-bottom: 8px;
                    color: #aaa;
                }
                .empty-state p {
                    font-size: 14px;
                }

                /* 错误状态 */
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                }
                .error-state svg {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 16px;
                    color: #ef4444;
                }
                .error-state h3 {
                    font-size: 18px;
                    margin-bottom: 8px;
                    color: #ef4444;
                }
                .error-state p {
                    font-size: 14px;
                    color: #888;
                    margin-bottom: 16px;
                }
                .error-state button {
                    padding: 8px 24px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .error-state button:hover {
                    background: #2563eb;
                }
            \`;
            document.head.appendChild(style);
        }
    }

    show(text = '加载中...') {
        this.count++;
        const textEl = this.overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = text;
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.count = Math.max(0, this.count - 1);
        if (this.count === 0) {
            this.overlay.style.display = 'none';
        }
    }

    forceHide() {
        this.count = 0;
        this.overlay.style.display = 'none';
    }

    setButtonLoading(button, isLoading, originalText = null) {
        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.classList.add('btn-loading');
            button.disabled = true;
            button.textContent = '';
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            button.textContent = originalText || button.dataset.originalText || '提交';
        }
    }

    createSkeleton(type = 'card', count = 1) {
        const skeletons = {
            card: '<div class="skeleton skeleton-card"></div>',
            text: '<div class="skeleton skeleton-text"></div>',
            title: '<div class="skeleton skeleton-title"></div>',
            avatar: '<div class="skeleton skeleton-avatar"></div>',
            list: \`
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-title" style="width: 40%;"></div>
                        <div class="skeleton skeleton-text" style="width: 80%;"></div>
                    </div>
                </div>
            \`
        };
        return Array(count).fill(skeletons[type] || skeletons.card).join('');
    }

    createEmptyState(message = '暂无数据', subMessage = '') {
        return \`
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <h3>\${message}</h3>
                \${subMessage ? \`<p>\${subMessage}</p>\` : ''}
            </div>
        \`;
    }

    createErrorState(message = '加载失败', retryCallback = null) {
        const retryId = 'retry-' + Date.now();
        if (retryCallback) {
            setTimeout(() => {
                const btn = document.getElementById(retryId);
                if (btn) btn.onclick = retryCallback;
            }, 0);
        }
        return \`
            <div class="error-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h3>\${message}</h3>
                <p>请检查网络连接后重试</p>
                \${retryCallback ? \`<button id="\${retryId}">重新加载</button>\` : ''}
            </div>
        \`;
    }
}

const loading = new LoadingManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoadingManager, loading };
} else {
    window.LoadingManager = LoadingManager;
    window.loading = loading;
}
