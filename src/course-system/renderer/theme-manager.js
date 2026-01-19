/**
 * 课程主题管理器
 * 支持一键换肤功能
 */

class ThemeManager {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            storageKey: 'course-theme',
            defaultTheme: 'default',
            showSwitcher: true,
            position: 'left', // left, right, bottom
            onThemeChange: null,
            ...options
        };

        // 预设主题
        this.themes = {
            default: {
                name: '星空紫',
                description: '经典深色渐变主题',
                preview: 'linear-gradient(135deg, #667eea, #764ba2)'
            },
            ocean: {
                name: '海洋蓝',
                description: '清新海洋风格',
                preview: 'linear-gradient(135deg, #0077b6, #00b4d8)'
            },
            forest: {
                name: '森林绿',
                description: '自然清新主题',
                preview: 'linear-gradient(135deg, #2d6a4f, #40916c)'
            },
            sunset: {
                name: '日落橙',
                description: '温暖活力主题',
                preview: 'linear-gradient(135deg, #e63946, #f4a261)'
            },
            violet: {
                name: '紫罗兰',
                description: '优雅紫色主题',
                preview: 'linear-gradient(135deg, #7b2cbf, #9d4edd)'
            },
            light: {
                name: '极简白',
                description: '明亮简洁主题',
                preview: 'linear-gradient(135deg, #f8f9fa, #dee2e6)'
            },
            cyberpunk: {
                name: '赛博朋克',
                description: '科技感霓虹主题',
                preview: 'linear-gradient(135deg, #00ff88, #ff00ff)'
            }
        };

        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        // 应用保存的主题
        this.applyTheme(this.currentTheme);

        // 创建主题切换器
        if (this.options.showSwitcher) {
            this.createSwitcher();
        }
    }

    /**
     * 加载保存的主题
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem(this.options.storageKey);
            if (saved && this.themes[saved]) {
                return saved;
            }
        } catch (e) {
            console.warn('Failed to load theme from storage:', e);
        }
        return this.options.defaultTheme;
    }

    /**
     * 保存主题设置
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.options.storageKey, theme);
        } catch (e) {
            console.warn('Failed to save theme:', e);
        }
    }

    /**
     * 应用主题
     */
    applyTheme(theme) {
        if (!this.themes[theme]) {
            console.warn(`Theme "${theme}" not found`);
            return;
        }

        const previousTheme = this.currentTheme;
        this.currentTheme = theme;

        // 移除所有主题属性
        this.options.container.removeAttribute('data-theme');

        // 应用新主题（default主题不需要data-theme属性）
        if (theme !== 'default') {
            this.options.container.setAttribute('data-theme', theme);
        }

        // 保存主题
        this.saveTheme(theme);

        // 更新切换器状态
        this.updateSwitcherState();

        // 触发回调
        if (this.options.onThemeChange) {
            this.options.onThemeChange({
                theme,
                previousTheme,
                themeData: this.themes[theme]
            });
        }

        // 添加过渡动画
        this.options.container.classList.add('theme-transitioning');
        setTimeout(() => {
            this.options.container.classList.remove('theme-transitioning');
        }, 300);
    }

    /**
     * 创建主题切换器UI
     */
    createSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = `theme-switcher position-${this.options.position}`;

        let html = '<div class="theme-switcher-toggle" title="切换主题">' +
                   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                   '<circle cx="12" cy="12" r="5"/>' +
                   '<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>' +
                   '</svg></div>';

        html += '<div class="theme-switcher-panel">';
        html += '<div class="theme-panel-header">选择主题</div>';
        html += '<div class="theme-options">';

        Object.entries(this.themes).forEach(([key, theme]) => {
            html += `<button class="theme-btn" data-theme="${key}" title="${theme.description}">
                <span class="theme-preview" style="background: ${theme.preview}"></span>
                <span class="theme-name">${theme.name}</span>
            </button>`;
        });

        html += '</div></div>';

        switcher.innerHTML = html;
        document.body.appendChild(switcher);

        // 绑定事件
        const toggle = switcher.querySelector('.theme-switcher-toggle');
        toggle.onclick = () => switcher.classList.toggle('open');

        switcher.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => {
                this.applyTheme(btn.dataset.theme);
                switcher.classList.remove('open');
            };
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!switcher.contains(e.target)) {
                switcher.classList.remove('open');
            }
        });

        this.switcherElement = switcher;
        this.updateSwitcherState();
    }

    /**
     * 更新切换器状态
     */
    updateSwitcherState() {
        if (!this.switcherElement) return;

        this.switcherElement.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
        });
    }

    /**
     * 获取当前主题
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * 获取所有可用主题
     */
    getThemes() {
        return { ...this.themes };
    }

    /**
     * 添加自定义主题
     */
    addTheme(key, theme) {
        this.themes[key] = theme;

        // 如果切换器已创建，更新它
        if (this.switcherElement) {
            const options = this.switcherElement.querySelector('.theme-options');
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            btn.dataset.theme = key;
            btn.title = theme.description;
            btn.innerHTML = `
                <span class="theme-preview" style="background: ${theme.preview}"></span>
                <span class="theme-name">${theme.name}</span>
            `;
            btn.onclick = () => {
                this.applyTheme(key);
                this.switcherElement.classList.remove('open');
            };
            options.appendChild(btn);
        }
    }

    /**
     * 切换到下一个主题
     */
    nextTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        this.applyTheme(themeKeys[nextIndex]);
    }

    /**
     * 切换到上一个主题
     */
    prevTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const prevIndex = (currentIndex - 1 + themeKeys.length) % themeKeys.length;
        this.applyTheme(themeKeys[prevIndex]);
    }
}

// 主题切换器样式
const themeManagerStyles = `
.theme-switcher {
    position: fixed;
    z-index: 1000;
}

.theme-switcher.position-left {
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
}

.theme-switcher.position-right {
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
}

.theme-switcher.position-bottom {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
}

.theme-switcher-toggle {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border-radius: 50%;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
}

.theme-switcher-toggle:hover {
    background: var(--theme-primary);
    border-color: var(--theme-primary);
    box-shadow: var(--shadow-glow);
}

.theme-switcher-toggle svg {
    width: 20px;
    height: 20px;
    color: var(--text-primary);
}

.theme-switcher-panel {
    position: absolute;
    top: 0;
    left: 54px;
    width: 200px;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    padding: 16px;
    opacity: 0;
    visibility: hidden;
    transform: translateX(-10px);
    transition: all 0.3s ease;
}

.theme-switcher.position-right .theme-switcher-panel {
    left: auto;
    right: 54px;
    transform: translateX(10px);
}

.theme-switcher.position-bottom .theme-switcher-panel {
    top: auto;
    bottom: 54px;
    left: 50%;
    transform: translate(-50%, 10px);
}

.theme-switcher.open .theme-switcher-panel {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
}

.theme-switcher.position-bottom.open .theme-switcher-panel {
    transform: translate(-50%, 0);
}

.theme-panel-header {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
}

.theme-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

.theme-switcher .theme-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px;
    background: var(--bg-secondary);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
}

.theme-switcher .theme-btn:hover {
    background: var(--bg-card);
}

.theme-switcher .theme-btn.active {
    border-color: var(--theme-primary);
    background: rgba(102, 126, 234, 0.1);
}

.theme-preview {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
}

.theme-name {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.theme-transitioning * {
    transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = themeManagerStyles;
    document.head.appendChild(styleEl);
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
window.ThemeManager = ThemeManager;
