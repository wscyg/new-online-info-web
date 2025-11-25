const API_BASE = 'http://localhost:8070';

class DailyChallengeManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadData();
        setInterval(() => this.refreshChallenges(), 30000); // Refresh every 30s
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
            const response = await fetch(\`\${API_BASE}/daily-challenges/stats\`, {
                headers: {
                    'Authorization': \`Bearer \${token}\`
                }
            });

            if (!response.ok) throw new Error('Failed to load stats');

            const result = await response.json();
            const stats = result.data;

            this.renderStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStats(stats) {
        const statsHTML = \`
            <div class="stat-card">
                <div class="stat-value">\${stats.todayCompleted}/\${stats.todayTotal}</div>
                <div class="stat-label">今日完成</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${stats.weekCompleted}</div>
                <div class="stat-label">本周完成</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${stats.totalCompleted}</div>
                <div class="stat-label">累计完成</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${stats.todayProgress}%</div>
                <div class="stat-label">今日进度</div>
            </div>
        \`;
        document.getElementById('statsGrid').innerHTML = statsHTML;
    }

    async loadTodayChallenges() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(\`\${API_BASE}/daily-challenges/today\`, {
                headers: {
                    'Authorization': \`Bearer \${token}\`
                }
            });

            if (!response.ok) throw new Error('Failed to load challenges');

            const result = await response.json();
            const challenges = result.data;

            this.renderChallenges(challenges);
        } catch (error) {
            console.error('Error loading challenges:', error);
            document.getElementById('todayChallenges').innerHTML = \`
                <div style="text-align: center; color: #6b7280;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px;"></i>
                    <p>加载挑战失败</p>
                </div>
            \`;
        }
    }

    renderChallenges(challenges) {
        if (!challenges || challenges.length === 0) {
            document.getElementById('todayChallenges').innerHTML = \`
                <div style="text-align: center; color: #6b7280;">
                    <p>暂无挑战</p>
                </div>
            \`;
            return;
        }

        const challengesHTML = challenges.map(c => this.createChallengeCard(c)).join('');
        document.getElementById('todayChallenges').innerHTML = challengesHTML;
    }

    createChallengeCard(challenge) {
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

        const iconColor = typeColors[challenge.challengeType] || '#667eea';
        const icon = typeIcons[challenge.challengeType] || 'fa-tasks';

        return \`
            <div class="challenge-card \${isCompleted ? 'completed' : ''}">
                <div class="challenge-header">
                    <div class="challenge-title">
                        <div class="challenge-icon" style="background: \${iconColor}">
                            <i class="fas \${icon}"></i>
                        </div>
                        <span>\${challenge.title}</span>
                    </div>
                    <div class="challenge-reward">
                        <i class="fas fa-coins"></i>
                        +\${challenge.rewardPoints} 积分
                    </div>
                </div>

                <div class="challenge-description">
                    \${challenge.description}
                </div>

                \${isCompleted ? \`
                    <div class="complete-badge">
                        <i class="fas fa-check-circle"></i>
                        挑战完成！
                    </div>
                \` : \`
                    <div class="challenge-progress">
                        <div class="progress-header">
                            <span>进度</span>
                            <span>\${challenge.currentValue || 0} / \${challenge.targetValue}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill \${progress === 100 ? 'completed' : ''}" 
                                 style="width: \${progress}%"></div>
                        </div>
                    </div>
                \`}
            </div>
        \`;
    }

    async refreshChallenges() {
        await this.loadData();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DailyChallengeManager();
});
