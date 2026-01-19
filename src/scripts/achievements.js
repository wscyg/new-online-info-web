/**
 * 成就系统管理器
 * 管理成就的展示、解锁和进度跟踪
 */

const API_BASE = '/api';

class AchievementManager {
    constructor() {
        this.currentCategory = 'ALL';
        this.achievementsData = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadAchievements();
        await this.initializeDefaultAchievements();
    }

    bindEvents() {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCategory = tab.dataset.category;
                this.renderAchievements();
            });
        });

        document.getElementById('detectBtn').addEventListener('click', () => {
            this.detectAchievements();
        });
    }

    async loadAchievements() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch(\`\${API_BASE}/achievements/my\`, {
                headers: {
                    'Authorization': \`Bearer \${token}\`
                }
            });

            if (!response.ok) throw new Error('Failed to load achievements');

            const result = await response.json();
            this.achievementsData = result.data;
            
            this.renderStats();
            this.renderAchievements();
        } catch (error) {
            console.error('Error loading achievements:', error);
            document.getElementById('achievementsGrid').innerHTML = \`
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载成就失败</p>
                </div>
            \`;
        }
    }

    renderStats() {
        const stats = this.achievementsData;
        const statsHTML = \`
            <div class="stat-card">
                <div class="stat-value">\${stats.unlockedCount}</div>
                <div class="stat-label">已解锁</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${stats.totalCount}</div>
                <div class="stat-label">总成就</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${stats.completionRate}%</div>
                <div class="stat-label">完成度</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${stats.totalPoints}</div>
                <div class="stat-label">成就积分</div>
            </div>
        \`;
        document.getElementById('achievementStats').innerHTML = statsHTML;
    }

    renderAchievements() {
        const achievements = this.achievementsData.achievements;
        
        const filtered = this.currentCategory === 'ALL' 
            ? achievements 
            : achievements.filter(a => a.achievement.category === this.currentCategory);

        if (filtered.length === 0) {
            document.getElementById('achievementsGrid').innerHTML = \`
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无此类成就</p>
                </div>
            \`;
            return;
        }

        filtered.sort((a, b) => {
            if (a.unlocked !== b.unlocked) return b.unlocked - a.unlocked;
            return a.achievement.sortOrder - b.achievement.sortOrder;
        });

        const cardsHTML = filtered.map(item => this.createAchievementCard(item)).join('');
        document.getElementById('achievementsGrid').innerHTML = cardsHTML;

        this.bindDisplayToggles();
    }

    createAchievementCard(item) {
        const ach = item.achievement;
        const isUnlocked = item.unlocked;
        const progress = item.progress || 0;

        const rarityColors = {
            'LEGENDARY': '#ffd700',
            'EPIC': '#a855f7',
            'RARE': '#3b82f6',
            'COMMON': '#6b7280'
        };

        const rarityNames = {
            'LEGENDARY': '传奇',
            'EPIC': '史诗',
            'RARE': '稀有',
            'COMMON': '普通'
        };

        const iconColor = ach.badgeColor || '#667eea';
        const rarityColor = rarityColors[ach.rarity] || '#6b7280';

        let cardHTML = \`
            <div class="achievement-card \${isUnlocked ? 'unlocked' : 'locked'}" data-id="\${ach.id}">\`;
        
        if (!isUnlocked) {
            cardHTML += '<i class="fas fa-lock locked-icon"></i>';
        }
        
        cardHTML += \`
                <div class="rarity-badge" style="background: \${rarityColor}">
                    \${rarityNames[ach.rarity]}
                </div>
                
                <div class="achievement-icon" style="background: \${iconColor}">
                    <i class="fas \${this.getCategoryIcon(ach.category)}"></i>
                </div>
                
                <div class="achievement-name">\${ach.name}</div>
                <div class="achievement-description">\${ach.description}</div>
                <div class="achievement-points">
                    <i class="fas fa-star"></i> \${ach.points} 积分
                </div>\`;

        if (!isUnlocked && progress > 0) {
            cardHTML += \`
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${progress}%"></div>
                    </div>
                    <div class="progress-text">\${progress}% 完成</div>
                </div>\`;
        }

        if (isUnlocked) {
            cardHTML += \`
                <div class="unlock-date">
                    <i class="fas fa-check-circle"></i>
                    解锁于 \${this.formatDate(item.unlockedAt)}
                </div>
                <button class="display-toggle \${item.isDisplayed ? 'active' : ''}" 
                        data-achievement-id="\${ach.id}"
                        data-displayed="\${item.isDisplayed}">
                    \${item.isDisplayed ? '已展示' : '设为展示'}
                </button>\`;
        }

        cardHTML += '</div>';
        return cardHTML;
    }

    getCategoryIcon(category) {
        const icons = {
            'PK': 'fa-swords',
            'STUDY': 'fa-book',
            'SOCIAL': 'fa-users',
            'COLLECTION': 'fa-gem',
            'SPECIAL': 'fa-star'
        };
        return icons[category] || 'fa-trophy';
    }

    formatDate(dateString) {
        if (!dateString) return '未知';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    bindDisplayToggles() {
        document.querySelectorAll('.display-toggle').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const achievementId = btn.dataset.achievementId;
                const isDisplayed = btn.dataset.displayed === 'true';
                await this.toggleDisplay(achievementId, !isDisplayed);
            });
        });
    }

    async toggleDisplay(achievementId, displayed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                \`\${API_BASE}/achievements/\${achievementId}/display?displayed=\${displayed}\`, 
                {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${token}\`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to toggle display');

            await this.loadAchievements();
            
            this.showNotification(displayed ? '已设为展示' : '已取消展示', 'success');
        } catch (error) {
            console.error('Error toggling display:', error);
            this.showNotification('操作失败', 'error');
        }
    }

    async detectAchievements() {
        const btn = document.getElementById('detectBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>检测中...</span>';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(\`\${API_BASE}/achievements/detect\`, {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${token}\`
                }
            });

            if (!response.ok) throw new Error('Failed to detect achievements');

            const result = await response.json();
            const newAchievements = result.data;

            if (newAchievements.length > 0) {
                this.showAchievementUnlockAnimation(newAchievements);
                await this.loadAchievements();
            } else {
                this.showNotification('暂无新成就解锁', 'info');
            }
        } catch (error) {
            console.error('Error detecting achievements:', error);
            this.showNotification('检测失败', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> <span>检测新成就</span>';
        }
    }

    async initializeDefaultAchievements() {
        try {
            const token = localStorage.getItem('token');
            await fetch(\`\${API_BASE}/achievements/init\`, {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${token}\`
                }
            });
        } catch (error) {
            console.error('Error initializing achievements:', error);
        }
    }

    showAchievementUnlockAnimation(achievements) {
        achievements.forEach((ach, index) => {
            setTimeout(() => {
                this.showNotification(\`🎉 解锁成就：\${ach.name}\`, 'success');
            }, index * 500);
        });
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#667eea'
        };

        const notification = document.createElement('div');
        notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: \${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        \`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AchievementManager();
});

const style = document.createElement('style');
style.textContent = \`
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
\`;
document.head.appendChild(style);
