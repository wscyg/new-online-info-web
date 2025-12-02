const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8070/api'
    : 'http://42.194.245.66:8070/api';

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
        await this.loadData();
        this.startAutoRefresh();
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
        const indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.id = 'refreshIndicator';
        indicator.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span id="refreshCountdown">30秒后刷新</span>
        `;
        indicator.addEventListener('click', () => this.manualRefresh());
        document.body.appendChild(indicator);
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
                <div style="text-align: center; color: #6b7280; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px; color: #f59e0b;"></i>
                    <p>加载挑战失败，请稍后重试</p>
                    <button onclick="window.dailyChallengeManager.manualRefresh()"
                            style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
        }
    }

    renderChallenges(challenges) {
        if (!challenges || challenges.length === 0) {
            document.getElementById('todayChallenges').innerHTML = `
                <div style="text-align: center; color: #6b7280; padding: 60px;">
                    <i class="fas fa-calendar-check" style="font-size: 4em; margin-bottom: 20px; color: #d1d5db;"></i>
                    <p style="font-size: 18px; font-weight: 600;">今日暂无挑战</p>
                    <p style="font-size: 14px; margin-top: 10px;">请稍后再来查看新的挑战任务</p>
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
            'PK_WIN': '#f59e0b',
            'ANSWER_CORRECT': '#10b981',
            'STUDY_TIME': '#3b82f6',
            'COMPLETE_CHAPTER': '#8b5cf6'
        };

        const typeIcons = {
            'PK_WIN': 'fa-trophy',
            'ANSWER_CORRECT': 'fa-check-circle',
            'STUDY_TIME': 'fa-clock',
            'COMPLETE_CHAPTER': 'fa-book-open'
        };

        const typeLabels = {
            'PK_WIN': 'PK对战',
            'ANSWER_CORRECT': '答题正确',
            'STUDY_TIME': '学习时长',
            'COMPLETE_CHAPTER': '章节完成'
        };

        const iconColor = typeColors[challenge.challengeType] || '#667eea';
        const icon = typeIcons[challenge.challengeType] || 'fa-tasks';
        const typeLabel = typeLabels[challenge.challengeType] || '任务';

        return `
            <div class="challenge-card ${isCompleted ? 'completed' : ''} ${justCompleted ? 'just-completed' : ''}"
                 style="animation-delay: ${index * 0.1}s" data-id="${challenge.id}">
                <div class="challenge-header">
                    <div class="challenge-title">
                        <div class="challenge-icon" style="background: ${iconColor}">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div>
                            <span style="display: block; font-weight: 600;">${challenge.title}</span>
                            <span style="font-size: 12px; color: #9ca3af;">${typeLabel}</span>
                        </div>
                    </div>
                    <div class="challenge-reward" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 6px 12px; border-radius: 20px; color: white; font-weight: 600;">
                        <i class="fas fa-coins"></i>
                        +${challenge.rewardPoints}
                    </div>
                </div>

                <div class="challenge-description" style="margin: 12px 0; color: #6b7280; font-size: 14px;">
                    ${challenge.description}
                </div>

                ${isCompleted ? `
                    <div class="complete-badge" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 8px; font-weight: 600;">
                        <i class="fas fa-check-circle"></i>
                        挑战完成！
                    </div>
                ` : `
                    <div class="challenge-progress">
                        <div class="progress-header" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                            <span style="color: #6b7280;">进度</span>
                            <span style="font-weight: 600; color: ${progress >= 100 ? '#10b981' : '#667eea'};">
                                ${challenge.currentValue || 0} / ${challenge.targetValue}
                            </span>
                        </div>
                        <div class="progress-bar" style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                            <div class="progress-fill ${progress > 0 ? 'animating' : ''}"
                                 style="height: 100%; width: ${progress}%; background: linear-gradient(90deg, ${iconColor}, ${iconColor}dd); border-radius: 4px; transition: width 0.5s ease;">
                            </div>
                        </div>
                        ${progress > 0 && progress < 100 ? `
                            <div style="text-align: center; margin-top: 8px; font-size: 12px; color: #9ca3af;">
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
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #667eea, #764ba2)'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInUp 0.3s ease;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
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
