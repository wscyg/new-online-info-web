/**
 * PK Rankings (排行榜页面) - 排行榜展示
 * 功能：总榜/日榜/周榜/月榜切换、段位榜、用户排名高亮、段位图标
 */

import { usePKStore } from '../../store/pk-store.js';

class PKRankings {
    constructor() {
        this.store = usePKStore;
        this.state = this.store.getState();
        this.currentPeriod = 'all';
        this.currentType = 'elo';
    }

    /**
     * 初始化排行榜页面
     */
    async init() {
        console.log('[PK Rankings] Initializing...');

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

        console.log('[PK Rankings] Initialized');
    }

    /**
     * 加载数据
     */
    async loadData() {
        try {
            // 加载排行榜
            await this.store.getState().loadLeaderboard(this.currentType, this.currentPeriod, 100);

            // 加载我的排名
            await this.store.getState().loadMyRanking(this.currentType, this.currentPeriod);

            // 加载用户统计
            await this.store.getState().loadUserStats();

        } catch (error) {
            console.error('[PK Rankings] Failed to load data:', error);
            this.showNotification('加载数据失败', 'error');
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 时间周期切换
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.dataset.period;
                this.switchPeriod(period);
            });
        });

        // 榜单类型切换
        document.querySelectorAll('[data-ranking-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.rankingType;
                this.switchType(type);
            });
        });

        // 刷新按钮
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refresh();
        });
    }

    /**
     * 切换时间周期
     */
    async switchPeriod(period) {
        this.currentPeriod = period;

        // 更新按钮状态
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        // 重新加载数据
        await this.loadData();
    }

    /**
     * 切换榜单类型
     */
    async switchType(type) {
        this.currentType = type;

        // 更新按钮状态
        document.querySelectorAll('[data-ranking-type]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.rankingType === type);
        });

        // 重新加载数据
        await this.loadData();
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
        this.renderMyRank();
        this.renderLeaderboard();
        this.renderTierDistribution();
    }

    /**
     * 渲染我的排名
     */
    renderMyRank() {
        const { rankings, userStats } = this.state;
        const myRanking = rankings.myRanking || {};
        const rank = myRanking.rank || 0;

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Update avatar
        const myAvatar = document.getElementById('myAvatar');
        if (myAvatar && user.username) {
            myAvatar.textContent = user.username[0].toUpperCase();
        }

        // Update name
        const myName = document.getElementById('myName');
        if (myName) {
            myName.textContent = user.username || '用户名';
        }

        // Update tier
        const myTier = document.getElementById('myTier');
        if (myTier) {
            const tierIcon = window.getTierIcon(userStats.tier);
            myTier.innerHTML = `${tierIcon} <span>${window.getTierName(userStats.tier)}</span>`;
        }

        // Update rank
        const myRankEl = document.getElementById('myRank');
        if (myRankEl) {
            myRankEl.textContent = rank > 0 ? `#${rank}` : '#-';
        }

        // Update ELO
        const myElo = document.getElementById('myElo');
        if (myElo) {
            myElo.textContent = userStats.elo || 1200;
        }

        // Update wins
        const myWins = document.getElementById('myWins');
        if (myWins) {
            myWins.textContent = userStats.wins || 0;
        }

        // Update win rate
        const myWinRate = document.getElementById('myWinRate');
        if (myWinRate) {
            myWinRate.textContent = `${userStats.winRate || 0}%`;
        }
    }

    /**
     * 渲染排行榜
     */
    renderLeaderboard() {
        const container = document.getElementById('leaderboardList');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const pagination = document.getElementById('pagination');

        if (!container) return;

        const { rankings } = this.state;
        const leaderboard = rankings.leaderboard || [];

        // Hide loading
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }

        if (leaderboard.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无排行榜数据</div>';
            container.classList.remove('hidden');
            return;
        }

        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

        container.innerHTML = leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.userId === currentUserId;
            const tierInfo = window.TIERS[user.tier] || window.TIERS.SILVER;

            return `
                <div class="rank-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank-badge ${rank <= 3 ? 'medal' : ''}">
                        ${rank <= 3 ? this.getMedalSVG(rank) : rank}
                    </div>
                    <div class="rank-avatar" style="border-color: ${tierInfo.color}">
                        ${user.avatar
                            ? `<img src="${user.avatar}" alt="${user.nickname}">`
                            : user.nickname[0].toUpperCase()
                        }
                    </div>
                    <div class="rank-user-info">
                        <div class="rank-user-name">${user.nickname}</div>
                        <div class="rank-user-tier">
                            ${window.getTierIcon(user.tier)} <span>${tierInfo.name}</span>
                        </div>
                    </div>
                    <div class="rank-stats">
                        <div class="rank-stat">
                            <div class="rank-stat-value">${user.elo || 1200}</div>
                            <div class="rank-stat-label">ELO</div>
                        </div>
                        <div class="rank-stat">
                            <div class="rank-stat-value">${user.winRate || 0}%</div>
                            <div class="rank-stat-label">胜率</div>
                        </div>
                        <div class="rank-stat">
                            <div class="rank-stat-value">${user.totalBattles || 0}</div>
                            <div class="rank-stat-label">对局</div>
                        </div>
                    </div>
                    ${user.rankChange ? `
                        <div class="rank-change ${user.rankChange > 0 ? 'up' : user.rankChange < 0 ? 'down' : 'same'}">
                            ${user.rankChange > 0 ? '↑' : user.rankChange < 0 ? '↓' : '—'}
                            ${Math.abs(user.rankChange) || ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Show container and pagination
        container.classList.remove('hidden');
        if (pagination && leaderboard.length > 0) {
            pagination.classList.remove('hidden');
        }
    }

    /**
     * 获取奖牌SVG图标
     */
    getMedalSVG(rank) {
        const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
        const color = colors[rank - 1];
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}">
            <path d="M12 2L15 9L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 9L12 2Z"/>
        </svg>`;
    }

    /**
     * 渲染段位分布
     */
    async renderTierDistribution() {
        const container = document.getElementById('tierDistribution');
        if (!container) return;

        try {
            const response = await window.API.ranking.getTierDistribution();

            if (response.code === 200 && response.data) {
                const distribution = response.data;

                container.innerHTML = Object.entries(window.TIERS)
                    .reverse() // 从高到低显示
                    .map(([tierKey, tierInfo]) => {
                        const count = distribution[tierKey] || 0;
                        const percentage = distribution.total > 0
                            ? ((count / distribution.total) * 100).toFixed(1)
                            : 0;

                        return `
                            <div class="tier-dist-item" data-tier="${tierKey}">
                                <div class="tier-icon">
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="${tierInfo.color}">
                                        <circle cx="20" cy="20" r="16"/>
                                    </svg>
                                </div>
                                <div class="tier-info">
                                    <div class="tier-name">${tierInfo.name}</div>
                                    <div class="tier-range">${tierInfo.minElo} - ${tierInfo.maxElo}</div>
                                </div>
                                <div class="tier-stats">
                                    <div class="tier-count">${count}人</div>
                                    <div class="tier-percentage">${percentage}%</div>
                                </div>
                                <div class="tier-progress">
                                    <div class="tier-progress-bar" style="width: ${percentage}%; background: ${tierInfo.color}"></div>
                                </div>
                            </div>
                        `;
                    }).join('');

                // 绑定点击事件查看该段位玩家
                container.querySelectorAll('.tier-dist-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        const tier = e.currentTarget.dataset.tier;
                        this.viewTierPlayers(tier);
                    });
                });
            }
        } catch (error) {
            console.error('[PK Rankings] Failed to load tier distribution:', error);
        }
    }

    /**
     * 查看段位玩家
     */
    async viewTierPlayers(tier) {
        try {
            const response = await window.API.ranking.getUsersByTier(tier);

            if (response.code === 200 && response.data) {
                // 显示模态框
                this.showTierPlayersModal(tier, response.data.items || response.data);
            }
        } catch (error) {
            console.error('[PK Rankings] Failed to load tier players:', error);
            this.showNotification('加载失败', 'error');
        }
    }

    /**
     * 显示段位玩家模态框
     */
    showTierPlayersModal(tier, players) {
        const tierInfo = window.TIERS[tier];
        const modal = document.createElement('div');
        modal.className = 'tier-players-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
        `;
        modal.innerHTML = `
            <div class="modal-overlay" style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
            "></div>
            <div class="modal-content" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--bg-card);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border-color);
                box-shadow: var(--shadow-lg);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div class="modal-header" style="
                    padding: 24px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="
                        font-size: 21px;
                        font-weight: 600;
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="${tierInfo.color}">
                            <circle cx="10" cy="10" r="8"/>
                        </svg>
                        ${tierInfo.name} 段位玩家
                    </h3>
                    <button class="close-btn" style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        border: none;
                        background: var(--bg-hover);
                        color: var(--text-secondary);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    ">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" style="
                    padding: 16px;
                    overflow-y: auto;
                ">
                    ${players.map(player => `
                        <div class="player-item" style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            padding: 12px;
                            border-radius: var(--radius-md);
                            transition: background var(--transition-fast);
                        " onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                            <div class="player-avatar" style="
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: #fff;
                                font-size: 16px;
                                font-weight: 600;
                            ">
                                ${player.avatar
                                    ? `<img src="${player.avatar}" alt="${player.nickname}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                                    : player.nickname[0].toUpperCase()
                                }
                            </div>
                            <div class="player-info" style="flex: 1;">
                                <div class="player-name" style="
                                    font-size: 15px;
                                    font-weight: 600;
                                    color: var(--text-primary);
                                ">${player.nickname}</div>
                                <div class="player-elo" style="
                                    font-size: 13px;
                                    color: var(--text-secondary);
                                ">ELO: ${player.elo}</div>
                            </div>
                            <div class="player-stats" style="
                                font-size: 13px;
                                color: var(--text-secondary);
                            ">
                                ${player.wins}胜 ${player.losses}负
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.querySelector('.close-btn')?.addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
            modal.remove();
        });
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
}

// 导出
export default PKRankings;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    window.PKRankings = PKRankings;

    document.addEventListener('DOMContentLoaded', () => {
        const rankings = new PKRankings();
        rankings.init();
    });
}
