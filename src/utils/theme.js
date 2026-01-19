/**
 * 统一主题管理
 */

class ThemeManager {
    constructor() {
        this.storageKey = 'theme';
        this.themes = ['light', 'dark'];
        this.defaultTheme = 'dark';
        this.listeners = [];
    }

    /**
     * 获取当前主题
     */
    getTheme() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved && this.themes.includes(saved)) {
            return saved;
        }
        // 检查系统偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return this.defaultTheme;
    }

    /**
     * 设置主题
     */
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            theme = this.defaultTheme;
        }
        localStorage.setItem(this.storageKey, theme);
        this.applyTheme(theme);
        this.notifyListeners(theme);
    }

    /**
     * 切换主题
     */
    toggle() {
        const current = this.getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    /**
     * 应用主题到 DOM
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);

        // 更新主题图标（如果存在）
        this.updateThemeIcon(theme);
    }

    /**
     * 更新主题图标
     */
    updateThemeIcon(theme) {
        const iconElement = document.getElementById('themeIcon') || document.querySelector('.theme-toggle svg');
        if (!iconElement) return;

        if (theme === 'dark') {
            iconElement.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            `;
        } else {
            iconElement.innerHTML = `
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            `;
        }
    }

    /**
     * 初始化主题
     */
    init() {
        const theme = this.getTheme();
        this.applyTheme(theme);

        // 监听系统主题变化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem(this.storageKey)) {
                    // 只有用户没有手动设置过主题时才跟随系统
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        // 绑定主题切换按钮
        document.addEventListener('click', e => {
            const toggleBtn = e.target.closest('.theme-toggle, #themeToggle, [data-theme-toggle]');
            if (toggleBtn) {
                this.toggle();
            }
        });

        return theme;
    }

    /**
     * 监听主题变化
     */
    onThemeChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * 通知监听器
     */
    notifyListeners(theme) {
        this.listeners.forEach(callback => callback(theme));
    }
}

// 创建全局实例
const theme = new ThemeManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, theme };
} else {
    window.ThemeManager = ThemeManager;
    window.theme = theme;
}
