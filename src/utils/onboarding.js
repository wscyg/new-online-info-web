/**
 * 新用户引导组件
 * 用于引导新注册用户完成初始设置
 */
class NewUserOnboarding {
    constructor() {
        this.steps = [
            {
                id: 'welcome',
                title: '欢迎加入 AI 信息未来！',
                subtitle: '让我们花1分钟完成初始设置',
                icon: '🎉',
                action: null
            },
            {
                id: 'profile',
                title: '完善个人资料',
                subtitle: '让其他学习者认识你',
                icon: '👤',
                action: () => window.location.href = 'profile.html?setup=true'
            },
            {
                id: 'diagnostic',
                title: '入学诊断测试',
                subtitle: '了解你的知识水平，推荐合适课程',
                icon: '📊',
                action: () => window.location.href = 'diagnostic.html'
            },
            {
                id: 'firstCourse',
                title: '开始第一门课程',
                subtitle: '体验免费课程，开启学习之旅',
                icon: '📚',
                action: () => window.location.href = 'courses.html?free=true'
            },
            {
                id: 'community',
                title: '加入学习社区',
                subtitle: '结识志同道合的学习伙伴',
                icon: '👥',
                action: () => window.location.href = 'online-plaza.html'
            }
        ];

        this.currentStep = 0;
        this.completedSteps = this.getCompletedSteps();
    }

    getCompletedSteps() {
        const saved = localStorage.getItem('onboarding_completed');
        return saved ? JSON.parse(saved) : [];
    }

    saveCompletedSteps() {
        localStorage.setItem('onboarding_completed', JSON.stringify(this.completedSteps));
    }

    markStepComplete(stepId) {
        if (!this.completedSteps.includes(stepId)) {
            this.completedSteps.push(stepId);
            this.saveCompletedSteps();
        }
    }

    isNewUser() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) return false;

        // 检查是否已完成所有引导步骤
        if (this.completedSteps.length >= this.steps.length - 1) return false;

        // 检查是否是新注册用户（7天内）
        const dismissed = localStorage.getItem('onboarding_dismissed');
        if (dismissed) {
            const dismissedTime = new Date(dismissed);
            const now = new Date();
            // 如果已关闭超过7天，不再显示
            if ((now - dismissedTime) / (1000 * 60 * 60 * 24) > 7) return false;
        }

        return true;
    }

    dismiss() {
        localStorage.setItem('onboarding_dismissed', new Date().toISOString());
        this.hide();
    }

    show() {
        if (!this.isNewUser()) return;

        // 创建引导弹窗
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.innerHTML = `
            <style>
                #onboarding-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .onboarding-modal {
                    background: var(--bg-primary, #fff);
                    border-radius: 24px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    position: relative;
                    animation: slideUp 0.4s ease;
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .onboarding-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: var(--bg-secondary, #f5f5f5);
                    cursor: pointer;
                    font-size: 18px;
                    color: var(--text-secondary, #666);
                }

                .onboarding-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                }

                .onboarding-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-primary, #333);
                    margin-bottom: 8px;
                }

                .onboarding-subtitle {
                    color: var(--text-secondary, #666);
                    margin-bottom: 32px;
                }

                .onboarding-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .onboarding-step {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: var(--bg-secondary, #f5f5f5);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .onboarding-step:hover {
                    transform: translateX(4px);
                    background: var(--bg-tertiary, #eee);
                }

                .onboarding-step.completed {
                    opacity: 0.6;
                }

                .onboarding-step-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .onboarding-step.completed .onboarding-step-icon {
                    background: #22c55e;
                }

                .onboarding-step-content {
                    flex: 1;
                }

                .onboarding-step-title {
                    font-weight: 600;
                    color: var(--text-primary, #333);
                    margin-bottom: 2px;
                }

                .onboarding-step-desc {
                    font-size: 0.85rem;
                    color: var(--text-secondary, #666);
                }

                .onboarding-step-check {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 2px solid var(--border-color, #ddd);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: transparent;
                }

                .onboarding-step.completed .onboarding-step-check {
                    background: #22c55e;
                    border-color: #22c55e;
                    color: white;
                }

                .onboarding-progress {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 24px;
                }

                .progress-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--border-color, #ddd);
                }

                .progress-dot.active {
                    background: var(--accent, #6366f1);
                    width: 24px;
                    border-radius: 4px;
                }

                .progress-dot.completed {
                    background: #22c55e;
                }

                .onboarding-skip {
                    color: var(--text-tertiary, #999);
                    font-size: 0.9rem;
                    cursor: pointer;
                    text-decoration: underline;
                }

                .onboarding-gift {
                    margin-top: 24px;
                    padding: 16px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
                    border-radius: 12px;
                    border: 1px dashed var(--accent, #6366f1);
                }

                .gift-title {
                    font-weight: 600;
                    color: var(--accent, #6366f1);
                    margin-bottom: 4px;
                }

                .gift-desc {
                    font-size: 0.85rem;
                    color: var(--text-secondary, #666);
                }
            </style>

            <div class="onboarding-modal">
                <button class="onboarding-close" onclick="newUserOnboarding.dismiss()">×</button>

                <div class="onboarding-icon">🎉</div>
                <h2 class="onboarding-title">欢迎加入 AI 信息未来！</h2>
                <p class="onboarding-subtitle">完成以下步骤，开启你的AI学习之旅</p>

                <div class="onboarding-progress">
                    ${this.steps.slice(1).map((_, i) => `
                        <div class="progress-dot ${this.completedSteps.includes(this.steps[i+1].id) ? 'completed' : ''}"></div>
                    `).join('')}
                </div>

                <div class="onboarding-steps">
                    ${this.steps.slice(1).map(step => `
                        <div class="onboarding-step ${this.completedSteps.includes(step.id) ? 'completed' : ''}"
                             onclick="newUserOnboarding.executeStep('${step.id}')">
                            <div class="onboarding-step-icon">${step.icon}</div>
                            <div class="onboarding-step-content">
                                <div class="onboarding-step-title">${step.title}</div>
                                <div class="onboarding-step-desc">${step.subtitle}</div>
                            </div>
                            <div class="onboarding-step-check">
                                ${this.completedSteps.includes(step.id) ? '✓' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="onboarding-gift">
                    <div class="gift-title">🎁 新人礼包</div>
                    <div class="gift-desc">完成所有步骤，获得 200积分 + 7天VIP体验</div>
                </div>

                <p class="onboarding-skip" onclick="newUserOnboarding.dismiss()">稍后再说</p>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    hide() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    executeStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step && step.action) {
            this.markStepComplete(stepId);
            step.action();
        }
    }

    // 检查并授予新人礼包
    async checkAndGrantReward() {
        const requiredSteps = this.steps.slice(1).map(s => s.id);
        const allCompleted = requiredSteps.every(id => this.completedSteps.includes(id));

        if (allCompleted && !localStorage.getItem('newbie_reward_claimed')) {
            // 标记已领取
            localStorage.setItem('newbie_reward_claimed', 'true');

            // 调用API发放奖励
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch('/api/points/award?points=200&reason=newbie_reward', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    alert('🎉 恭喜！你已获得新人礼包：200积分 + 7天VIP体验');
                }
            } catch (e) {
                console.error('Grant reward failed:', e);
            }
        }
    }
}

// 创建全局实例
window.newUserOnboarding = new NewUserOnboarding();

// 页面加载后检查是否显示引导
document.addEventListener('DOMContentLoaded', () => {
    // 延迟显示，让页面先加载完成
    setTimeout(() => {
        if (window.newUserOnboarding.isNewUser()) {
            window.newUserOnboarding.show();
        }
    }, 1000);
});
