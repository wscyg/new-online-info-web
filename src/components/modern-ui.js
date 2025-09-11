/**
 * Modern Component System for Online Learning Platform
 * 基于原生JavaScript的现代化组件系统
 */

// 全局状态管理
class StateManager {
  constructor() {
    this.state = new Proxy({}, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.notifySubscribers(prop, value);
        return true;
      }
    });
    this.subscribers = new Map();
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // 返回取消订阅函数
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  notifySubscribers(key, value) {
    this.subscribers.get(key)?.forEach(callback => callback(value));
  }

  setState(key, value) {
    this.state[key] = value;
  }

  getState(key) {
    return this.state[key];
  }
}

// 创建全局状态实例
window.appState = new StateManager();

// 基础组件类
class Component {
  constructor(element, props = {}) {
    this.element = element;
    this.props = props;
    this.state = {};
    this.subscriptions = [];
    this.mounted = false;
    
    this.init();
  }

  init() {
    this.mount();
    this.bindEvents();
    this.mounted = true;
  }

  mount() {
    // 子类实现
  }

  unmount() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    this.mounted = false;
  }

  bindEvents() {
    // 子类实现
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    if (this.mounted) {
      this.render();
    }
  }

  render() {
    // 子类实现
  }

  subscribe(key, callback) {
    const unsubscribe = window.appState.subscribe(key, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }
}

// 通知系统组件
class NotificationSystem extends Component {
  mount() {
    this.createNotificationContainer();
    this.subscribe('notification', (notification) => {
      this.showNotification(notification);
    });
  }

  createNotificationContainer() {
    if (document.getElementById('notification-container')) return;
    
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-4';
    document.body.appendChild(container);
  }

  showNotification({ type = 'info', title, message, duration = 5000 }) {
    const notification = document.createElement('div');
    notification.className = `
      notification transform transition-all duration-300 ease-out translate-x-full
      bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700
      p-4 max-w-sm w-full backdrop-blur-sm
    `;

    const iconMap = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colorMap = {
      success: 'border-l-4 border-l-green-500',
      error: 'border-l-4 border-l-red-500',
      warning: 'border-l-4 border-l-yellow-500',
      info: 'border-l-4 border-l-blue-500'
    };

    notification.classList.add(...colorMap[type].split(' '));

    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <span class="text-lg">${iconMap[type]}</span>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white">${title}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${message}</p>
        </div>
        <button class="notification-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    const container = document.getElementById('notification-container');
    container.appendChild(notification);

    // 动画显示
    requestAnimationFrame(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    });

    // 绑定关闭事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.hideNotification(notification));

    // 自动关闭
    if (duration > 0) {
      setTimeout(() => this.hideNotification(notification), duration);
    }
  }

  hideNotification(notification) {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// 加载状态组件
class LoadingSpinner extends Component {
  mount() {
    this.element.innerHTML = `
      <div class="loading-spinner flex items-center justify-center">
        <div class="relative">
          <div class="w-8 h-8 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
          <div class="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-primary-300 rounded-full animate-spin animation-delay-75"></div>
        </div>
      </div>
    `;
  }
}

// 模态框组件
class Modal extends Component {
  constructor(props = {}) {
    super(null, props);
    this.createModal();
  }

  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = `
      modal-overlay fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50
      flex items-center justify-center p-4 opacity-0 transition-opacity duration-300
    `;

    this.modal = document.createElement('div');
    this.modal.className = `
      modal-content bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
      transform scale-95 transition-transform duration-300
      max-w-md w-full max-h-[90vh] overflow-y-auto
    `;

    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);
    this.element = this.modal;
  }

  mount() {
    this.render();
    this.bindEvents();
    
    // 显示动画
    requestAnimationFrame(() => {
      this.overlay.classList.remove('opacity-0');
      this.modal.classList.remove('scale-95');
      this.modal.classList.add('scale-100');
    });
  }

  bindEvents() {
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  render() {
    this.modal.innerHTML = `
      <div class="modal-header p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            ${this.props.title || '标题'}
          </h3>
          <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="modal-body p-6">
        ${this.props.content || '内容'}
      </div>
      ${this.props.actions ? `
        <div class="modal-footer p-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-end space-x-3">
            ${this.props.actions}
          </div>
        </div>
      ` : ''}
    `;

    const closeBtn = this.modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => this.close());
  }

  close() {
    this.overlay.classList.add('opacity-0');
    this.modal.classList.add('scale-95');
    
    setTimeout(() => {
      this.overlay.remove();
      this.props.onClose?.();
    }, 300);
  }
}

// 工具函数
const utils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 格式化日期
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      window.appState.setState('notification', {
        type: 'success',
        title: '复制成功',
        message: '内容已复制到剪贴板'
      });
    } catch (err) {
      console.error('复制失败:', err);
      window.appState.setState('notification', {
        type: 'error',
        title: '复制失败',
        message: '请手动复制内容'
      });
    }
  },

  // 平滑滚动到元素
  scrollToElement(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  },

  // 检查元素是否在视口中
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

// 暴露到全局
window.Component = Component;
window.NotificationSystem = NotificationSystem;
window.LoadingSpinner = LoadingSpinner;
window.Modal = Modal;
window.utils = utils;

// 初始化通知系统
document.addEventListener('DOMContentLoaded', () => {
  new NotificationSystem();
});

export { Component, NotificationSystem, LoadingSpinner, Modal, utils };