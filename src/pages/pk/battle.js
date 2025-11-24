/**
 * PK Battle (对战页面) - 实时对战逻辑
 * 功能：题目显示、答题、实时进度、倒计时、对手进度通知
 */

import { getPKWebSocket } from '../../utils/websocket-pk.js';
import { usePKStore } from '../../store/pk-store.js';
import DOMPurify from 'dompurify'; // HTML清洗
import hljs from 'highlight.js'; // 代码高亮

class PKBattle {
    constructor(battleId) {
        this.battleId = battleId;
        this.store = usePKStore;
        this.wsClient = null;
        this.state = this.store.getState();
        this.battleTimer = null;
        this.questionTimer = null;
        this.timeRemaining = 0;
        this.questionStartTime = 0;
    }

    /**
     * 初始化对战
     */
    async init() {
        console.log('[PK Battle] Initializing battle:', this.battleId);

        // 订阅store变化
        this.store.subscribe((state) => {
            this.state = state;
            this.updateUI();
        });

        // 检查用户登录
        if (!this.checkAuth()) {
            return;
        }

        // 初始化WebSocket
        this.initWebSocket();

        // 加载对战信息
        await this.loadBattleInfo();

        // 绑定事件
        this.bindEvents();

        // 开始对战
        this.startBattle();

        console.log('[PK Battle] Battle initialized');
    }

    /**
     * 检查认证
     */
    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/src/pages/login.html';
            return false;
        }
        return true;
    }

    /**
     * 初始化WebSocket
     */
    initWebSocket() {
        this.wsClient = getPKWebSocket({ debug: true });
        this.wsClient.connect(this.battleId);

        // 监听对战开始
        this.wsClient.on('battle_start', (data) => {
            console.log('[PK Battle] Battle started:', data);
            this.onBattleStart(data);
        });

        // 监听对手答题
        this.wsClient.on('opponent_progress', (data) => {
            console.log('[PK Battle] Opponent progress:', data);
            this.onOpponentProgress(data);
        });

        // 监听对战结束
        this.wsClient.on('battle_end', (data) => {
            console.log('[PK Battle] Battle ended:', data);
            this.onBattleEnd(data);
        });

        // 加入对战房间
        this.wsClient.joinBattle(this.battleId);
    }

    /**
     * 加载对战信息
     */
    async loadBattleInfo() {
        try {
            const response = await window.API.pk.getBattleDetails(this.battleId);

            if (response.code === 200 && response.data) {
                const battleInfo = response.data;
                this.store.getState().setBattle(battleInfo);

                // 【新增】渲染双方Avatar到状态栏
                await this.renderBattleAvatars(battleInfo);

                // 如果对战已经开始，加载题目
                if (battleInfo.status === 'IN_PROGRESS') {
                    this.loadQuestions(battleInfo.questions);
                }
            } else {
                this.showNotification('加载对战信息失败', 'error');
                setTimeout(() => {
                    window.location.href = '/src/pages/pk-arena.html';
                }, 2000);
            }
        } catch (error) {
            console.error('[PK Battle] Failed to load battle info:', error);
            this.showNotification('网络错误', 'error');
        }
    }

    /**
     * 【新增】渲染对战状态栏的Avatar
     */
    async renderBattleAvatars(battleInfo) {
        try {
            // 动态导入Avatar渲染器
            if (!window.AvatarRenderer) {
                await import('../../components/AvatarRenderer.js');
            }

            // 渲染玩家1的Avatar（自己）
            if (battleInfo.player1?.id || battleInfo.player1Id) {
                const player1Id = battleInfo.player1?.id || battleInfo.player1Id;
                const player1Renderer = new window.AvatarRenderer('player1AvatarCanvas', 50, 65);
                await player1Renderer.loadEquippedSkins(player1Id);
                player1Renderer.render();
            }

            // 渲染玩家2的Avatar（对手）
            if (battleInfo.player2?.id || battleInfo.player2Id) {
                const player2Id = battleInfo.player2?.id || battleInfo.player2Id;
                const player2Renderer = new window.AvatarRenderer('player2AvatarCanvas', 50, 65);
                await player2Renderer.loadEquippedSkins(player2Id);
                player2Renderer.render();
            }

            console.log('[PK Battle] Battle avatars rendered successfully');
        } catch (error) {
            console.error('[PK Battle] Failed to render battle avatars:', error);
            // Avatar渲染失败不影响核心流程
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 答案选项点击
        document.addEventListener('click', (e) => {
            if (e.target.matches('.answer-option') || e.target.closest('.answer-option')) {
                const option = e.target.closest('.answer-option');
                this.selectAnswer(option);
            }
        });

        // 提交答案按钮
        document.getElementById('submitAnswerBtn')?.addEventListener('click', () => {
            this.submitAnswer();
        });

        // 认输按钮
        document.getElementById('forfeitBtn')?.addEventListener('click', () => {
            this.confirmForfeit();
        });
    }

    /**
     * 对战开始回调
     */
    onBattleStart(data) {
        console.log('[PK Battle] Starting battle with questions:', data.questions);

        // 加载题目
        this.loadQuestions(data.questions);

        // 开始计时
        this.startTimer(data.duration || 600);
    }

    /**
     * 加载题目
     */
    loadQuestions(questions) {
        this.store.getState().startBattle(questions);
        this.renderCurrentQuestion();
    }

    /**
     * 开始计时器
     */
    startTimer(duration) {
        this.timeRemaining = duration;
        this.updateTimerDisplay();

        this.battleTimer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.onTimeUp();
            }
        }, 1000);
    }

    /**
     * 更新计时器显示
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('battleTimer');
        if (timerEl) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // 倒计时警告
            if (this.timeRemaining <= 30) {
                timerEl.classList.add('warning');
            }
        }
    }

    /**
     * 时间到
     */
    onTimeUp() {
        clearInterval(this.battleTimer);
        this.showNotification('时间到！', 'warning');
        this.endBattle();
    }

    /**
     * 渲染当前题目
     */
    async renderCurrentQuestion() {
        const { questions, currentQuestionIndex } = this.state;

        if (currentQuestionIndex >= questions.length) {
            // 所有题目已完成
            this.endBattle();
            return;
        }

        const question = questions[currentQuestionIndex];
        const questionContainer = document.getElementById('questionContainer');

        if (!questionContainer) return;

        // 清洗HTML内容
        const cleanContent = DOMPurify.sanitize(question.content);

        questionContainer.innerHTML = `
            <div class="question-header">
                <div class="question-number">题目 ${currentQuestionIndex + 1} / ${questions.length}</div>
                <div class="question-difficulty ${question.difficulty}">${this.getDifficultyLabel(question.difficulty)}</div>
            </div>
            <div class="question-content">
                ${cleanContent}
            </div>
            <div class="answer-options">
                ${this.renderAnswerOptions(question)}
            </div>
        `;

        // 高亮代码块
        questionContainer.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        // 【新增】记录题目开始时间到后端（反作弊）
        await this.recordQuestionStart(currentQuestionIndex);

        // 记录题目开始时间（本地）
        this.questionStartTime = Date.now();

        // 清除之前的选择
        this.selectedAnswer = null;
    }

    /**
     * 【新增】记录题目开始时间（反作弊）
     */
    async recordQuestionStart(questionIndex) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;

            if (!userId) {
                console.warn('[PK Battle] User ID not found, skipping question start record');
                return;
            }

            const response = await fetch(`${window.API_BASE_URL || 'http://localhost:8070'}/api/pk/anticheat/question-start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    battleId: this.battleId,
                    userId: userId,
                    questionIndex: questionIndex
                })
            });

            if (response.ok) {
                console.log(`[PK Battle] Question ${questionIndex} start time recorded`);
            } else {
                console.warn('[PK Battle] Failed to record question start time:', await response.text());
            }
        } catch (error) {
            console.error('[PK Battle] Error recording question start time:', error);
            // 不阻断主流程
        }
    }

    /**
     * 渲染答案选项
     */
    renderAnswerOptions(question) {
        const options = question.options || [];

        return options.map((option, index) => `
            <div class="answer-option" data-option="${option.id || index}">
                <div class="option-label">${String.fromCharCode(65 + index)}</div>
                <div class="option-content">${DOMPurify.sanitize(option.content || option.text)}</div>
            </div>
        `).join('');
    }

    /**
     * 选择答案
     */
    selectAnswer(optionEl) {
        // 移除之前的选中状态
        document.querySelectorAll('.answer-option').forEach(el => {
            el.classList.remove('selected');
        });

        // 选中当前选项
        optionEl.classList.add('selected');
        this.selectedAnswer = optionEl.dataset.option;
    }

    /**
     * 提交答案
     */
    async submitAnswer() {
        if (!this.selectedAnswer) {
            this.showNotification('请选择一个答案', 'warning');
            return;
        }

        const { questions, currentQuestionIndex } = this.state;
        const question = questions[currentQuestionIndex];
        const answerTime = Date.now() - this.questionStartTime;

        try {
            // 提交到后端
            const response = await window.API.pk.submitAnswer(
                this.battleId,
                question.id,
                this.selectedAnswer,
                answerTime
            );

            if (response.code === 200) {
                const isCorrect = response.data.correct;

                // 显示答题结果
                this.showAnswerResult(isCorrect);

                // 更新store
                this.store.getState().submitAnswer(
                    question.id,
                    this.selectedAnswer,
                    answerTime,
                    isCorrect
                );

                // 通知对手进度
                this.wsClient.updateProgress(
                    currentQuestionIndex + 1,
                    questions.length,
                    this.state.answers.filter(a => a.isCorrect).length
                );

                // 1.5秒后进入下一题
                setTimeout(() => {
                    this.renderCurrentQuestion();
                }, 1500);
            }
        } catch (error) {
            console.error('[PK Battle] Failed to submit answer:', error);
            this.showNotification('提交失败，请重试', 'error');
        }
    }

    /**
     * 显示答题结果
     */
    showAnswerResult(isCorrect) {
        const resultEl = document.getElementById('answerResult');
        if (resultEl) {
            resultEl.className = `answer-result ${isCorrect ? 'correct' : 'wrong'}`;
            resultEl.textContent = isCorrect ? '✓ 正确' : '✗ 错误';
            resultEl.classList.add('show');

            setTimeout(() => {
                resultEl.classList.remove('show');
            }, 1500);
        }
    }

    /**
     * 对手进度更新
     */
    onOpponentProgress(data) {
        this.store.getState().updateOpponentProgress(data);
        this.updateOpponentProgressBar();
    }

    /**
     * 更新对手进度条
     */
    updateOpponentProgressBar() {
        const { opponentProgress, questions } = this.state;
        const progressEl = document.getElementById('opponentProgress');

        if (progressEl && questions.length > 0) {
            const percentage = (opponentProgress.questionIndex / questions.length) * 100;
            progressEl.style.width = `${percentage}%`;
        }

        const correctCountEl = document.getElementById('opponentCorrectCount');
        if (correctCountEl) {
            correctCountEl.textContent = opponentProgress.correctCount || 0;
        }
    }

    /**
     * 更新我的进度条
     */
    updateMyProgressBar() {
        const { currentQuestionIndex, questions, answers } = this.state;
        const progressEl = document.getElementById('myProgress');

        if (progressEl && questions.length > 0) {
            const percentage = (currentQuestionIndex / questions.length) * 100;
            progressEl.style.width = `${percentage}%`;
        }

        const correctCountEl = document.getElementById('myCorrectCount');
        if (correctCountEl) {
            const correctCount = answers.filter(a => a.isCorrect).length;
            correctCountEl.textContent = correctCount;
        }
    }

    /**
     * 结束对战
     */
    async endBattle() {
        clearInterval(this.battleTimer);

        try {
            const response = await window.API.pk.endBattle(this.battleId);

            if (response.code === 200 && response.data) {
                // 通知WebSocket
                this.wsClient.endBattle();

                // 跳转到结果页面
                setTimeout(() => {
                    window.location.href = `/src/pages/pk-result.html?battleId=${this.battleId}`;
                }, 1000);
            }
        } catch (error) {
            console.error('[PK Battle] Failed to end battle:', error);
        }
    }

    /**
     * 对战结束回调
     */
    onBattleEnd(data) {
        this.store.getState().endBattle(data);

        // 跳转到结果页面
        setTimeout(() => {
            window.location.href = `/src/pages/pk-result.html?battleId=${this.battleId}`;
        }, 2000);
    }

    /**
     * 确认认输
     */
    confirmForfeit() {
        if (confirm('确定要认输吗？')) {
            this.forfeit();
        }
    }

    /**
     * 认输
     */
    async forfeit() {
        try {
            const response = await window.API.pk.forfeitBattle(this.battleId);

            if (response.code === 200) {
                this.wsClient.forfeit();
                this.showNotification('已认输', 'info');

                setTimeout(() => {
                    window.location.href = '/src/pages/pk-arena.html';
                }, 1500);
            }
        } catch (error) {
            console.error('[PK Battle] Failed to forfeit:', error);
            this.showNotification('认输失败', 'error');
        }
    }

    /**
     * 获取难度标签
     */
    getDifficultyLabel(difficulty) {
        const labels = {
            EASY: '简单',
            MEDIUM: '中等',
            HARD: '困难'
        };
        return labels[difficulty] || '中等';
    }

    /**
     * 更新UI
     */
    updateUI() {
        this.updateMyProgressBar();
        this.updateOpponentProgressBar();
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

    /**
     * 销毁
     */
    destroy() {
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
        }
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
        }
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
    }
}

// 导出
export default PKBattle;

// 页面加载完成后自动初始化
if (typeof window !== 'undefined') {
    window.PKBattle = PKBattle;

    document.addEventListener('DOMContentLoaded', () => {
        // 从URL获取battleId
        const urlParams = new URLSearchParams(window.location.search);
        const battleId = urlParams.get('battleId');

        if (!battleId) {
            alert('无效的对战ID');
            window.location.href = '/src/pages/pk-arena.html';
            return;
        }

        const battle = new PKBattle(battleId);
        battle.init();

        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            battle.destroy();
        });
    });
}
