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
        const container = document.getElementById('myRankCard');
        if (!container) return;

        const { rankings, userStats } = this.state;
        const myRanking = rankings.myRanking || {};
        const rank = myRanking.rank || 0;
        const percentage = myRanking.percentage || 0;

        container.innerHTML = `
            <div class="my-rank-display">
                <div class="rank-number">#${rank || '未上榜'}</div>
                <div class="rank-label">我的排名</div>
                ${rank > 0 ? `
                    <div class="rank-percentage">超越了 ${percentage.toFixed(1)}% 的玩家</div>
                ` : ''}
            </div>
            <div class="my-stats">
                <div class="stat-item">
                    <div class="stat-icon">${window.getTierIcon(userStats.tier)}</div>
                    <div class="stat-value">${window.getTierName(userStats.tier)}</div>
                    <div class="stat-label">当前段位</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${userStats.elo || 1200}</div>
                    <div class="stat-label">ELO分数</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${userStats.winRate || 0}%</div>
                    <div class="stat-label">胜率</div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染排行榜
     */
    renderLeaderboard() {
        const container = document.getElementById('leaderboardList');
        if (!container) return;

        const { rankings } = this.state;
        const leaderboard = rankings.leaderboard || [];

        if (leaderboard.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无排行榜数据</div>';
            return;
        }

        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

        container.innerHTML = leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.userId === currentUserId;
            const tierInfo = window.TIERS[user.tier] || window.TIERS.SILVER;

            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''} ${rank <= 3 ? 'top-' + rank : ''}">
                    <div class="rank-badge ${rank <= 3 ? 'medal' : ''}">
                        ${rank <= 3 ? this.getMedalIcon(rank) : rank}
                    </div>
                    <div class="user-avatar" style="border-color: ${tierInfo.color}">
                        ${user.avatar
                            ? `<img src="${user.avatar}" alt="${user.nickname}">`
                            : user.nickname[0].toUpperCase()
                        }
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.nickname}</div>
                        <div class="user-tier">
                            ${tierInfo.icon} ${tierInfo.name}
                        </div>
                    </div>
                    <div class="user-stats">
                        <div class="stat-item">
                            <div class="stat-label">ELO</div>
                            <div class="stat-value">${user.elo || 1200}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">胜率</div>
                            <div class="stat-value">${user.winRate || 0}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">对局</div>
                            <div class="stat-value">${user.totalBattles || 0}</div>
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
    }

    /**
     * 获取奖牌图标
     */
    getMedalIcon(rank) {
        const medals = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };
        return medals[rank] || rank;
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
                            <div class="tier-item" data-tier="${tierKey}">
                                <div class="tier-icon" style="color: ${tierInfo.color}">
                                    ${tierInfo.icon}
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
                                    <div class="progress-bar" style="width: ${percentage}%; background: ${tierInfo.color}"></div>
                                </div>
                            </div>
                        `;
                    }).join('');

                // 绑定点击事件查看该段位玩家
                container.querySelectorAll('.tier-item').forEach(item => {
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
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${tierInfo.icon} ${tierInfo.name} 段位玩家</h3>
                    <button class="close-btn">✕</button>
                </div>
                <div class="modal-body">
                    ${players.map(player => `
                        <div class="player-item">
                            <div class="player-avatar">
                                ${player.avatar
                                    ? `<img src="${player.avatar}" alt="${player.nickname}">`
                                    : player.nickname[0].toUpperCase()
                                }
                            </div>
                            <div class="player-info">
                                <div class="player-name">${player.nickname}</div>
                                <div class="player-elo">ELO: ${player.elo}</div>
                            </div>
                            <div class="player-stats">
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
