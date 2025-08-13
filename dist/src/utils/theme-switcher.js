// 全局主题切换工具
(function() {
    // 主题切换功能
    window.toggleTheme = function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        console.log('主题切换至:', newTheme);
        
        // 触发自定义事件，通知其他组件主题已变更
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    };

    // 初始化主题
    window.initTheme = function() {
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || systemTheme;
        
        document.documentElement.setAttribute('data-theme', theme);
        console.log('初始主题:', theme);
        
        // 触发主题初始化事件
        window.dispatchEvent(new CustomEvent('themeInitialized', { detail: { theme: theme } }));
    };

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            console.log('跟随系统主题:', theme);
            
            // 触发主题变更事件
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
        }
    });

    // 自动初始化主题（在DOM加载前就设置，避免闪烁）
    if (document.readyState === 'loading') {
        window.initTheme();
    }
})();