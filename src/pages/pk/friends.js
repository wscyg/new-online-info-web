/**
 * PK Friends (好友管理页面) - 好友系统
 * 功能：用户搜索、好友列表、好友请求、在线状态、快速PK邀请、删除好友
 */

import { usePKStore } from '../../store/pk-store.js';

class PKFriends {
    constructor() {
        this.store = usePKStore;
        this.state = this.store.getState();
        this.searchTimeout = null;
    }

    /**
     * 初始化好友管理页面
     */
    async init() {
        console.log('[PK Friends] Initializing...');

        // 订阅store变化
        this.store.subscribe((state) => {
            this.state = state;
            this.render();
        });

        // 绑定事件
        this.bindEvents();

        // 加载数据
        await this.loadData();

        // 初始渲染
        this.render();

        // 定期刷新在线状态
        this.startOnlineStatusRefresh();

        console.log('[PK Friends] Initialized');
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            // 加载好友列表
            await this.store.getState().loadFriends();

            // 加载待处理请求
            await this.store.getState().loadPendingRequests();

        } catch (error) {
            console.error('[PK Friends] Failed to load data:', error);
            this.showNotification('加载数据失败', 'error');
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索用户
        const searchInput = document.getElementById('friendSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // 搜索按钮
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            const keyword = document.getElementById('friendSearchInput')?.value;
            if (keyword) {
                this.searchUsers(keyword);
            }
        });

        // 刷新好友列表
        document.getElementById('refreshFriendsBtn')?.addEventListener('click', () => {
            this.refresh();
        });

        // Tab切换
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });
    }

    /**
     * 处理搜索输入
     */
    handleSearch(keyword) {
        clearTimeout(this.searchTimeout);

        if (keyword.trim().length < 2) {
            this.clearSearchResults();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.searchUsers(keyword);
        }, 300);
    }

    /**
     * 搜索用户
     */
    async searchUsers(keyword) {
        try {
            const response = await window.API.friend.searchUsers(keyword);

            if (response.code === 200 && response.data) {
                this.renderSearchResults(response.data.items || response.data);
            } else {
                this.renderSearchResults([]);
            }
        } catch (error) {
            console.error('[PK Friends] Failed to search users:', error);
            this.showNotification('搜索失败', 'error');
        }
    }

    /**
     * 清除搜索结果
     */
    clearSearchResults() {
        const container = document.getElementById('searchResults');
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * 渲染搜索结果
     */
    renderSearchResults(users) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div class="no-results">未找到用户</div>';
            return;
        }

        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

        container.innerHTML = users.map(user => {
            // 过滤掉自己
            if (user.id === currentUserId) {
                return '';
            }

            const isFriend = this.state.friends.some(f => f.id === user.id);
            const hasPendingRequest = this.state.pendingRequests.some(r =>
                r.fromUserId === user.id || r.toUserId === user.id
            );

            return `
                <div class="search-result-item">
                    <div class="user-avatar">
                        ${user.avatar
                            ? `<img src="${user.avatar}" alt="${user.nickname}">`
                            : user.nickname[0].toUpperCase()
                        }
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.nickname}</div>
                        <div class="user-tier">
                            ${window.getTierIcon(user.tier)} ${window.getTierName(user.tier)}
                            <span class="user-elo">ELO: ${user.elo || 1200}</span>
                        </div>
                        <div class="user-stats">
                            ${user.totalBattles || 0}场 | 胜率${user.winRate || 0}%
                        </div>
                    </div>
                    <div class="user-actions">
                        ${isFriend
                            ? '<button class="btn-secondary" disabled>已是好友</button>'
                            : hasPendingRequest
                                ? '<button class="btn-secondary" disabled>请求待处理</button>'
                                : `<button class="btn-primary" data-add-friend="${user.id}">添加好友</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        // 绑定添加好友按钮
        container.querySelectorAll('[data-add-friend]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.addFriend;
                this.sendFriendRequest(userId);
            });
        });
    }

    /**
     * 发送好友请求
     */
    async sendFriendRequest(userId) {
        const message = prompt('请输入验证消息（可选）:');

        try {
            const result = await this.store.getState().sendFriendRequest(userId, message || '');

            if (result.success) {
                this.showNotification('好友请求已发送', 'success');
                // 刷新搜索结果
                const keyword = document.getElementById('friendSearchInput')?.value;
                if (keyword) {
                    this.searchUsers(keyword);
                }
            } else {
                this.showNotification(result.error || '发送失败', 'error');
            }
        } catch (error) {
            console.error('[PK Friends] Failed to send friend request:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 切换Tab
     */
    switchTab(tab) {
        // 更新Tab按钮状态
        document.querySelectorAll('[data-tab]').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.content === tab);
        });
    }

    /**
     * 刷新数据
     */
    async refresh() {
        this.showNotification('刷新中...', 'info');
        await this.loadData();
        this.showNotification('刷新成功', 'success');
    }

    /**
     * 渲染页面
     */
    render() {
        this.renderFriendsList();
        this.renderOnlineFriends();
        this.renderPendingRequests();
    }

    /**
     * 渲染好友列表
     */
    renderFriendsList() {
        const container = document.getElementById('friendsList');
        if (!container) return;

        const { friends, friendsLoading } = this.state;

        if (friendsLoading) {
            container.innerHTML = '<div class="loading">加载中...</div>';
            return;
        }

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <p>暂无好友</p>
                    <p class="empty-hint">搜索用户并添加好友吧</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
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
                    <div class="friend-tier">
                        ${window.getTierIcon(friend.tier)} ${window.getTierName(friend.tier)}
                    </div>
                    <div class="friend-stats">
                        ELO ${friend.elo || 1200} | ${friend.totalBattles || 0}场对局
                    </div>
                </div>
                <div class="friend-actions">
                    ${friend.online
                        ? `<button class="btn-challenge" data-invite="${friend.id}">邀请对战</button>`
                        : '<span class="offline-badge">离线</span>'
                    }
                    <button class="btn-delete" data-delete="${friend.id}">删除</button>
                </div>
            </div>
        `).join('');

        // 绑定邀请按钮
        container.querySelectorAll('[data-invite]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.currentTarget.dataset.invite;
                this.inviteFriend(friendId);
            });
        });

        // 绑定删除按钮
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.currentTarget.dataset.delete;
                this.confirmDeleteFriend(friendId);
            });
        });
    }

    /**
     * 渲染在线好友
     */
    renderOnlineFriends() {
        const container = document.getElementById('onlineFriendsList');
        if (!container) return;

        const onlineFriends = this.state.friends.filter(f => f.online);

        if (onlineFriends.length === 0) {
            container.innerHTML = '<div class="no-online">暂无在线好友</div>';
            return;
        }

        container.innerHTML = onlineFriends.map(friend => `
            <div class="online-friend-item">
                <div class="friend-avatar online">
                    ${friend.avatar
                        ? `<img src="${friend.avatar}" alt="${friend.nickname}">`
                        : friend.nickname[0].toUpperCase()
                    }
                    <span class="online-indicator"></span>
                </div>
                <div class="friend-name">${friend.nickname}</div>
                <button class="btn-invite-small" data-invite="${friend.id}">邀请</button>
            </div>
        `).join('');

        // 绑定邀请按钮
        container.querySelectorAll('[data-invite]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.currentTarget.dataset.invite;
                this.inviteFriend(friendId);
            });
        });
    }

    /**
     * 渲染待处理请求
     */
    renderPendingRequests() {
        const container = document.getElementById('pendingRequests');
        if (!container) return;

        const { pendingRequests } = this.state;
        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

        // 过滤出发给我的请求
        const receivedRequests = pendingRequests.filter(r => r.toUserId === currentUserId);

        if (receivedRequests.length === 0) {
            container.innerHTML = '<div class="no-requests">暂无好友请求</div>';
            return;
        }

        container.innerHTML = receivedRequests.map(request => `
            <div class="request-item">
                <div class="user-avatar">
                    ${request.fromUser.avatar
                        ? `<img src="${request.fromUser.avatar}" alt="${request.fromUser.nickname}">`
                        : request.fromUser.nickname[0].toUpperCase()
                    }
                </div>
                <div class="request-info">
                    <div class="user-name">${request.fromUser.nickname}</div>
                    <div class="user-tier">
                        ${window.getTierIcon(request.fromUser.tier)} ${window.getTierName(request.fromUser.tier)}
                    </div>
                    ${request.message
                        ? `<div class="request-message">"${request.message}"</div>`
                        : ''
                    }
                    <div class="request-time">${this.formatTime(request.createdAt)}</div>
                </div>
                <div class="request-actions">
                    <button class="btn-accept" data-accept="${request.id}">接受</button>
                    <button class="btn-reject" data-reject="${request.id}">拒绝</button>
                </div>
            </div>
        `).join('');

        // 更新未读数量
        const badge = document.querySelector('.requests-badge');
        if (badge) {
            badge.textContent = receivedRequests.length;
            badge.style.display = receivedRequests.length > 0 ? 'block' : 'none';
        }

        // 绑定接受按钮
        container.querySelectorAll('[data-accept]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const requestId = e.currentTarget.dataset.accept;
                this.acceptRequest(requestId);
            });
        });

        // 绑定拒绝按钮
        container.querySelectorAll('[data-reject]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const requestId = e.currentTarget.dataset.reject;
                this.rejectRequest(requestId);
            });
        });
    }

    /**
     * 邀请好友对战
     */
    async inviteFriend(friendId) {
        const mode = 'QUICK'; // 默认快速模式，可以让用户选择

        try {
            const response = await window.API.pk.inviteFriend(friendId, mode);

            if (response.code === 200) {
                this.showNotification('邀请已发送', 'success');
            } else {
                this.showNotification(response.message || '邀请失败', 'error');
            }
        } catch (error) {
            console.error('[PK Friends] Failed to invite friend:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 确认删除好友
     */
    confirmDeleteFriend(friendId) {
        const friend = this.state.friends.find(f => f.id === friendId);
        const friendName = friend?.nickname || '该用户';

        if (confirm(`确定要删除好友 "${friendName}" 吗？`)) {
            this.deleteFriend(friendId);
        }
    }

    /**
     * 删除好友
     */
    async deleteFriend(friendId) {
        try {
            const result = await this.store.getState().deleteFriend(friendId);

            if (result.success) {
                this.showNotification('已删除好友', 'success');
            } else {
                this.showNotification(result.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('[PK Friends] Failed to delete friend:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 接受好友请求
     */
    async acceptRequest(requestId) {
        try {
            const result = await this.store.getState().acceptFriendRequest(requestId);

            if (result.success) {
                this.showNotification('已接受好友请求', 'success');
            } else {
                this.showNotification(result.error || '操作失败', 'error');
            }
        } catch (error) {
            console.error('[PK Friends] Failed to accept request:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 拒绝好友请求
     */
    async rejectRequest(requestId) {
        try {
            const response = await window.API.friend.rejectRequest(requestId);

            if (response.code === 200) {
                this.showNotification('已拒绝好友请求', 'info');
                // 刷新请求列表
                await this.store.getState().loadPendingRequests();
            } else {
                this.showNotification(response.message || '操作失败', 'error');
            }
        } catch (error) {
            console.error('[PK Friends] Failed to reject request:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 开始在线状态刷新
     */
    startOnlineStatusRefresh() {
        // 每30秒刷新一次在线状态
        this.onlineRefreshTimer = setInterval(() => {
            this.refreshOnlineStatus();
        }, 30000);
    }

    /**
     * 刷新在线状态
     */
    async refreshOnlineStatus() {
        try {
            const response = await window.API.friend.getOnlineFriends();

            if (response.code === 200 && response.data) {
                this.store.getState().setOnlineFriends(response.data);
            }
        } catch (error) {
            console.error('[PK Friends] Failed to refresh online status:', error);
        }
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小时前`;
        } else if (minutes > 0) {
            return `${minutes}分钟前`;
        } else {
            return '刚刚';
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        if (window.appState) {
            window.appState.setState('notification', {
                type,
                title: type === 'success' ? '成功' : type === 'error' ? '错误' : '提示',
                message
            });
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.onlineRefreshTimer) {
            clearInterval(this.onlineRefreshTimer);
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}

// 导出
export default PKFriends;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    window.PKFriends = PKFriends;

    document.addEventListener('DOMContentLoaded', () => {
        const friends = new PKFriends();
        friends.init();

        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            friends.destroy();
        });
    });
}
