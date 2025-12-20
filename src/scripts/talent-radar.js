// 人才雷达系统前端逻辑
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8070/api'
    : 'http://42.194.245.66:8070/api';

class TalentRadarManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.radarChart = null;
        this.compareChart = null;
        this.profile = null;
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '../login.html';
            return;
        }

        this.setupUI();
        this.loadMyProfile();
    }

    setupUI() {
        document.getElementById('userInfo').textContent =
            this.user.nickname || this.user.username || '用户';

        // Tab switching
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Recalculate button
        document.getElementById('recalculateBtn').addEventListener('click', () => {
            this.recalculateProfile();
        });

        // Dimension filter for leaderboard
        document.getElementById('dimensionFilter').addEventListener('change', (e) => {
            this.loadLeaderboard(e.target.value);
        });

        // Compare button
        document.getElementById('compareBtn').addEventListener('click', () => {
            this.compareProfiles();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(tabName + 'Tab').style.display = 'block';

        // Load data for specific tabs
        if (tabName === 'leaderboard') {
            this.loadLeaderboard('overall');
        }
    }

    // ==================== My Profile ====================

    async loadMyProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/talent/profile/my`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.profile = data.data;
                this.renderProfile();
                this.renderRadarChart();
                this.analyzeStrengths();
                this.loadRecommendedMentors();
            } else {
                this.showError('加载档案失败: ' + data.message);
            }
        } catch (error) {
            console.error('Load profile error:', error);
            this.showError('加载档案失败');
        }
    }

    async recalculateProfile() {
        const btn = document.getElementById('recalculateBtn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> 计算中...';

        try {
            const response = await fetch(`${API_BASE_URL}/talent/profile/recalculate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.profile = data.data;
                this.renderProfile();
                this.renderRadarChart();
                this.analyzeStrengths();
                alert('档案已重新计算！');
            } else {
                this.showError('重新计算失败: ' + data.message);
            }
        } catch (error) {
            console.error('Recalculate error:', error);
            this.showError('重新计算失败');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                </svg>
                重新计算
            `;
        }
    }

    renderProfile() {
        const p = this.profile;

        // Grade badge
        const gradeBadge = document.getElementById('gradeBadge');
        gradeBadge.textContent = p.overallGrade || '--';
        gradeBadge.className = `grade-badge grade-${(p.overallGrade || '').replace('+', 'plus')}`;

        // Overall score
        document.getElementById('overallScore').textContent = p.overallScore || '--';

        // Stats
        document.getElementById('percentile').textContent =
            p.rankPercentile ? `Top ${(100 - p.rankPercentile).toFixed(1)}%` : 'Top --';
        document.getElementById('totalBattles').textContent =
            `${p.totalBattles || 0} 场`;
        document.getElementById('lastUpdated').textContent =
            p.lastCalculatedAt ? new Date(p.lastCalculatedAt).toLocaleDateString('zh-CN') : '--';

        // Dimension scores
        this.renderDimensionScores();
    }

    renderDimensionScores() {
        const p = this.profile;
        const dimensions = [
            { name: '答题速度', score: p.speedScore },
            { name: '正确率', score: p.accuracyScore },
            { name: '稳定性', score: p.consistencyScore },
            { name: '难度掌握', score: p.difficultyScore },
            { name: '知识广度', score: p.breadthScore }
        ];

        const container = document.getElementById('dimensionScores');
        container.innerHTML = dimensions.map(d => {
            const scoreClass = d.score >= 80 ? 'high' : d.score >= 60 ? 'medium' : 'low';
            return `
                <div class="dimension-item">
                    <span class="dimension-label">${d.name}</span>
                    <div class="dimension-bar">
                        <div class="dimension-fill ${scoreClass}" style="width: ${d.score || 0}%"></div>
                    </div>
                    <span class="dimension-value">${d.score || 0}</span>
                </div>
            `;
        }).join('');
    }

    renderRadarChart() {
        const ctx = document.getElementById('radarChart').getContext('2d');
        const p = this.profile;

        if (this.radarChart) {
            this.radarChart.destroy();
        }

        this.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['答题速度', '正确率', '稳定性', '难度掌握', '知识广度'],
                datasets: [{
                    label: '我的能力',
                    data: [
                        p.speedScore || 0,
                        p.accuracyScore || 0,
                        p.consistencyScore || 0,
                        p.difficultyScore || 0,
                        p.breadthScore || 0
                    ],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    analyzeStrengths() {
        const p = this.profile;
        const dimensions = [
            { name: '答题速度', score: p.speedScore || 0 },
            { name: '正确率', score: p.accuracyScore || 0 },
            { name: '稳定性', score: p.consistencyScore || 0 },
            { name: '难度掌握', score: p.difficultyScore || 0 },
            { name: '知识广度', score: p.breadthScore || 0 }
        ];

        const sorted = [...dimensions].sort((a, b) => b.score - a.score);

        // Top 2 strengths
        const strengths = sorted.slice(0, 2);
        document.getElementById('strengths').innerHTML = strengths.map(s => `
            <div class="analysis-item">
                <span>${s.name}</span>
                <span style="font-weight: 600; color: #34c759;">${s.score}</span>
            </div>
        `).join('');

        // Bottom 2 for improvement
        const improvements = sorted.slice(-2).reverse();
        document.getElementById('improvements').innerHTML = improvements.map(s => `
            <div class="analysis-item">
                <span>${s.name}</span>
                <span style="font-weight: 600; color: #ff9500;">${s.score}</span>
            </div>
        `).join('');
    }

    async loadRecommendedMentors() {
        try {
            const response = await fetch(`${API_BASE_URL}/talent/recommend-mentors?limit=3`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            if (data.code === 200 && data.data.length > 0) {
                document.getElementById('recommendedMentors').innerHTML = data.data.map(m => `
                    <div class="analysis-item">
                        <span>用户 #${m.userId}</span>
                        <span style="font-weight: 600; color: var(--accent);">${m.overallGrade}</span>
                    </div>
                `).join('');
            } else {
                document.getElementById('recommendedMentors').innerHTML = `
                    <p style="font-size: 14px; color: var(--text-secondary); text-align: center; padding: 20px 0;">暂无推荐导师</p>
                `;
            }
        } catch (error) {
            console.error('Load mentors error:', error);
        }
    }

    // ==================== Leaderboard ====================

    async loadLeaderboard(dimension) {
        const container = document.getElementById('leaderboardList');
        container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

        try {
            const endpoint = dimension === 'overall'
                ? `${API_BASE_URL}/talent/leaderboard/overall?limit=50`
                : `${API_BASE_URL}/talent/leaderboard/dimension/${dimension}?limit=50`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.code === 200) {
                this.renderLeaderboard(data.data, dimension);
            } else {
                container.innerHTML = '<p class="empty-state">加载失败</p>';
            }
        } catch (error) {
            console.error('Load leaderboard error:', error);
            container.innerHTML = '<p class="empty-state">加载失败</p>';
        }
    }

    renderLeaderboard(profiles, dimension) {
        const container = document.getElementById('leaderboardList');

        if (profiles.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无排名数据</p>';
            return;
        }

        const scoreKey = dimension === 'overall' ? 'overallScore' :
            dimension === 'speed' ? 'speedScore' :
            dimension === 'accuracy' ? 'accuracyScore' :
            dimension === 'consistency' ? 'consistencyScore' :
            dimension === 'difficulty' ? 'difficultyScore' : 'breadthScore';

        container.innerHTML = profiles.map((p, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';

            return `
                <div class="leaderboard-item">
                    <div class="rank-badge ${rankClass}">${rank}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">
                            ${p.user?.nickname || p.user?.username || `用户#${p.userId}`}
                        </div>
                        <div class="leaderboard-meta">
                            ${p.totalBattles || 0} 场对战 · ${p.overallGrade || '--'} 级
                        </div>
                    </div>
                    <div class="leaderboard-score">
                        <div class="leaderboard-score-value">${p[scoreKey] || 0}</div>
                        <div class="leaderboard-score-label">分</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== Compare ====================

    async compareProfiles() {
        const user1Id = document.getElementById('compareUser1').value;
        const user2Id = document.getElementById('compareUser2').value;

        if (!user1Id || !user2Id) {
            alert('请输入两个用户ID');
            return;
        }

        const container = document.getElementById('comparisonResult');
        container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

        try {
            const response = await fetch(`${API_BASE_URL}/talent/compare?user1Id=${user1Id}&user2Id=${user2Id}`);
            const data = await response.json();

            if (data.code === 200) {
                this.renderComparison(data.data);
            } else {
                container.innerHTML = `<p class="empty-state" style="color: #ff3b30;">${data.message}</p>`;
            }
        } catch (error) {
            console.error('Compare error:', error);
            container.innerHTML = '<p class="empty-state" style="color: #ff3b30;">对比失败</p>';
        }
    }

    renderComparison(comparison) {
        const { user1, user2, differences } = comparison;
        const container = document.getElementById('comparisonResult');

        // Create comparison chart
        const chartHtml = `
            <div class="compare-grid">
                <div class="compare-user">
                    <div class="compare-canvas">
                        <canvas id="compareChart1" width="300" height="300"></canvas>
                    </div>
                    <div class="compare-name">用户 #${user1.userId}</div>
                    <div class="compare-score">${user1.overallScore}</div>
                </div>
                <div class="compare-user">
                    <div class="compare-canvas">
                        <canvas id="compareChart2" width="300" height="300"></canvas>
                    </div>
                    <div class="compare-name">用户 #${user2.userId}</div>
                    <div class="compare-score">${user2.overallScore}</div>
                </div>
            </div>

            <div class="diff-grid">
                ${this.renderDiffCard('速度', differences.speed, user1.speedScore, user2.speedScore)}
                ${this.renderDiffCard('准确', differences.accuracy, user1.accuracyScore, user2.accuracyScore)}
                ${this.renderDiffCard('稳定', differences.consistency, user1.consistencyScore, user2.consistencyScore)}
                ${this.renderDiffCard('难度', differences.difficulty, user1.difficultyScore, user2.difficultyScore)}
                ${this.renderDiffCard('广度', differences.breadth, user1.breadthScore, user2.breadthScore)}
            </div>
        `;

        container.innerHTML = chartHtml;

        // Render both radar charts
        this.renderCompareChart('compareChart1', user1, 'rgba(0, 113, 227, 0.2)', 'rgba(0, 113, 227, 1)');
        this.renderCompareChart('compareChart2', user2, 'rgba(255, 45, 85, 0.2)', 'rgba(255, 45, 85, 1)');
    }

    renderDiffCard(name, diff, score1, score2) {
        const colorClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
        const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '=';
        return `
            <div class="diff-card">
                <div class="diff-label">${name}</div>
                <div class="diff-value ${colorClass}">${arrow} ${Math.abs(diff)}</div>
                <div class="diff-detail">${score1} vs ${score2}</div>
            </div>
        `;
    }

    renderCompareChart(canvasId, profile, bgColor, borderColor) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['速度', '准确', '稳定', '难度', '广度'],
                datasets: [{
                    data: [
                        profile.speedScore || 0,
                        profile.accuracyScore || 0,
                        profile.consistencyScore || 0,
                        profile.difficultyScore || 0,
                        profile.breadthScore || 0
                    ],
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: { r: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }

    showError(message) {
        alert(message);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.talentRadar = new TalentRadarManager();
});
