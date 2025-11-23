/**
 * 用户认证与状态管理
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.isAuthenticated = !!this.token;
    
    this.init();
  }

  init() {
    console.log('[AuthManager] Initializing...');
    console.log('[AuthManager] Token exists:', !!this.token);

    // 启用token过期检查
    if (this.token && this.isTokenExpired()) {
      console.log('[AuthManager] Token expired, attempting refresh...');
      this.refreshAccessToken().catch(() => {
        console.warn('[AuthManager] Token refresh failed, clearing auth data');
        this.clearAuthData();
      });
    }

    // 从localStorage恢复用户信息
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
        console.log('[AuthManager] User restored from localStorage:', this.user);
        this.updateUserState();
      } catch (e) {
        console.error('[AuthManager] Failed to parse user data:', e);
      }
    }

    // 监听localStorage变化，实现跨标签页同步
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token被清除，同步退出登录
          console.log('[AuthManager] Token cleared in another tab, logging out');
          this.clearAuthData();
        } else if (e.newValue !== this.token) {
          // Token被更新，同步新token
          console.log('[AuthManager] Token updated in another tab, syncing');
          this.token = e.newValue;
          this.isAuthenticated = true;
          if (window.API?.service) {
            window.API.service.setToken(this.token);
          }
        }
      } else if (e.key === 'user') {
        if (!e.newValue) {
          this.user = null;
        } else {
          try {
            this.user = JSON.parse(e.newValue);
          } catch (error) {
            console.error('[AuthManager] Failed to parse user data from storage event:', error);
          }
        }
        this.updateUserState();
      }
    });

    // 定期检查token过期（每5分钟）
    setInterval(() => {
      if (this.token && this.isTokenExpired()) {
        console.log('[AuthManager] Token expired, attempting refresh...');
        this.refreshAccessToken().catch(() => {
          console.warn('[AuthManager] Token refresh failed during periodic check');
        });
      }
    }, 5 * 60 * 1000);
  }

  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.success) {
        this.setAuthData(response.data);
        await this.fetchUserInfo();
        
        window.appState.setState('notification', {
          type: 'success',
          title: '登录成功',
          message: `欢迎回来，${this.user.nickname || this.user.username}！`
        });

        return { success: true, user: this.user };
      }
      
      throw new Error(response.message || '登录失败');
    } catch (error) {
      window.appState.setState('notification', {
        type: 'error',
        title: '登录失败',
        message: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.success) {
        window.appState.setState('notification', {
          type: 'success',
          title: '注册成功',
          message: '账号创建成功，请登录您的账户'
        });
        return { success: true };
      }
      
      throw new Error(response.message || '注册失败');
    } catch (error) {
      window.appState.setState('notification', {
        type: 'error',
        title: '注册失败',
        message: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      if (this.token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout API failed:', error);
    } finally {
      this.clearAuthData();
      window.appState.setState('notification', {
        type: 'info',
        title: '已退出登录',
        message: '感谢使用我们的服务'
      });
      
      // 跳转到首页
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  async fetchUserInfo() {
    try {
      const response = await api.get('/user/profile');
      if (response.success) {
        this.user = response.data;
        localStorage.setItem('user', JSON.stringify(this.user));
        this.updateUserState();
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      console.warn('[AuthManager] No refresh token available');
      this.logout();
      return false;
    }

    try {
      console.log('[AuthManager] Refreshing access token...');
      const response = await api.post('/auth/refresh', {
        refreshToken: this.refreshToken
      });

      if (response.success && response.data.accessToken) {
        this.token = response.data.accessToken;
        localStorage.setItem('token', this.token);

        // 更新refresh token if provided
        if (response.data.refreshToken) {
          this.refreshToken = response.data.refreshToken;
          localStorage.setItem('refreshToken', this.refreshToken);
        }

        // Update API service token
        if (window.API?.service) {
          window.API.service.setToken(this.token);
        }

        console.log('[AuthManager] Token refresh successful');
        return true;
      }

      console.warn('[AuthManager] Token refresh failed: invalid response');
    } catch (error) {
      console.error('[AuthManager] Token refresh error:', error);
    }

    // Only logout if refresh fails
    this.logout();
    return false;
  }

  setAuthData(authData) {
    this.token = authData.accessToken;
    this.refreshToken = authData.refreshToken;
    this.isAuthenticated = true;

    localStorage.setItem('token', this.token);
    localStorage.setItem('refreshToken', this.refreshToken);
    
    api.setToken(this.token);
  }

  clearAuthData() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.isAuthenticated = false;

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    api.clearToken();
    this.updateUserState();
  }

  updateUserState() {
    window.appState.setState('user', this.user);
    window.appState.setState('isAuthenticated', this.isAuthenticated);
    
    // 更新UI
    this.updateAuthUI();
  }

  updateAuthUI() {
    const authContainer = document.getElementById('authContainer');
    const userProfile = document.getElementById('userProfile');
    
    if (!authContainer || !userProfile) return;

    if (this.isAuthenticated && this.user) {
      authContainer.style.display = 'none';
      userProfile.style.display = 'flex';
      
      // 更新用户头像和信息
      const avatar = userProfile.querySelector('#userAvatar');
      const welcomeText = userProfile.querySelector('.welcome-text');
      
      if (avatar && this.user.avatar) {
        avatar.src = this.user.avatar;
      }
      
      if (welcomeText) {
        welcomeText.textContent = `欢迎，${this.user.nickname || this.user.username}`;
      }
    } else {
      authContainer.style.display = 'flex';
      userProfile.style.display = 'none';
    }
  }

  isTokenExpired() {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  requireAuth() {
    if (!this.isAuthenticated) {
      window.appState.setState('notification', {
        type: 'warning',
        title: '需要登录',
        message: '请先登录您的账户'
      });
      
      setTimeout(() => {
        window.location.href = '/src/pages/login.html';
      }, 1500);
      
      return false;
    }
    return true;
  }

  hasRole(role) {
    return this.user?.roles?.includes(role) || false;
  }

  hasPermission(permission) {
    return this.user?.permissions?.includes(permission) || false;
  }
}

/**
 * 应用状态管理
 */
class AppStateManager {
  constructor() {
    this.state = {
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('language') || 'zh-CN',
      sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
      notifications: [],
      loading: false,
      online: navigator.onLine
    };

    this.subscribers = new Map();
    this.init();
  }

  init() {
    this.applyTheme();
    this.bindEvents();
    
    // 监听网络状态
    window.addEventListener('online', () => {
      this.setState('online', true);
      window.appState.setState('notification', {
        type: 'success',
        title: '网络已连接',
        message: '您的网络连接已恢复'
      });
    });

    window.addEventListener('offline', () => {
      this.setState('online', false);
      window.appState.setState('notification', {
        type: 'warning',
        title: '网络已断开',
        message: '请检查您的网络连接'
      });
    });
  }

  bindEvents() {
    // 主题切换
    document.addEventListener('click', (e) => {
      if (e.target.matches('#themeToggle') || e.target.closest('#themeToggle')) {
        this.toggleTheme();
      }
    });
  }

  setState(key, value) {
    this.state[key] = value;
    
    // 持久化某些状态
    if (['theme', 'language', 'sidebarCollapsed'].includes(key)) {
      localStorage.setItem(key, value);
    }

    // 特殊处理
    if (key === 'theme') {
      this.applyTheme();
    }

    // 通知订阅者
    this.notifySubscribers(key, value);
  }

  getState(key) {
    return this.state[key];
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  notifySubscribers(key, value) {
    this.subscribers.get(key)?.forEach(callback => callback(value));
  }

  toggleTheme() {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setState('theme', newTheme);
  }

  applyTheme() {
    const { theme } = this.state;
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // 更新主题切换按钮
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const sunIcon = themeToggle.querySelector('.sun-icon');
      const moonIcon = themeToggle.querySelector('.moon-icon');
      
      if (theme === 'dark') {
        sunIcon?.classList.remove('hidden');
        moonIcon?.classList.add('hidden');
      } else {
        sunIcon?.classList.add('hidden');
        moonIcon?.classList.remove('hidden');
      }
    }
  }

  setLoading(loading) {
    this.setState('loading', loading);
    
    // 更新全局加载状态
    const loadingIndicator = document.getElementById('globalLoading');
    if (loadingIndicator) {
      loadingIndicator.style.display = loading ? 'flex' : 'none';
    }
  }
}

// 创建全局实例
window.authManager = new AuthManager();
window.appStateManager = new AppStateManager();

// 暴露到全局
window.auth = window.authManager;

export { AuthManager, AppStateManager };