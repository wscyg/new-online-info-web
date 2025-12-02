/**
 * 全局通知系统
 * 用于成就解锁、每日挑战完成、师徒事件等全局通知
 */

const NOTIFICATION_API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:8070/api'
    : 'http://42.194.245.66:8070/api';

class GlobalNotificationSystem {
    constructor() {
        this.container = null;
        this.achievementQueue = [];
        this.isShowingAchievement = false;
        this.pollInterval = null;
        this.lastCheckTime = Date.now();
        this.init();
    }

    init() {
        this.createStyles();
        this.createContainer();
        this.startPolling();
    }

    createStyles() {
        if (document.getElementById('global-notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'global-notification-styles';
        style.textContent = `
            /* Toast Notifications */
            .gn-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 100000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            }

            .gn-toast {
                background: white;
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 360px;
                pointer-events: auto;
                animation: gnSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                border-left: 4px solid #667eea;
            }

            .gn-toast.success { border-left-color: #10b981; }
            .gn-toast.error { border-left-color: #ef4444; }
            .gn-toast.warning { border-left-color: #f59e0b; }
            .gn-toast.achievement { border-left-color: #ffd700; }

            .gn-toast-icon {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                flex-shrink: 0;
            }

            .gn-toast.success .gn-toast-icon { background: #ecfdf5; color: #10b981; }
            .gn-toast.error .gn-toast-icon { background: #fef2f2; color: #ef4444; }
            .gn-toast.warning .gn-toast-icon { background: #fffbeb; color: #f59e0b; }
            .gn-toast.achievement .gn-toast-icon { background: linear-gradient(135deg, #fef3c7, #fcd34d); color: #b45309; }

            .gn-toast-content {
                flex: 1;
            }

            .gn-toast-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 2px;
            }

            .gn-toast-message {
                font-size: 14px;
                color: #6b7280;
            }

            .gn-toast-close {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .gn-toast-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .gn-toast.removing {
                animation: gnSlideOut 0.3s ease forwards;
            }

            @keyframes gnSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes gnSlideOut {
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            /* Achievement Unlock Overlay */
            .gn-achievement-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 100001;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }

            .gn-achievement-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }

            .gn-achievement-card {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 24px;
                padding: 40px;
                text-align: center;
                max-width: 400px;
                transform: scale(0.8) translateY(50px);
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                overflow: hidden;
            }

            .gn-achievement-overlay.active .gn-achievement-card {
                transform: scale(1) translateY(0);
            }

            .gn-achievement-card::before {
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 50% 0%, rgba(255,215,0,0.3), transparent 70%);
                pointer-events: none;
            }

            .gn-achievement-sparkles {
                position: absolute;
                inset: 0;
                pointer-events: none;
                overflow: hidden;
            }

            .gn-sparkle {
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ffd700;
                border-radius: 50%;
                animation: gnSparkle 1.5s ease-out forwards;
            }

            @keyframes gnSparkle {
                0% {
                    transform: scale(0) translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) translateY(-100px);
                    opacity: 0;
                }
            }

            .gn-achievement-icon {
                width: 100px;
                height: 100px;
                margin: 0 auto 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                position: relative;
                animation: gnIconPulse 2s ease-in-out infinite;
            }

            .gn-achievement-icon.legendary {
                background: linear-gradient(135deg, #ffd700, #ff8c00, #ffd700);
                box-shadow: 0 0 40px rgba(255,215,0,0.6);
                color: #7c2d12;
            }

            .gn-achievement-icon.epic {
                background: linear-gradient(135deg, #a855f7, #7c3aed, #a855f7);
                box-shadow: 0 0 40px rgba(168,85,247,0.6);
                color: white;
            }

            .gn-achievement-icon.rare {
                background: linear-gradient(135deg, #3b82f6, #1d4ed8, #3b82f6);
                box-shadow: 0 0 40px rgba(59,130,246,0.6);
                color: white;
            }

            .gn-achievement-icon.common {
                background: linear-gradient(135deg, #6b7280, #4b5563, #6b7280);
                box-shadow: 0 0 20px rgba(107,114,128,0.4);
                color: white;
            }

            @keyframes gnIconPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .gn-achievement-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 16px;
            }

            .gn-achievement-badge.legendary { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #7c2d12; }
            .gn-achievement-badge.epic { background: linear-gradient(90deg, #a855f7, #7c3aed); color: white; }
            .gn-achievement-badge.rare { background: linear-gradient(90deg, #3b82f6, #1d4ed8); color: white; }
            .gn-achievement-badge.common { background: #6b7280; color: white; }

            .gn-achievement-title {
                font-size: 28px;
                font-weight: 700;
                color: white;
                margin-bottom: 8px;
                text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }

            .gn-achievement-desc {
                font-size: 16px;
                color: #9ca3af;
                margin-bottom: 24px;
            }

            .gn-achievement-points {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                background: rgba(255,215,0,0.2);
                border: 2px solid #ffd700;
                border-radius: 30px;
                color: #ffd700;
                font-weight: 600;
                font-size: 18px;
            }

            .gn-achievement-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s;
            }

            .gn-achievement-close:hover {
                background: rgba(255,255,255,0.2);
                transform: scale(1.1);
            }

            /* Connection Status */
            .gn-connection-status {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #1f2937;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 99999;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
            }

            .gn-connection-status.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .gn-connection-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                animation: gnDotPulse 2s infinite;
            }

            .gn-connection-dot.connected { background: #10b981; }
            .gn-connection-dot.disconnected { background: #ef4444; }
            .gn-connection-dot.checking { background: #f59e0b; }

            @keyframes gnDotPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }

    createContainer() {
        // Toast container
        this.container = document.createElement('div');
        this.container.className = 'gn-toast-container';
        this.container.id = 'globalNotificationContainer';
        document.body.appendChild(this.container);

        // Achievement overlay
        this.achievementOverlay = document.createElement('div');
        this.achievementOverlay.className = 'gn-achievement-overlay';
        this.achievementOverlay.id = 'achievementOverlay';
        this.achievementOverlay.innerHTML = `
            <div class="gn-achievement-card">
                <div class="gn-achievement-sparkles" id="achievementSparkles"></div>
                <button class="gn-achievement-close" onclick="globalNotifications.closeAchievement()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="gn-achievement-icon" id="achievementIcon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="gn-achievement-badge" id="achievementBadge">传奇</div>
                <div class="gn-achievement-title" id="achievementTitle">成就名称</div>
                <div class="gn-achievement-desc" id="achievementDesc">成就描述</div>
                <div class="gn-achievement-points">
                    <i class="fas fa-star"></i>
                    <span id="achievementPoints">100</span> 积分
                </div>
            </div>
        `;
        document.body.appendChild(this.achievementOverlay);

        // Click outside to close
        this.achievementOverlay.addEventListener('click', (e) => {
            if (e.target === this.achievementOverlay) {
                this.closeAchievement();
            }
        });
    }

    startPolling() {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Check for new achievements every 30 seconds
        this.pollInterval = setInterval(() => {
            this.checkNewAchievements();
        }, 30000);

        // Initial check
        setTimeout(() => this.checkNewAchievements(), 5000);
    }

    async checkNewAchievements() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${NOTIFICATION_API_BASE}/achievements/recent?since=${this.lastCheckTime}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    result.data.forEach(achievement => {
                        this.queueAchievement(achievement);
                    });
                }
            }

            this.lastCheckTime = Date.now();
        } catch (error) {
            console.debug('Achievement check failed:', error);
        }
    }

    // Toast notification
    toast(message, type = 'info', title = null, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `gn-toast ${type}`;

        const icons = {
            success: 'fa-check',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            achievement: 'fa-trophy'
        };

        toast.innerHTML = `
            <div class="gn-toast-icon">
                <i class="fas ${icons[type] || icons.info}"></i>
            </div>
            <div class="gn-toast-content">
                ${title ? `<div class="gn-toast-title">${title}</div>` : ''}
                <div class="gn-toast-message">${message}</div>
            </div>
            <button class="gn-toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    }

    success(message, title = null) {
        return this.toast(message, 'success', title);
    }

    error(message, title = null) {
        return this.toast(message, 'error', title);
    }

    warning(message, title = null) {
        return this.toast(message, 'warning', title);
    }

    info(message, title = null) {
        return this.toast(message, 'info', title);
    }

    // Achievement unlock
    queueAchievement(achievement) {
        this.achievementQueue.push(achievement);
        if (!this.isShowingAchievement) {
            this.showNextAchievement();
        }
    }

    showNextAchievement() {
        if (this.achievementQueue.length === 0) {
            this.isShowingAchievement = false;
            return;
        }

        this.isShowingAchievement = true;
        const achievement = this.achievementQueue.shift();
        this.showAchievementUnlock(achievement);
    }

    showAchievementUnlock(achievement) {
        const rarity = (achievement.rarity || 'COMMON').toLowerCase();
        const rarityNames = {
            legendary: '传奇',
            epic: '史诗',
            rare: '稀有',
            common: '普通'
        };

        document.getElementById('achievementIcon').className = `gn-achievement-icon ${rarity}`;
        document.getElementById('achievementBadge').className = `gn-achievement-badge ${rarity}`;
        document.getElementById('achievementBadge').textContent = rarityNames[rarity] || '普通';
        document.getElementById('achievementTitle').textContent = achievement.name || '未知成就';
        document.getElementById('achievementDesc').textContent = achievement.description || '';
        document.getElementById('achievementPoints').textContent = achievement.points || 0;

        this.achievementOverlay.classList.add('active');
        this.createSparkles();

        // Play sound if available
        this.playUnlockSound(rarity);

        // Auto close after 5 seconds
        this.achievementTimeout = setTimeout(() => {
            this.closeAchievement();
        }, 5000);
    }

    closeAchievement() {
        clearTimeout(this.achievementTimeout);
        this.achievementOverlay.classList.remove('active');

        // Show next achievement after a delay
        setTimeout(() => {
            this.showNextAchievement();
        }, 500);
    }

    createSparkles() {
        const container = document.getElementById('achievementSparkles');
        container.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'gn-sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${50 + Math.random() * 50}%`;
            sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
            sparkle.style.animationDuration = `${1 + Math.random() * 0.5}s`;
            container.appendChild(sparkle);
        }
    }

    playUnlockSound(rarity) {
        // Optional: Add sound effects for different rarity levels
        try {
            const frequencies = {
                legendary: [523.25, 659.25, 783.99, 1046.50],
                epic: [523.25, 659.25, 783.99],
                rare: [523.25, 659.25],
                common: [523.25]
            };

            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = frequencies[rarity] || frequencies.common;

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.value = freq;
                osc.type = 'sine';

                gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
                gain.gain.exponentialDecayTo = 0.01;
                gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
                gain.gain.exponentialDecayTo(0.001, ctx.currentTime + i * 0.15 + 0.3);

                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.3);
            });
        } catch (e) {
            // Audio not supported, skip
        }
    }

    // Show achievement directly (for testing or manual trigger)
    showAchievement(name, description, points, rarity = 'COMMON') {
        this.queueAchievement({
            name,
            description,
            points,
            rarity
        });
    }

    // Cleanup
    destroy() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        if (this.container) {
            this.container.remove();
        }
        if (this.achievementOverlay) {
            this.achievementOverlay.remove();
        }
    }
}

// Initialize global notification system
let globalNotifications;
document.addEventListener('DOMContentLoaded', () => {
    globalNotifications = new GlobalNotificationSystem();
    window.globalNotifications = globalNotifications;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalNotificationSystem;
}
