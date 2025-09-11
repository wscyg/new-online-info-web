/**
 * localStorage调试工具
 * 监控localStorage的变化，帮助排查登录状态丢失问题
 */

(function() {
    console.log('===== localStorage Monitor Started =====');
    
    // 记录初始状态
    const initialState = {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        refreshToken: localStorage.getItem('refreshToken')
    };
    
    console.log('Initial localStorage state:', initialState);
    
    // 监听storage事件（其他页面修改localStorage时触发）
    window.addEventListener('storage', function(e) {
        console.log('[Storage Event]', {
            key: e.key,
            oldValue: e.oldValue,
            newValue: e.newValue,
            url: e.url
        });
    });
    
    // 拦截localStorage方法
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    localStorage.setItem = function(key, value) {
        console.log('[localStorage.setItem]', key, '=', value);
        console.trace('Call stack');
        return originalSetItem.apply(this, arguments);
    };
    
    localStorage.removeItem = function(key) {
        console.log('[localStorage.removeItem]', key);
        console.trace('Call stack');
        return originalRemoveItem.apply(this, arguments);
    };
    
    localStorage.clear = function() {
        console.log('[localStorage.clear] WARNING: Clearing all localStorage!');
        console.trace('Call stack');
        return originalClear.apply(this, arguments);
    };
    
    // 每5秒检查一次localStorage状态
    setInterval(function() {
        const currentState = {
            token: localStorage.getItem('token'),
            user: localStorage.getItem('user'),
            refreshToken: localStorage.getItem('refreshToken')
        };
        
        // 检查是否有变化
        if (JSON.stringify(currentState) !== JSON.stringify(initialState)) {
            console.log('[localStorage Changed]', {
                before: initialState,
                after: currentState
            });
        }
    }, 5000);
    
    // 添加全局函数检查状态
    window.checkAuthState = function() {
        console.log('Current auth state:', {
            token: localStorage.getItem('token'),
            user: localStorage.getItem('user'),
            refreshToken: localStorage.getItem('refreshToken'),
            tokenLength: localStorage.getItem('token')?.length,
            userParsed: (() => {
                try {
                    return JSON.parse(localStorage.getItem('user'));
                } catch(e) {
                    return 'Parse error: ' + e.message;
                }
            })()
        });
    };
    
    console.log('Tip: Use window.checkAuthState() to check current auth state');
})();