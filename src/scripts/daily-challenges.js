const API_BASE = '/api';

class DailyChallengeManager {
    constructor() {
        this.previousProgress = {};
        this.refreshInterval = null;
        this.countdownInterval = null;
        this.nextRefresh = 30;
        this.init();
    }

    async init() {
        this.addStyles();
        this.createRefreshIndicator();
        this.attachRefreshListener();
        await this.loadData();
        this.startAutoRefresh();
    }

    attachRefreshListener() {
        const indicator = document.getElementById('refreshIndicator');
        if (indicator) {
            indicator.addEventListener('click', () => this.manualRefresh());
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes progressPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0); }
            }
            @keyframes completeCelebrate {
                0% { transform: scale(1); }
                25% { transform: scale(1.1); }
                50% { transform: scale(1); }
                75% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
            }
            .challenge-card {
                animation: slideInUp 0.4s ease forwards;
            }
            .challenge-card.just-completed {
                animation: completeCelebrate 0.6s ease;
            }
            .progress-fill.animating {
                animation: progressPulse 1s ease;
            }
            .refresh-indicator {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 1000;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .refresh-indicator:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            .refresh-indicator.refreshing {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            .refresh-indicator i {
                transition: transform 0.3s ease;
            }
            .refresh-indicator.refreshing i {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .stat-card {
                transition: all 0.3s ease;
            }
            .stat-card.updated {
                animation: progressPulse 0.5s ease;
            }
            .confetti-particle {
                position: absolute;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                animation: confetti 1s ease forwards;
            }
        `;
        document.head.appendChild(style);
    }

    createRefreshIndicator() {
        // Refresh indicator is now in HTML
    }

    startAutoRefresh() {
        this.nextRefresh = 30;
        this.updateCountdown();

        this.countdownInterval = setInterval(() => {
            this.nextRefresh--;
            this.updateCountdown();
        }, 1000);

        this.refreshInterval = setInterval(() => {
            this.refreshChallenges();
            this.nextRefresh = 30;
        }, 30000);
    }

    updateCountdown() {
        const countdown = document.getElementById('refreshCountdown');
        if (countdown) {
            countdown.textContent = `${this.nextRefresh}秒后刷新`;
        }
    }

    async manualRefresh() {
        const indicator = document.getElementById('refreshIndicator');
        indicator.classList.add('refreshing');
        document.getElementById('refreshCountdown').textContent = '刷新中...';

        await this.refreshChallenges();

        setTimeout(() => {
            indicator.classList.remove('refreshing');
            this.nextRefresh = 30;
            this.updateCountdown();
        }, 500);
    }

    async loadData() {
        await Promise.all([
            this.loadStats(),
            this.loadTodayChallenges()
        ]);
    }

    async loadStats() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch(`${API_BASE}/daily-challenges/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load stats');

            const result = await response.json();
            const stats = result.data;

            this.renderStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showDefaultStats();
        }
    }

    showDefaultStats() {
        const statsHTML = `
            <div class="stat-card">
                <div class="stat-value">0/0</div>
                <div class="stat-label">今日完成</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">本周完成</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0</div>
                <div class="stat-label">累计完成</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">0%</div>
                <div class="stat-label">今日进度</div>
            </div>
        `;
        document.getElementById('statsGrid').innerHTML = statsHTML;
    }

    renderStats(stats) {
        if (!stats) {
            this.showDefaultStats();
            return;
        }

        const statsHTML = `
            <div class="stat-card" data-stat="todayCompleted">
                <div class="stat-value">${stats.todayCompleted || 0}/${stats.todayTotal || 0}</div>
                <div class="stat-label">今日完成</div>
            </div>
            <div class="stat-card" data-stat="weekCompleted">
                <div class="stat-value">${stats.weekCompleted || 0}</div>
                <div class="stat-label">本周完成</div>
            </div>
            <div class="stat-card" data-stat="totalCompleted">
                <div class="stat-value">${stats.totalCompleted || 0}</div>
                <div class="stat-label">累计完成</div>
            </div>
            <div class="stat-card" data-stat="todayProgress">
                <div class="stat-value">${stats.todayProgress || 0}%</div>
                <div class="stat-label">今日进度</div>
            </div>
        `;
        document.getElementById('statsGrid').innerHTML = statsHTML;
    }

    async loadTodayChallenges() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch(`${API_BASE}/daily-challenges/today`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load challenges');

            const result = await response.json();
            const challenges = result.data;

            this.renderChallenges(challenges);
        } catch (error) {
            console.error('Error loading challenges:', error);
            document.getElementById('todayChallenges').innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div class="empty-state-title">加载挑战失败</div>
                    <div class="empty-state-text">请稍后重试</div>
                    <button class="btn btn-primary" onclick="window.dailyChallengeManager.manualRefresh()" style="margin-top: 24px;">
                        重新加载
                    </button>
                </div>
            `;
        }
    }

    renderChallenges(challenges) {
        if (!challenges || challenges.length === 0) {
            document.getElementById('todayChallenges').innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <polyline points="16 14 12 18 8 14"></polyline>
                    </svg>
                    <div class="empty-state-title">今日暂无挑战</div>
                    <div class="empty-state-text">请稍后再来查看新的挑战任务</div>
                </div>
            `;
            return;
        }

        const container = document.getElementById('todayChallenges');
        const challengesHTML = challenges.map((c, index) => {
            const wasCompleted = this.previousProgress[c.id]?.completed;
            const justCompleted = c.status === 'COMPLETED' && !wasCompleted;

            // Store current progress for next comparison
            this.previousProgress[c.id] = {
                completed: c.status === 'COMPLETED',
                value: c.currentValue
            };

            return this.createChallengeCard(c, index, justCompleted);
        }).join('');

        container.innerHTML = challengesHTML;

        // Trigger confetti for newly completed challenges
        challenges.forEach(c => {
            if (c.status === 'COMPLETED' && !this.previousProgress[c.id]?.celebrated) {
                this.previousProgress[c.id].celebrated = true;
                this.showNotification(`挑战完成：${c.title}`, 'success');
            }
        });
    }

    createChallengeCard(challenge, index, justCompleted) {
        const isCompleted = challenge.status === 'COMPLETED';
        const progress = challenge.currentValue && challenge.targetValue
            ? Math.min(100, (challenge.currentValue * 100) / challenge.targetValue)
            : 0;

        const typeColors = {
            'PK_WIN': '#ff9500',
            'ANSWER_CORRECT': '#34c759',
            'STUDY_TIME': '#0071e3',
            'COMPLETE_CHAPTER': '#af52de'
        };

        const typeIcons = {
            'PK_WIN': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>',
            'ANSWER_CORRECT': '<polyline points="20 6 9 17 4 12"></polyline>',
            'STUDY_TIME': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
            'COMPLETE_CHAPTER': '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>'
        };

        const typeLabels = {
            'PK_WIN': 'PK对战',
            'ANSWER_CORRECT': '答题正确',
            'STUDY_TIME': '学习时长',
            'COMPLETE_CHAPTER': '章节完成'
        };

        const iconColor = typeColors[challenge.challengeType] || '#0071e3';
        const iconSvg = typeIcons[challenge.challengeType] || '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line>';
        const typeLabel = typeLabels[challenge.challengeType] || '任务';

        return `
            <div class="challenge-card ${isCompleted ? 'completed' : ''} ${justCompleted ? 'just-completed' : ''}"
                 style="animation-delay: ${index * 0.1}s" data-id="${challenge.id}">
                <div class="challenge-header">
                    <div class="challenge-info">
                        <div class="challenge-title-row">
                            <div class="challenge-icon" style="background: ${iconColor}; color: white;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    ${iconSvg}
                                </svg>
                            </div>
                            <div>
                                <div class="challenge-title">${challenge.title}</div>
                                <div class="challenge-type">${typeLabel}</div>
                            </div>
                        </div>
                    </div>
                    <div class="challenge-reward">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                        +${challenge.rewardPoints}
                    </div>
                </div>

                <div class="challenge-description">
                    ${challenge.description}
                </div>

                ${isCompleted ? `
                    <div class="complete-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        挑战完成！
                    </div>
                ` : `
                    <div class="challenge-progress">
                        <div class="progress-header">
                            <span class="progress-label">进度</span>
                            <span class="progress-value" style="color: ${progress >= 100 ? '#34c759' : iconColor};">
                                ${challenge.currentValue || 0} / ${challenge.targetValue}
                            </span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progress > 0 ? 'animating' : ''} ${progress >= 100 ? 'completed' : ''}"
                                 style="width: ${progress}%; background: ${iconColor};">
                            </div>
                        </div>
                        ${progress > 0 && progress < 100 ? `
                            <div class="progress-remaining">
                                还差 ${challenge.targetValue - (challenge.currentValue || 0)} 即可完成
                            </div>
                        ` : ''}
                    </div>
                `}
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: { bg: 'rgba(52, 199, 89, 0.1)', color: '#34c759', border: 'rgba(52, 199, 89, 0.2)' },
            error: { bg: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', border: 'rgba(255, 59, 48, 0.2)' },
            info: { bg: 'rgba(0, 113, 227, 0.1)', color: '#0071e3', border: 'rgba(0, 113, 227, 0.2)' }
        };

        const icons = {
            success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
            error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
            info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
        };

        const theme = document.documentElement.getAttribute('data-theme');
        const style = colors[type];

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 68px;
            right: 22px;
            padding: 14px 20px;
            background: ${theme === 'dark' ? style.bg : style.bg};
            color: ${style.color};
            border: 1px solid ${style.border};
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 10001;
            animation: slideInUp 0.3s ease;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 15px;
        `;

        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${icons[type]}
            </svg>
            ${message}
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInUp 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async refreshChallenges() {
        await this.loadData();
    }
}

// Initialize and expose globally
let dailyChallengeManager;
document.addEventListener('DOMContentLoaded', () => {
    dailyChallengeManager = new DailyChallengeManager();
    window.dailyChallengeManager = dailyChallengeManager;
});
