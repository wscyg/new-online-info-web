/**
 * PK Battle (对战页面) - REST 版对战逻辑
 * 数据来源：pk-arena.html 写入 sessionStorage 的 `pkBattle`
 */

import { usePKStore } from '../../store/pk-store.js';
import DOMPurify from 'dompurify'; // HTML清洗
import hljs from 'highlight.js'; // 代码高亮

class PKBattle {
    constructor(battleId) {
        this.battleId = battleId;
        this.apiBase = window.API_BASE || '/api';
        this.store = usePKStore;
        this.state = this.store.getState();
        this.battleTimer = null;
        this.questionTimer = null;
        this.timeRemaining = 0;
        this.questionStartTime = 0;
        this.battleData = null;
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

        // 加载对战信息
        await this.loadBattleInfo();
        if (!this.battleData) return;

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
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `login.html?returnUrl=${returnUrl}`;
            return false;
        }
        return true;
    }

    /**
     * 加载对战信息
     */
    async loadBattleInfo() {
        try {
            const raw = sessionStorage.getItem('pkBattle');
            if (!raw) {
                alert('对战信息已丢失，请从PK竞技场重新进入');
                window.location.href = 'pk-arena.html';
                return;
            }

            const battleData = JSON.parse(raw);
            this.battleData = battleData;
            this.store.getState().setBattle(battleData);

            // 初始化头部信息
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const player1NameEl = document.getElementById('player1Name');
            if (player1NameEl) {
                player1NameEl.textContent = user.nickname || user.username || '我';
            }

            const opponentName =
                battleData?.opponent?.nickname ||
                battleData?.opponent?.username ||
                (battleData?.opponentId ? `用户${battleData.opponentId}` : '对手');
            const player2NameEl = document.getElementById('player2Name');
            if (player2NameEl) {
                player2NameEl.textContent = opponentName;
            }

            const questions = Array.isArray(battleData?.questions) ? battleData.questions : [];
            const total = questions.length || 0;
            ['totalQuestions', 'totalQuestions2', 'totalQuestionsHeader'].forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.textContent = String(total);
            });
        } catch (error) {
            console.error('[PK Battle] Failed to load battle info:', error);
            alert('加载对战信息失败，请返回重试');
            window.location.href = 'pk-arena.html';
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
    }

    /**
     * 开始对战（使用 pk-arena 写入的题目数据）
     */
    startBattle() {
        const questions = Array.isArray(this.battleData?.questions) ? this.battleData.questions : [];
        if (questions.length === 0) {
            alert('题库为空，暂时无法开始对战');
            window.location.href = 'pk-arena.html';
            return;
        }

        // 1题≈60秒，最低5分钟，最高20分钟
        const duration = Math.min(Math.max(questions.length * 60, 300), 1200);

        // 初始化进度展示
        const total = questions.length;
        ['totalQuestions', 'totalQuestions2', 'totalQuestionsHeader'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(total);
        });

        document.getElementById('player1Progress') && (document.getElementById('player1Progress').textContent = '0');
        document.getElementById('player2Progress') && (document.getElementById('player2Progress').textContent = '0');

        this.startTimer(duration);
        this.loadQuestions(questions);
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
            await this.endBattle();
            return;
        }

        const question = questions[currentQuestionIndex] || {};
        const content = question.questionHtml || question.question || question.content || '';

        // 头部信息
        const currentNoEl = document.getElementById('currentQuestionNumber');
        if (currentNoEl) currentNoEl.textContent = String(currentQuestionIndex + 1);
        const totalEl = document.getElementById('totalQuestionsHeader');
        if (totalEl) totalEl.textContent = String(questions.length);

        const difficultyEl = document.getElementById('questionDifficulty');
        if (difficultyEl) difficultyEl.textContent = this.getDifficultyLabel(question.difficulty);

        const typeEl = document.getElementById('questionType');
        if (typeEl) typeEl.textContent = this.getQuestionTypeLabel(question.type || question.questionType);

        // 内容
        const contentEl = document.getElementById('questionContent');
        if (contentEl) {
            contentEl.innerHTML = DOMPurify.sanitize(String(content));
            contentEl.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }

        // 选项
        const optionsEl = document.getElementById('optionsList');
        if (optionsEl) {
            optionsEl.innerHTML = this.renderAnswerOptions(question);
        }

        // 【新增】记录题目开始时间到后端（反作弊）
        await this.recordQuestionStart(currentQuestionIndex);

        // 记录题目开始时间（本地）
        this.questionStartTime = Date.now();

        // 清除之前的选择
        this.selectedAnswer = null;

        // 禁用提交按钮，直到选择答案
        const submitBtn = document.getElementById('submitAnswerBtn');
        if (submitBtn) submitBtn.disabled = true;
    }

    /**
     * 【新增】记录题目开始时间（反作弊）
     */
    async recordQuestionStart(questionIndex) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;

            if (!userId) return;

            await fetch(`${this.apiBase}/pk/anticheat/question-start`, {
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
        } catch (error) {
            // 不阻断主流程
        }
    }

    /**
     * 渲染答案选项
     */
    normalizeOptions(question) {
        if (Array.isArray(question?.options) && question.options.length > 0) {
            return question.options
                .map((opt, idx) => {
                    const key = opt.optionKey || opt.optionLabel || String.fromCharCode(65 + idx);
                    const value = opt.optionValue || opt.optionHtml || opt.content || opt.text || '';
                    return { key, value };
                })
                .filter(o => o.value != null && String(o.value).trim() !== '');
        }

        return [
            { key: 'A', value: question?.optionA },
            { key: 'B', value: question?.optionB },
            { key: 'C', value: question?.optionC },
            { key: 'D', value: question?.optionD }
        ].filter(o => o.value != null && String(o.value).trim() !== '');
    }

    renderAnswerOptions(question) {
        const options = this.normalizeOptions(question);
        return options.map((option) => `
            <div class="answer-option" data-option="${option.key}">
                <div class="option-label">${option.key}</div>
                <div class="option-content">${DOMPurify.sanitize(String(option.value))}</div>
            </div>
        `).join('');
    }

    /**
     * 选择答案
     */
    selectAnswer(optionEl) {
        // 移除之前的选中状态
        document.querySelectorAll('#optionsList .answer-option').forEach(el => {
            el.classList.remove('selected');
        });

        // 选中当前选项
        optionEl.classList.add('selected');
        this.selectedAnswer = optionEl.dataset.option;

        const submitBtn = document.getElementById('submitAnswerBtn');
        if (submitBtn) submitBtn.disabled = !this.selectedAnswer;
    }

    /**
     * 提交答案
     */
    async submitAnswer() {
        if (!this.selectedAnswer) {
            this.showNotification('请选择一个答案', 'warning');
            return;
        }

        const submitBtn = document.getElementById('submitAnswerBtn');
        if (submitBtn) submitBtn.disabled = true;

        const { questions, currentQuestionIndex } = this.state;
        const question = questions[currentQuestionIndex];
        const answerTime = Math.max(1, Math.round((Date.now() - this.questionStartTime) / 1000)); // 秒

        try {
            const token = localStorage.getItem('token');
            const payload = {
                questionId: question.id,
                questionIndex: currentQuestionIndex,
                userAnswer: this.selectedAnswer,
                // 兼容旧题库返回字段：answer
                correctAnswer: question.answer || question.correctAnswer,
                answerTime
            };

            const res = await fetch(`${this.apiBase}/pk/battles/${this.battleId}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.code !== 200) {
                this.showNotification(data.message || '提交失败，请重试', 'error');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            const isCorrect = data?.data?.isCorrect ?? data?.data?.correct ?? false;

            // 显示答题结果
            this.showAnswerResult(isCorrect);

            // 更新store
            this.store.getState().submitAnswer(
                question.id,
                this.selectedAnswer,
                answerTime,
                isCorrect
            );

            // 进入下一题
            setTimeout(() => {
                this.renderCurrentQuestion();
            }, 600);
        } catch (error) {
            console.error('[PK Battle] Failed to submit answer:', error);
            this.showNotification('提交失败，请重试', 'error');
            if (submitBtn) submitBtn.disabled = false;
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
        // 当前版本不做对手实时同步：保持UI稳定
        const progressEl = document.getElementById('opponentProgress');
        if (progressEl) progressEl.style.width = '0%';
        const player2ProgressEl = document.getElementById('player2Progress');
        if (player2ProgressEl) player2ProgressEl.textContent = '0';
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

        const player1ProgressEl = document.getElementById('player1Progress');
        if (player1ProgressEl) {
            player1ProgressEl.textContent = String(Math.min(currentQuestionIndex, questions.length));
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
            const token = localStorage.getItem('token');
            await fetch(`${this.apiBase}/pk/battles/${this.battleId}/end`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('[PK Battle] Failed to end battle:', error);
        } finally {
            sessionStorage.removeItem('pkBattle');
            window.location.href = 'pk-arena.html';
        }
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
            const token = localStorage.getItem('token');
            await fetch(`${this.apiBase}/pk/battles/${this.battleId}/forfeit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('[PK Battle] Failed to forfeit:', error);
            this.showNotification('认输失败', 'error');
        } finally {
            sessionStorage.removeItem('pkBattle');
            window.location.href = 'pk-arena.html';
        }
    }

    /**
     * 获取难度标签
     */
    getDifficultyLabel(difficulty) {
        const d = String(difficulty || '').toLowerCase();
        if (d === 'easy') return '简单';
        if (d === 'hard') return '困难';
        if (d === 'medium') return '中等';
        return difficulty ? String(difficulty) : '中等';
    }

    /**
     * 获取题型标签
     */
    getQuestionTypeLabel(type) {
        const t = String(type || '').toLowerCase();
        if (t.includes('multiple')) return '多选题';
        if (t.includes('true') || t.includes('judge')) return '判断题';
        if (t.includes('fill')) return '填空题';
        return '选择题';
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
        } else if (type === 'error' || type === 'warning') {
            alert(message);
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
    }

    // 兼容 pk-battle.html 的调用
    cleanup() {
        this.destroy();
    }
}

// 导出
export default PKBattle;
