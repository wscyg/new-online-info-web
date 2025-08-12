// 应用初始化脚本 - 设置全局API对象
import './api.js';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 确保API对象已加载
    if (window.api) {
        console.log('API initialized successfully');
    } else {
        console.error('API not initialized');
    }
});