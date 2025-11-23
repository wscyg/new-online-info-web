/**
 * PK Result (结果页面) - 对战结果展示
 * 功能：胜负动画、答题详情、ELO变化、段位变化、查看回放
 */

import { usePKStore } from '../../store/pk-store.js';

class PKResult {
    constructor(battleId) {
        this.battleId = battleId;
        this.store = usePKStore;
        this.battleResult = null;
        this.state = this.store.getState();
    }

    /**
     * 初始化结果页面
     */
    async init() {
        console.log('[PK Result] Initializing result page for battle:', this.battleId);

        // 订阅store变化
        this.store.subscribe((state) => {
            this.state = state;
        });

        // 加载对战结果
        await this.loadBattleResult();

        // 绑定事件
        this.bindEvents();

        // 显示结果动画
        this.showResultAnimation();

        // 渲染详细信息
        this.render();

        console.log('[PK Result] Initialized');
    }

    /**
     * 加载对战结果
     */
    async loadBattleResult() {
        try {
            const response = await window.API.pk.getBattleDetails(this.battleId);

            if (response.code === 200 && response.data) {
                this.battleResult = response.data;
                this.store.getState().endBattle(response.data.result);
            } else {
                this.showNotification('加载对战结果失败', 'error');
                setTimeout(() => {
                    window.location.href = '/src/pages/pk-arena.html';
                }, 2000);
            }
        } catch (error) {
            console.error('[PK Result] Failed to load battle result:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 返回大厅按钮
        document.getElementById('backToArenaBtn')?.addEventListener('click', () => {
            window.location.href = '/src/pages/pk-arena.html';
        });

        // 再来一局按钮
        document.getElementById('playAgainBtn')?.addEventListener('click', () => {
            window.location.href = '/src/pages/pk-arena.html?autoMatch=true';
        });

        // 查看回放按钮
        document.getElementById('viewReplayBtn')?.addEventListener('click', () => {
            this.viewReplay();
        });

        // 分享按钮
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareResult();
        });
    }

    /**
     * 显示结果动画
     */
    showResultAnimation() {
        if (!this.battleResult) return;

        const result = this.battleResult.result;
        const animationContainer = document.getElementById('resultAnimation');

        if (!animationContainer) return;

        const isWin = result.winner === 'player';
        const isDraw = result.winner === 'draw';

        // 动画HTML
        animationContainer.innerHTML = `
            <div class="result-animation ${isWin ? 'win' : isDraw ? 'draw' : 'lose'}">
                <div class="result-icon">
                    ${isWin ? '🏆' : isDraw ? '🤝' : '😔'}
                </div>
                <div class="result-text">
                    ${isWin ? '胜利！' : isDraw ? '平局' : '失败'}
                </div>
                <div class="result-subtitle">
                    ${this.getResultSubtitle(result)}
                </div>
            </div>
        `;

        // 触发动画
        setTimeout(() => {
            animationContainer.querySelector('.result-animation')?.classList.add('show');
        }, 100);
    }

    /**
     * 获取结果副标题
     */
    getResultSubtitle(result) {
        const isWin = result.winner === 'player';
        const isDraw = result.winner === 'draw';

        if (isWin) {
            return '恭喜你获得胜利！';
        } else if (isDraw) {
            return '势均力敌！';
        } else {
            return '继续努力！';
        }
    }

    /**
     * 渲染页面
     */
    render() {
        if (!this.battleResult) return;

        this.renderScoreComparison();
        this.renderELOChange();
        this.renderAnswerDetails();
        this.renderPlayerStats();
    }

    /**
     * 渲染分数对比
     */
    renderScoreComparison() {
        const container = document.getElementById('scoreComparison');
        if (!container) return;

        const result = this.battleResult.result;
        const myScore = result.playerScore || 0;
        const opponentScore = result.opponentScore || 0;

        container.innerHTML = `
            <div class="score-card player">
                <div class="player-info">
                    <div class="player-avatar">
                        ${this.battleResult.player.avatar
                            ? `<img src="${this.battleResult.player.avatar}" alt="${this.battleResult.player.nickname}">`
                            : this.battleResult.player.nickname[0].toUpperCase()
                        }
                    </div>
                    <div class="player-name">${this.battleResult.player.nickname}</div>
                </div>
                <div class="score">${myScore}</div>
                <div class="score-label">我的分数</div>
            </div>
            <div class="vs-divider">VS</div>
            <div class="score-card opponent">
                <div class="player-info">
                    <div class="player-avatar">
                        ${this.battleResult.opponent.avatar
                            ? `<img src="${this.battleResult.opponent.avatar}" alt="${this.battleResult.opponent.nickname}">`
                            : this.battleResult.opponent.nickname[0].toUpperCase()
                        }
                    </div>
                    <div class="player-name">${this.battleResult.opponent.nickname}</div>
                </div>
                <div class="score">${opponentScore}</div>
                <div class="score-label">对手分数</div>
            </div>
        `;
    }

    /**
     * 渲染ELO变化
     */
    renderELOChange() {
        const container = document.getElementById('eloChange');
        if (!container) return;

        const result = this.battleResult.result;
        const eloChange = result.eloChange || 0;
        const newElo = result.newElo || this.state.userStats.elo;
        const oldTier = result.oldTier || this.state.userStats.tier;
        const newTier = result.newTier || window.getTierByElo(newElo);
        const tierChanged = oldTier !== newTier;

        container.innerHTML = `
            <div class="elo-display">
                <div class="elo-change ${eloChange > 0 ? 'positive' : eloChange < 0 ? 'negative' : 'neutral'}">
                    ${eloChange > 0 ? '+' : ''}${eloChange}
                </div>
                <div class="elo-value">ELO: ${newElo}</div>
            </div>
            ${tierChanged ? `
                <div class="tier-change">
                    <div class="tier-change-label">
                        ${oldTier > newTier ? '⬇️ 降级' : '⬆️ 晋级'}
                    </div>
                    <div class="tier-change-value">
                        ${window.getTierIcon(oldTier)} ${window.getTierName(oldTier)}
                        →
                        ${window.getTierIcon(newTier)} ${window.getTierName(newTier)}
                    </div>
                </div>
            ` : `
                <div class="tier-display">
                    ${window.getTierIcon(newTier)} ${window.getTierName(newTier)}
                </div>
            `}
        `;
    }

    /**
     * 渲染答题详情
     */
    renderAnswerDetails() {
        const container = document.getElementById('answerDetails');
        if (!container) return;

        const questions = this.battleResult.questions || [];
        const playerAnswers = this.battleResult.playerAnswers || [];
        const opponentAnswers = this.battleResult.opponentAnswers || [];

        container.innerHTML = questions.map((question, index) => {
            const playerAnswer = playerAnswers[index];
            const opponentAnswer = opponentAnswers[index];
            const playerCorrect = playerAnswer?.correct;
            const opponentCorrect = opponentAnswer?.correct;

            return `
                <div class="answer-item">
                    <div class="question-title">
                        <span class="question-number">Q${index + 1}</span>
                        <span class="question-text">${this.truncate(question.title || question.content, 60)}</span>
                    </div>
                    <div class="answer-comparison">
                        <div class="answer-result ${playerCorrect ? 'correct' : 'wrong'}">
                            <div class="result-icon">${playerCorrect ? '✓' : '✗'}</div>
                            <div class="answer-time">${this.formatTime(playerAnswer?.answerTime || 0)}</div>
                        </div>
                        <div class="vs">vs</div>
                        <div class="answer-result ${opponentCorrect ? 'correct' : 'wrong'}">
                            <div class="result-icon">${opponentCorrect ? '✓' : '✗'}</div>
                            <div class="answer-time">${this.formatTime(opponentAnswer?.answerTime || 0)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染玩家统计
     */
    renderPlayerStats() {
        const container = document.getElementById('playerStats');
        if (!container) return;

        const result = this.battleResult.result;
        const myStats = {
            accuracy: result.playerAccuracy || 0,
            avgTime: result.playerAvgTime || 0,
            correctCount: result.playerCorrectCount || 0,
            totalQuestions: this.battleResult.questions?.length || 0
        };

        const opponentStats = {
            accuracy: result.opponentAccuracy || 0,
            avgTime: result.opponentAvgTime || 0,
            correctCount: result.opponentCorrectCount || 0,
            totalQuestions: this.battleResult.questions?.length || 0
        };

        container.innerHTML = `
            <div class="stats-comparison">
                <div class="stat-row">
                    <div class="stat-label">正确率</div>
                    <div class="stat-value player">${myStats.accuracy.toFixed(1)}%</div>
                    <div class="stat-value opponent">${opponentStats.accuracy.toFixed(1)}%</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">正确题数</div>
                    <div class="stat-value player">${myStats.correctCount}/${myStats.totalQuestions}</div>
                    <div class="stat-value opponent">${opponentStats.correctCount}/${opponentStats.totalQuestions}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">平均用时</div>
                    <div class="stat-value player">${this.formatTime(myStats.avgTime)}</div>
                    <div class="stat-value opponent">${this.formatTime(opponentStats.avgTime)}</div>
                </div>
            </div>
        `;
    }

    /**
     * 查看回放
     */
    async viewReplay() {
        try {
            const response = await window.API.pk.getBattleReplay(this.battleId);

            if (response.code === 200 && response.data) {
                // 跳转到回放页面
                window.location.href = `/src/pages/pk-replay.html?battleId=${this.battleId}`;
            } else {
                this.showNotification('暂无回放数据', 'info');
            }
        } catch (error) {
            console.error('[PK Result] Failed to load replay:', error);
            this.showNotification('加载回放失败', 'error');
        }
    }

    /**
     * 分享结果
     */
    shareResult() {
        const result = this.battleResult.result;
        const text = `我在PK对战中${result.winner === 'player' ? '获胜了' : result.winner === 'draw' ? '打成了平局' : '失败了'}！ELO ${result.eloChange > 0 ? '+' : ''}${result.eloChange}`;

        if (navigator.share) {
            navigator.share({
                title: 'PK对战结果',
                text: text,
                url: window.location.href
            }).catch(err => console.log('分享失败:', err));
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('已复制到剪贴板', 'success');
            });
        }
    }

    /**
     * 格式化时间
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const ms_remainder = ms % 1000;
        return `${seconds}.${Math.floor(ms_remainder / 100)}s`;
    }

    /**
     * 截断文本
     */
    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
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
export default PKResult;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    window.PKResult = PKResult;

    document.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const battleId = urlParams.get('battleId');

        if (!battleId) {
            alert('无效的对战ID');
            window.location.href = '/src/pages/pk-arena.html';
            return;
        }

        const result = new PKResult(battleId);
        result.init();
    });
}
