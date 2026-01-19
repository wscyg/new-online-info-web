/* global window, document, localStorage, sessionStorage, fetch */
(function () {
  'use strict';

  const API_BASE = localStorage.getItem('API_BASE') || '/api';
  const TEMPLATE_API_BASE = localStorage.getItem('TEMPLATE_API_BASE') || '/api';
  const NAV_LINKS = [
    { label: '学习中心', href: 'dashboard.html' },
    { label: '个人主页', href: 'profile.html' },
    { label: '我的课程', href: 'my-courses.html' },
    { label: '我的订单', href: 'orders.html' }
  ];

  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  function getStoredUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
  }

  function ensureAuthAreaExists() {
    let authArea = document.getElementById('authArea');
    if (!authArea) {
      authArea = document.getElementById('userMenu') || document.getElementById('userMenuContainer');
    }
    if (!authArea) {
      authArea = document.createElement('div');
      authArea.id = 'authArea';
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        navActions.appendChild(authArea);
      }
    }
    return authArea;
  }

  function renderGuest(authArea) {
    authArea.innerHTML = '<a href="login.html" class="btn btn-sm btn-secondary">登录</a>';
  }

  function buildUserMenuHtml(user) {
    const name = user?.nickname || user?.username || '用户';
    const initial = name.charAt(0).toUpperCase();
    const menuItems = NAV_LINKS.map((item) => {
      return '<div class="dropdown-item" data-href="' + item.href + '">' +
        '<span>' + item.label + '</span>' +
      '</div>';
    }).join('');

    return '' +
      '<div class="user-menu" id="appUserMenu">' +
      '  <div class="user-avatar" id="appUserAvatar">' + initial + '</div>' +
      '  <div class="dropdown" id="appUserDropdown">' +
      '    ' + menuItems +
      '    <div class="dropdown-divider"></div>' +
      '    <div class="dropdown-item" data-action="logout">退出登录</div>' +
      '  </div>' +
      '</div>';
  }

  function bindUserMenuEvents() {
    const avatar = document.getElementById('appUserAvatar');
    const dropdown = document.getElementById('appUserDropdown');
    if (!avatar || !dropdown) return;

    avatar.addEventListener('click', function (event) {
      event.stopPropagation();
      dropdown.classList.toggle('show');
    });

    dropdown.addEventListener('click', function (event) {
      const target = event.target.closest('.dropdown-item');
      if (!target) return;
      const href = target.getAttribute('data-href');
      const action = target.getAttribute('data-action');
      if (href) {
        window.location.href = href;
      } else if (action === 'logout') {
        clearAuth();
        window.location.href = 'login.html';
      }
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('#appUserMenu')) {
        dropdown.classList.remove('show');
      }
    });
  }

  function ensureMenuStyles() {
    if (document.getElementById('appShellMenuStyle')) return;
    const style = document.createElement('style');
    style.id = 'appShellMenuStyle';
    style.textContent = '' +
      '.user-menu{position:relative;display:inline-flex;align-items:center;}' +
      '.user-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-weight:600;cursor:pointer;}' +
      '.dropdown{position:absolute;right:0;top:calc(100% + 10px);min-width:180px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;box-shadow:var(--shadow-md);padding:8px;opacity:0;pointer-events:none;transform:translateY(6px);transition:all .2s;z-index:1000;}' +
      '.dropdown.show{opacity:1;pointer-events:auto;transform:translateY(0);}' +
      '.dropdown-item{padding:10px 12px;border-radius:10px;font-size:14px;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;gap:8px;}' +
      '.dropdown-item:hover{background:var(--bg-hover);}' +
      '.dropdown-divider{height:1px;background:var(--border-color);margin:6px 0;}' +
      '.auth-banner{background:rgba(15,23,42,0.05);border:1px solid var(--border-color);border-radius:14px;padding:14px 16px;margin:16px auto;max-width:1200px;display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
      '.auth-banner-title{font-size:14px;color:var(--text-primary);font-weight:600;}' +
      '.auth-banner-actions{display:flex;gap:8px;align-items:center;}' +
      '.auth-banner .btn{padding:8px 12px;font-size:13px;}' +
      '.sync-banner{background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.18);}' +
      '.sync-banner .auth-banner-title{color:#1d4ed8;}' +
      '.sync-banner .btn{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;}' +
      '.sync-banner .btn.secondary{background:rgba(59,130,246,0.12);color:#1d4ed8;}' +
      '';
    document.head.appendChild(style);
  }

  async function refreshProfile() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(API_BASE + '/user/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        if (res.status === 401) {
          clearAuth();
        }
        return null;
      }
      const data = await res.json();
      const user = data?.data?.user || data?.user || null;
      if (user) localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (e) {
      return null;
    }
  }

  function ensureAuthBanner() {
    let banner = document.getElementById('authBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'authBanner';
      banner.className = 'auth-banner';
      banner.style.display = 'none';
      document.body.insertBefore(banner, document.body.firstChild);
    }
    return banner;
  }

  function showLoginBanner() {
    const banner = ensureAuthBanner();
    banner.className = 'auth-banner';
    banner.innerHTML = '' +
      '<div class="auth-banner-title">登录状态已过期，请重新登录后继续。</div>' +
      '<div class="auth-banner-actions">' +
      '  <a class="btn btn-primary" href="login.html">去登录</a>' +
      '</div>';
    banner.style.display = 'flex';
  }

  function showSyncBanner(options) {
    const banner = ensureAuthBanner();
    banner.className = 'auth-banner sync-banner';
    const title = options?.title || '课程解锁异常，可一键同步订单';
    banner.innerHTML = '' +
      '<div class="auth-banner-title">' + title + '</div>' +
      '<div class="auth-banner-actions">' +
      '  <button class="btn" id="syncOrderBtn">重新同步</button>' +
      '  <a class="btn secondary" href="orders.html">查看订单</a>' +
      '</div>';
    banner.style.display = 'flex';
    return banner;
  }

  async function initUserMenu() {
    ensureMenuStyles();
    const authArea = ensureAuthAreaExists();
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      const legacyMenus = navActions.querySelectorAll('.user-menu');
      legacyMenus.forEach(function (node) {
        if (node && node.id !== 'appUserMenu') node.remove();
      });
    }
    const user = getStoredUser() || (await refreshProfile());
    if (!user) {
      renderGuest(authArea);
      return null;
    }
    authArea.innerHTML = buildUserMenuHtml(user);
    bindUserMenuEvents();
    return user;
  }

  window.AppShell = {
    initUserMenu,
    refreshProfile,
    showLoginBanner,
    showSyncBanner,
    getToken
  };

  // 暴露API基础路径到全局作用域
  window.API_BASE = API_BASE;
  window.TEMPLATE_API_BASE = TEMPLATE_API_BASE;

  function boot() {
    if (window.__appShellBooted) return;
    window.__appShellBooted = true;
    refreshProfile().then(function (user) {
      return initUserMenu().then(function () {
        if (!user && getToken()) {
          showLoginBanner();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
