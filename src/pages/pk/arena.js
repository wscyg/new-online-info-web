/**
 * PK Arena (PK广场) - 匹配和邀请页面
 * 功能：快速匹配、好友邀请、在线用户列表、对战模式选择
 */

import { getPKWebSocket } from '../../utils/websocket-pk.js';
import { usePKStore, BATTLE_MODES } from '../../store/pk-store.js';

class PKArena {
    constructor() {
        this.store = usePKStore;
        this.wsClient = null;
        this.matchingTimer = null;
        this.matchingDuration = 0;
        this.state = this.store.getState();
    }

    /**
     * 初始化页面
     */
    async init() {
        console.log('[PK Arena] Initializing...');

        // 订阅store变化
        this.store.subscribe((state) => {
            this.state = state;
            this.render();
        });

        // 检查用户登录状态
        if (!this.checkAuth()) {
            return;
        }

        // 初始化WebSocket
        this.initWebSocket();

        // 加载数据
        await this.loadData();

        // 绑定事件
        this.bindEvents();

        // 渲染页面
        this.render();

        console.log('[PK Arena] Initialized successfully');
    }

    /**
     * 检查认证
     */
    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/src/pages/login.html';
            return false;
        }
        return true;
    }

    /**
     * 初始化WebSocket
     */
    initWebSocket() {
        this.wsClient = getPKWebSocket({ debug: true });

        // 连接WebSocket
        this.wsClient.connect();

        // 监听连接事件
        this.wsClient.on('connected', () => {
            console.log('[PK Arena] WebSocket connected');
            this.store.getState().setWSConnected(true);
        });

        this.wsClient.on('disconnected', () => {
            console.log('[PK Arena] WebSocket disconnected');
            this.store.getState().setWSConnected(false);
        });

        // 监听匹配成功
        this.wsClient.on('match_found', (data) => {
            console.log('[PK Arena] Match found:', data);
            this.onMatchFound(data);
        });

        // 监听好友邀请
        this.wsClient.on('invite_received', (data) => {
            console.log('[PK Arena] Invite received:', data);
            this.onInviteReceived(data);
        });
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            // 加载用户统计
            await this.store.getState().loadUserStats();

            // 加载好友列表
            await this.store.getState().loadFriends();

            // 加载在线用户
            await this.store.getState().loadOnlineUsers();

        } catch (error) {
            console.error('[PK Arena] Failed to load data:', error);
            this.showNotification('加载数据失败', 'error');
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 快速匹配按钮
        document.getElementById('quickMatchBtn')?.addEventListener('click', () => {
            this.startQuickMatch();
        });

        // 取消匹配按钮
        document.getElementById('cancelMatchBtn')?.addEventListener('click', () => {
            this.cancelMatching();
        });

        // 模式选择按钮
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.selectMode(mode);
            });
        });

        // 邀请好友按钮
        document.querySelectorAll('[data-invite-friend]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.currentTarget.dataset.inviteFriend;
                this.inviteFriend(friendId);
            });
        });

        // 搜索用户
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchUsers(e.target.value);
                }, 300);
            });
        }
    }

    /**
     * 选择对战模式
     */
    selectMode(mode) {
        // 更新按钮状态
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // 保存选中的模式
        this.selectedMode = mode;

        console.log('[PK Arena] Mode selected:', mode);
    }

    /**
     * 开始快速匹配
     */
    async startQuickMatch() {
        const mode = this.selectedMode || 'QUICK';

        try {
            // 调用API加入匹配队列
            const response = await window.API.pk.joinMatching(mode);

            if (response.code === 200) {
                // 更新store状态
                this.store.getState().startMatching(mode);

                // 开始计时
                this.startMatchingTimer();

                // 显示匹配中状态
                this.showMatchingUI();

                console.log('[PK Arena] Started matching, mode:', mode);
            } else {
                this.showNotification(response.message || '匹配失败', 'error');
            }
        } catch (error) {
            console.error('[PK Arena] Failed to start matching:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 取消匹配
     */
    async cancelMatching() {
        try {
            const response = await window.API.pk.cancelMatching();

            if (response.code === 200) {
                this.store.getState().cancelMatching();
                this.stopMatchingTimer();
                this.hideMatchingUI();
                console.log('[PK Arena] Matching cancelled');
            }
        } catch (error) {
            console.error('[PK Arena] Failed to cancel matching:', error);
        }
    }

    /**
     * 开始匹配计时器
     */
    startMatchingTimer() {
        this.matchingDuration = 0;
        this.matchingTimer = setInterval(() => {
            this.matchingDuration++;
            this.updateMatchingTimer();
        }, 1000);
    }

    /**
     * 停止匹配计时器
     */
    stopMatchingTimer() {
        if (this.matchingTimer) {
            clearInterval(this.matchingTimer);
            this.matchingTimer = null;
        }
        this.matchingDuration = 0;
    }

    /**
     * 更新匹配计时显示
     */
    updateMatchingTimer() {
        const timerEl = document.getElementById('matchingTimer');
        if (timerEl) {
            const minutes = Math.floor(this.matchingDuration / 60);
            const seconds = this.matchingDuration % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * 显示匹配中UI
     */
    showMatchingUI() {
        const matchingModal = document.getElementById('matchingModal');
        if (matchingModal) {
            matchingModal.classList.remove('hidden');
            matchingModal.classList.add('active');
        }
    }

    /**
     * 隐藏匹配中UI
     */
    hideMatchingUI() {
        const matchingModal = document.getElementById('matchingModal');
        if (matchingModal) {
            matchingModal.classList.add('hidden');
            matchingModal.classList.remove('active');
        }
    }

    /**
     * 匹配成功回调
     */
    onMatchFound(data) {
        // 停止匹配计时
        this.stopMatchingTimer();

        // 更新store
        this.store.getState().matchFound(data);

        // 显示匹配成功界面
        this.showMatchFoundUI(data);

        // 3秒后跳转到对战页面
        setTimeout(() => {
            window.location.href = `/src/pages/pk-battle.html?battleId=${data.battleId}`;
        }, 3000);
    }

    /**
     * 显示匹配成功UI
     */
    showMatchFoundUI(data) {
        const matchingModal = document.getElementById('matchingModal');
        if (matchingModal) {
            matchingModal.innerHTML = `
                <div class="match-found-animation">
                    <div class="success-icon">✓</div>
                    <h2>匹配成功！</h2>
                    <div class="opponent-info">
                        <div class="opponent-avatar">
                            ${data.opponent.avatar
                                ? `<img src="${data.opponent.avatar}" alt="${data.opponent.nickname}">`
                                : data.opponent.nickname[0].toUpperCase()
                            }
                        </div>
                        <div class="opponent-name">${data.opponent.nickname}</div>
                        <div class="opponent-tier">${window.getTierName(data.opponent.tier)} ${window.getTierIcon(data.opponent.tier)}</div>
                        <div class="opponent-elo">ELO: ${data.opponent.elo}</div>
                    </div>
                    <div class="countdown">3秒后进入对战...</div>
                </div>
            `;
        }
    }

    /**
     * 邀请好友
     */
    async inviteFriend(friendId) {
        const mode = this.selectedMode || 'QUICK';

        try {
            const response = await window.API.pk.inviteFriend(friendId, mode);

            if (response.code === 200) {
                this.showNotification('邀请已发送', 'success');
            } else {
                this.showNotification(response.message || '邀请失败', 'error');
            }
        } catch (error) {
            console.error('[PK Arena] Failed to invite friend:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 收到好友邀请
     */
    onInviteReceived(data) {
        this.showInviteNotification(data);
    }

    /**
     * 显示邀请通知
     */
    showInviteNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'invite-notification';
        notification.innerHTML = `
            <div class="invite-content">
                <div class="invite-avatar">
                    ${data.inviter.avatar
                        ? `<img src="${data.inviter.avatar}" alt="${data.inviter.nickname}">`
                        : data.inviter.nickname[0].toUpperCase()
                    }
                </div>
                <div class="invite-info">
                    <div class="invite-text">${data.inviter.nickname} 邀请你进行对战</div>
                    <div class="invite-mode">${BATTLE_MODES[data.mode]?.name || '快速模式'}</div>
                </div>
                <div class="invite-actions">
                    <button class="btn-accept" data-invite-id="${data.inviteId}">接受</button>
                    <button class="btn-reject" data-invite-id="${data.inviteId}">拒绝</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // 绑定按钮事件
        notification.querySelector('.btn-accept')?.addEventListener('click', () => {
            this.acceptInvite(data.inviteId);
            notification.remove();
        });

        notification.querySelector('.btn-reject')?.addEventListener('click', () => {
            this.rejectInvite(data.inviteId);
            notification.remove();
        });

        // 30秒后自动移除
        setTimeout(() => {
            notification.remove();
        }, 30000);
    }

    /**
     * 接受邀请
     */
    async acceptInvite(inviteId) {
        try {
            const response = await window.API.pk.acceptInvite(inviteId);

            if (response.code === 200 && response.data) {
                // 跳转到对战页面
                window.location.href = `/src/pages/pk-battle.html?battleId=${response.data.battleId}`;
            } else {
                this.showNotification(response.message || '接受邀请失败', 'error');
            }
        } catch (error) {
            console.error('[PK Arena] Failed to accept invite:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 拒绝邀请
     */
    async rejectInvite(inviteId) {
        try {
            await window.API.pk.rejectInvite(inviteId);
            this.showNotification('已拒绝邀请', 'info');
        } catch (error) {
            console.error('[PK Arena] Failed to reject invite:', error);
        }
    }

    /**
     * 搜索用户
     */
    async searchUsers(keyword) {
        if (!keyword || keyword.trim().length < 2) {
            return;
        }

        try {
            const response = await window.API.friend.searchUsers(keyword);

            if (response.code === 200 && response.data) {
                this.renderSearchResults(response.data.items || response.data);
            }
        } catch (error) {
            console.error('[PK Arena] Failed to search users:', error);
        }
    }

    /**
     * 渲染搜索结果
     */
    renderSearchResults(users) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (users.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">未找到用户</div>';
            return;
        }

        resultsContainer.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-avatar">
                    ${user.avatar
                        ? `<img src="${user.avatar}" alt="${user.nickname}">`
                        : user.nickname[0].toUpperCase()
                    }
                </div>
                <div class="user-info">
                    <div class="user-name">${user.nickname}</div>
                    <div class="user-tier">${window.getTierIcon(user.tier)} ${window.getTierName(user.tier)}</div>
                </div>
                <button class="btn-invite" data-invite-friend="${user.id}">邀请对战</button>
            </div>
        `).join('');

        // 重新绑定邀请按钮事件
        resultsContainer.querySelectorAll('[data-invite-friend]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.currentTarget.dataset.inviteFriend;
                this.inviteFriend(friendId);
            });
        });
    }

    /**
     * 渲染页面
     */
    render() {
        this.renderUserStats();
        this.renderFriendsList();
        this.renderOnlineUsers();
    }

    /**
     * 渲染用户统计
     */
    renderUserStats() {
        const statsContainer = document.getElementById('userStats');
        if (!statsContainer) return;

        const { userStats } = this.state;
        const tierInfo = window.TIERS[userStats.tier] || window.TIERS.SILVER;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">${tierInfo.icon}</div>
                <div class="stat-value">${tierInfo.name}</div>
                <div class="stat-label">当前段位</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${userStats.elo || 1200}</div>
                <div class="stat-label">ELO 等级分</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${userStats.winRate || 0}%</div>
                <div class="stat-label">胜率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${userStats.streak || 0}</div>
                <div class="stat-label">连胜</div>
            </div>
        `;
    }

    /**
     * 渲染好友列表
     */
    renderFriendsList() {
        const friendsContainer = document.getElementById('friendsList');
        if (!friendsContainer) return;

        const { friends } = this.state;

        if (friends.length === 0) {
            friendsContainer.innerHTML = '<div class="no-friends">暂无好友</div>';
            return;
        }

        friendsContainer.innerHTML = friends.map(friend => `
            <div class="friend-item">
                <div class="friend-avatar ${friend.online ? 'online' : ''}">
                    ${friend.avatar
                        ? `<img src="${friend.avatar}" alt="${friend.nickname}">`
                        : friend.nickname[0].toUpperCase()
                    }
                    ${friend.online ? '<span class="online-indicator"></span>' : ''}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.nickname}</div>
                    <div class="friend-tier">${window.getTierIcon(friend.tier)} ${friend.elo || 1200}</div>
                </div>
                ${friend.online
                    ? `<button class="btn-invite-small" data-invite-friend="${friend.id}">邀请</button>`
                    : '<span class="offline-badge">离线</span>'
                }
            </div>
        `).join('');

        // 重新绑定邀请按钮
        friendsContainer.querySelectorAll('[data-invite-friend]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.currentTarget.dataset.inviteFriend;
                this.inviteFriend(friendId);
            });
        });
    }

    /**
     * 渲染在线用户
     */
    renderOnlineUsers() {
        const usersContainer = document.getElementById('onlineUsersList');
        if (!usersContainer) return;

        const { onlineUsers } = this.state;

        if (onlineUsers.length === 0) {
            usersContainer.innerHTML = '<div class="no-users">暂无在线用户</div>';
            return;
        }

        usersContainer.innerHTML = onlineUsers.map(user => `
            <div class="online-user-item">
                <div class="user-avatar online">
                    ${user.avatar
                        ? `<img src="${user.avatar}" alt="${user.nickname}">`
                        : user.nickname[0].toUpperCase()
                    }
                    <span class="online-indicator"></span>
                </div>
                <div class="user-info">
                    <div class="user-name">${user.nickname}</div>
                    <div class="user-tier">${window.getTierIcon(user.tier)} ${user.elo || 1200}</div>
                </div>
                <button class="btn-challenge" data-invite-friend="${user.id}">挑战</button>
            </div>
        `).join('');

        // 绑定挑战按钮
        usersContainer.querySelectorAll('[data-invite-friend]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.inviteFriend;
                this.inviteFriend(userId);
            });
        });
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 使用全局通知系统
        if (window.appState) {
            window.appState.setState('notification', {
                type,
                title: type === 'success' ? '成功' : type === 'error' ? '错误' : '提示',
                message
            });
        } else {
            alert(message);
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
        if (this.matchingTimer) {
            clearInterval(this.matchingTimer);
        }
    }
}

// 导出
export default PKArena;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    window.PKArena = PKArena;

    document.addEventListener('DOMContentLoaded', () => {
        const arena = new PKArena();
        arena.init();

        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            arena.destroy();
        });
    });
}
