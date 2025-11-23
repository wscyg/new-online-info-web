/**
 * Loading State Management Utility
 * Provides consistent loading states across all pages
 * Last updated: 2025-09-30
 */

class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.addStyles();
    }

    addStyles() {
        if (!document.getElementById('loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    border-radius: inherit;
                }

                .loading-overlay.dark {
                    background: rgba(17, 24, 39, 0.9);
                }

                .loading-spinner {
                    display: inline-block;
                    width: 48px;
                    height: 48px;
                    position: relative;
                }

                .loading-spinner::after {
                    content: '';
                    display: block;
                    width: 40px;
                    height: 40px;
                    margin: 4px;
                    border-radius: 50%;
                    border: 4px solid;
                    border-color: #6366f1 transparent #6366f1 transparent;
                    animation: loading-spin 1.2s linear infinite;
                }

                .loading-spinner-small {
                    width: 24px;
                    height: 24px;
                }

                .loading-spinner-small::after {
                    width: 16px;
                    height: 16px;
                    margin: 4px;
                    border-width: 2px;
                }

                .loading-skeleton {
                    background: linear-gradient(
                        90deg,
                        #f0f0f0 25%,
                        #e0e0e0 50%,
                        #f0f0f0 75%
                    );
                    background-size: 200% 100%;
                    animation: loading-skeleton 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }

                .loading-skeleton.dark {
                    background: linear-gradient(
                        90deg,
                        #1f2937 25%,
                        #374151 50%,
                        #1f2937 75%
                    );
                }

                .loading-text {
                    margin-top: 12px;
                    color: #6b7280;
                    font-size: 14px;
                    font-weight: 500;
                }

                .loading-text.dark {
                    color: #9ca3af;
                }

                .loading-dots::after {
                    content: '';
                    animation: loading-dots 1.5s steps(4, end) infinite;
                }

                @keyframes loading-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes loading-skeleton {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                @keyframes loading-dots {
                    0%, 20% { content: ''; }
                    40% { content: '.'; }
                    60% { content: '..'; }
                    80%, 100% { content: '...'; }
                }

                /* Card skeleton */
                .skeleton-card {
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .skeleton-card.dark {
                    background: #1f2937;
                }

                .skeleton-line {
                    height: 1rem;
                    margin-bottom: 0.75rem;
                }

                .skeleton-line:last-child {
                    width: 60%;
                    margin-bottom: 0;
                }

                .skeleton-circle {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                }

                .skeleton-rect {
                    width: 100%;
                    height: 100%;
                }

                /* List skeleton */
                .skeleton-list-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .skeleton-list-item.dark {
                    border-color: #374151;
                }

                /* Button loading state */
                .btn-loading {
                    position: relative;
                    color: transparent !important;
                    pointer-events: none;
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
                    border: 2px solid;
                    border-radius: 50%;
                    border-color: currentColor transparent currentColor transparent;
                    animation: loading-spin 1s linear infinite;
                }

                /* Fade in animation for loaded content */
                .fade-in {
                    animation: fade-in 0.3s ease-in;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Hide scrollbar during loading */
                body.loading {
                    overflow: hidden;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show loading overlay on an element
     * @param {HTMLElement|string} target - Element or selector
     * @param {Object} options - Options {text: string, size: 'small'|'default', dark: boolean}
     */
    show(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) {
            console.warn('Loading target element not found:', target);
            return null;
        }

        const loaderId = `loader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay' + (options.dark ? ' dark' : '');
        overlay.dataset.loaderId = loaderId;

        const content = document.createElement('div');
        content.className = 'loading-content';
        content.style.textAlign = 'center';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner' + (options.size === 'small' ? ' loading-spinner-small' : '');

        content.appendChild(spinner);

        if (options.text) {
            const text = document.createElement('div');
            text.className = 'loading-text loading-dots' + (options.dark ? ' dark' : '');
            text.textContent = options.text;
            content.appendChild(text);
        }

        overlay.appendChild(content);

        // Make element position relative if needed
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
        this.activeLoaders.add(loaderId);

        return loaderId;
    }

    /**
     * Hide loading overlay
     * @param {string|HTMLElement} targetOrId - Loader ID or element
     */
    hide(targetOrId) {
        if (typeof targetOrId === 'string' && targetOrId.startsWith('loader-')) {
            // It's a loader ID
            const overlay = document.querySelector(`[data-loader-id="${targetOrId}"]`);
            if (overlay) {
                overlay.remove();
                this.activeLoaders.delete(targetOrId);
            }
        } else {
            // It's an element
            const element = typeof targetOrId === 'string' ? document.querySelector(targetOrId) : targetOrId;
            if (element) {
                const overlays = element.querySelectorAll('.loading-overlay');
                overlays.forEach(overlay => {
                    const loaderId = overlay.dataset.loaderId;
                    overlay.remove();
                    if (loaderId) this.activeLoaders.delete(loaderId);
                });
            }
        }
    }

    /**
     * Show button loading state
     * @param {HTMLElement|string} button
     */
    showButton(button) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (btn) {
            btn.disabled = true;
            btn.classList.add('btn-loading');
            btn.dataset.originalText = btn.textContent;
        }
    }

    /**
     * Hide button loading state
     * @param {HTMLElement|string} button
     */
    hideButton(button) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
            if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
        }
    }

    /**
     * Create skeleton loading for a container
     * @param {HTMLElement|string} target
     * @param {Object} options - {type: 'card'|'list'|'custom', count: number, dark: boolean}
     */
    showSkeleton(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const { type = 'card', count = 3, dark = false } = options;
        const darkClass = dark ? ' dark' : '';

        element.innerHTML = '';
        element.classList.add('loading-skeleton-container');

        for (let i = 0; i < count; i++) {
            let skeleton;

            if (type === 'card') {
                skeleton = document.createElement('div');
                skeleton.className = `skeleton-card${darkClass}`;
                skeleton.innerHTML = `
                    <div class="loading-skeleton${darkClass} skeleton-rect" style="height: 160px; margin-bottom: 1rem;"></div>
                    <div class="loading-skeleton${darkClass} skeleton-line"></div>
                    <div class="loading-skeleton${darkClass} skeleton-line"></div>
                    <div class="loading-skeleton${darkClass} skeleton-line" style="width: 60%;"></div>
                `;
            } else if (type === 'list') {
                skeleton = document.createElement('div');
                skeleton.className = `skeleton-list-item${darkClass}`;
                skeleton.innerHTML = `
                    <div class="loading-skeleton${darkClass} skeleton-circle"></div>
                    <div style="flex: 1;">
                        <div class="loading-skeleton${darkClass} skeleton-line"></div>
                        <div class="loading-skeleton${darkClass} skeleton-line" style="width: 70%;"></div>
                    </div>
                `;
            }

            if (skeleton) {
                element.appendChild(skeleton);
            }
        }
    }

    /**
     * Hide skeleton loading
     * @param {HTMLElement|string} target
     */
    hideSkeleton(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (element) {
            element.classList.remove('loading-skeleton-container');
            element.classList.add('fade-in');
        }
    }

    /**
     * Show full page loading
     * @param {Object} options
     */
    showPage(options = {}) {
        if (document.getElementById('page-loader')) return;

        const overlay = document.createElement('div');
        overlay.id = 'page-loader';
        overlay.className = 'loading-overlay' + (options.dark ? ' dark' : '');
        overlay.style.position = 'fixed';
        overlay.style.zIndex = '9999';

        const content = document.createElement('div');
        content.className = 'loading-content';
        content.style.textAlign = 'center';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';

        content.appendChild(spinner);

        if (options.text) {
            const text = document.createElement('div');
            text.className = 'loading-text loading-dots' + (options.dark ? ' dark' : '');
            text.textContent = options.text;
            content.appendChild(text);
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);
        document.body.classList.add('loading');
    }

    /**
     * Hide full page loading
     */
    hidePage() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.remove();
            document.body.classList.remove('loading');
        }
    }

    /**
     * Clear all active loaders
     */
    clearAll() {
        this.activeLoaders.forEach(loaderId => {
            this.hide(loaderId);
        });
        this.activeLoaders.clear();
        this.hidePage();
    }

    /**
     * Wrap an async function with loading state
     * @param {Function} fn - Async function
     * @param {HTMLElement|string} target - Loading target
     * @param {Object} options - Loading options
     */
    async wrap(fn, target, options = {}) {
        const loaderId = this.show(target, options);
        try {
            const result = await fn();
            return result;
        } finally {
            this.hide(loaderId);
        }
    }
}

// Create singleton instance
const loading = new LoadingManager();

// Export for use
window.loading = loading;

export default loading;