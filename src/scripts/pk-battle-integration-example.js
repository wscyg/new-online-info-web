/**
 * PK对战页面前端集成示例
 * 展示如何集成Avatar渲染和反作弊功能
 *
 * 使用方法：
 * 1. 将此文件中的代码片段复制到实际的 pk/battle.js 中
 * 2. 确保已引入 AvatarRenderer.js 和 pk-avatar-helper.js
 * 3. 根据实际API端点调整URL
 */

import { renderPlayerAvatar } from './pk-avatar-helper.js';

// ==================== 示例1: 对战初始化（渲染Avatar） ====================

class PKBattle {
    constructor(battleId) {
        this.battleId = battleId;
        this.currentUserId = getCurrentUserId();
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.battleData = null;
        this.timer = null;
    }

    /**
     * 初始化对战
     */
    async init() {
        console.log('🎮 初始化PK对战:', this.battleId);

        try {
            // 1. 加载对战数据
            await this.loadBattleData();

            // 2. 【新增】渲染双方Avatar到状态栏
            await this.renderAvatars();

            // 3. 加载题目列表
            await this.loadQuestions();

            // 4. 显示第一题
            await this.showQuestion(0);

            // 5. 启动计时器
            this.startTimer();

            // 6. 建立WebSocket连接（实时同步对手进度）
            this.connectWebSocket();

        } catch (error) {
            console.error('❌ 初始化失败', error);
            alert('初始化失败：' + error.message);
            window.location.href = 'pk-arena.html';
        }
    }

    /**
     * 加载对战数据
     */
    async loadBattleData() {
        const response = await fetch(`/api/pk/battles/${this.battleId}`, {
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });

        const result = await response.json();

        if (result.code !== 200) {
            throw new Error(result.message);
        }

        this.battleData = result.data;

        // 更新UI
        document.getElementById('player1Name').textContent = this.battleData.player1Name;
        document.getElementById('player2Name').textContent = this.battleData.player2Name;
        document.getElementById('totalQuestions').textContent = this.battleData.totalQuestions;
        document.getElementById('totalQuestions2').textContent = this.battleData.totalQuestions;
        document.getElementById('totalQuestionsHeader').textContent = this.battleData.totalQuestions;
    }

    /**
     * 【新增】渲染双方Avatar
     */
    async renderAvatars() {
        console.log('🎨 渲染对战Avatar...');

        try {
            // 并行渲染双方Avatar（小尺寸，50×65）
            await Promise.all([
                renderPlayerAvatar('player1AvatarCanvas', this.battleData.player1Id, 50, 65),
                renderPlayerAvatar('player2AvatarCanvas', this.battleData.player2Id, 50, 65)
            ]);

            console.log('✅ Avatar渲染完成');

        } catch (error) {
            console.error('❌ Avatar渲染失败', error);
            // 不影响核心流程
        }
    }

    /**
     * 加载题目列表
     */
    async loadQuestions() {
        const response = await fetch(`/api/pk/battles/${this.battleId}/questions`, {
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });

        const result = await response.json();

        if (result.code !== 200) {
            throw new Error(result.message);
        }

        this.questions = result.data;
        console.log(`📚 加载了 ${this.questions.length} 道题目`);
    }

    // ==================== 示例2: 显示题目（反作弊集成） ====================

    /**
     * 显示指定题目
     * @param {number} index - 题目索引（0-based）
     */
    async showQuestion(index) {
        if (index < 0 || index >= this.questions.length) {
            console.error('题目索引越界:', index);
            return;
        }

        this.currentQuestionIndex = index;
        const question = this.questions[index];

        console.log(`📝 显示题目 ${index + 1}/${this.questions.length}:`, question);

        // 【新增】记录题目开始时间（用于反作弊检测）
        await this.recordQuestionStart(index);

        // 更新题目编号
        document.getElementById('currentQuestionNumber').textContent = index + 1;

        // 更新题目难度
        document.getElementById('questionDifficulty').textContent = getDifficultyBadge(question.difficulty);

        // 更新题目类型
        document.getElementById('questionType').textContent = getTypeBadge(question.type);

        // 渲染题目内容（HTML）
        const questionContent = document.getElementById('questionContent');
        questionContent.innerHTML = DOMPurify.sanitize(question.content);

        // 代码高亮
        questionContent.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });

        // 渲染选项
        this.renderOptions(question.options);

        // 启用/禁用按钮
        document.getElementById('prevQuestionBtn').disabled = (index === 0);
        document.getElementById('submitAnswerBtn').disabled = true; // 需要选择后才能提交

        // 清除之前的选择
        this.selectedAnswer = null;
    }

    /**
     * 【新增】记录题目开始时间（反作弊）
     */
    async recordQuestionStart(questionIndex) {
        try {
            await fetch('/api/pk/anticheat/question-start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getToken()
                },
                body: JSON.stringify({
                    battleId: this.battleId,
                    userId: this.currentUserId,
                    questionIndex: questionIndex
                })
            });

            console.log(`⏱️ 已记录题目 ${questionIndex} 开始时间`);

        } catch (error) {
            console.error('记录题目开始时间失败', error);
            // 不阻断主流程
        }
    }

    // ==================== 示例3: 提交答案（反作弊验证） ====================

    /**
     * 提交答案
     */
    async submitAnswer() {
        if (!this.selectedAnswer) {
            alert('请先选择答案！');
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const answerTime = this.getQuestionElapsedTime();

        console.log(`✅ 提交答案: 题目=${this.currentQuestionIndex}, 答案=${this.selectedAnswer}, 耗时=${answerTime}秒`);

        // 禁用提交按钮（防止重复提交）
        const submitBtn = document.getElementById('submitAnswerBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';

        try {
            // 调用API提交答案（服务端会自动进行反作弊验证）
            const response = await fetch(`/api/pk/battles/${this.battleId}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + getToken()
                },
                body: JSON.stringify({
                    questionId: question.id,
                    questionIndex: this.currentQuestionIndex,
                    userId: this.currentUserId,
                    userAnswer: this.selectedAnswer,
                    correctAnswer: question.answer, // 注意：后续应该移除此参数，改为服务端验证
                    answerTime: answerTime
                })
            });

            const result = await response.json();

            if (result.code === 200) {
                const isCorrect = result.data.isCorrect;

                // 显示答题结果
                this.showAnswerResult(isCorrect);

                // 更新进度
                this.updateProgress();

                // 1秒后自动跳到下一题
                setTimeout(() => {
                    if (this.currentQuestionIndex < this.questions.length - 1) {
                        this.showQuestion(this.currentQuestionIndex + 1);
                    } else {
                        // 所有题目答完，结束对战
                        this.endBattle();
                    }
                }, 1500);

            } else if (result.code === 403) {
                // 反作弊拦截
                alert('⚠️ ' + result.message);
                submitBtn.disabled = false;
                submitBtn.textContent = '提交答案 →';

            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ 提交答案失败', error);
            alert('提交失败：' + error.message);

            submitBtn.disabled = false;
            submitBtn.textContent = '提交答案 →';
        }
    }

    /**
     * 显示答题结果
     */
    showAnswerResult(isCorrect) {
        const options = document.querySelectorAll('.pk-option');

        options.forEach(option => {
            const value = option.dataset.value;
            const question = this.questions[this.currentQuestionIndex];

            if (value === question.answer) {
                // 正确答案 - 绿色
                option.classList.add('correct');
            } else if (value === this.selectedAnswer) {
                // 用户错误选择 - 红色
                option.classList.add('incorrect');
            }

            // 禁用所有选项
            option.style.pointerEvents = 'none';
        });

        // 显示提示信息
        const resultDiv = document.createElement('div');
        resultDiv.className = isCorrect ? 'pk-result-correct' : 'pk-result-incorrect';
        resultDiv.textContent = isCorrect ? '✅ 回答正确！+15分' : '❌ 回答错误';

        const container = document.getElementById('questionContainer');
        container.appendChild(resultDiv);
    }

    /**
     * 更新进度
     */
    updateProgress() {
        const answeredCount = this.currentQuestionIndex + 1;
        const totalCount = this.questions.length;
        const progressPercent = (answeredCount / totalCount) * 100;

        document.getElementById('player1Progress').textContent = answeredCount;
        document.getElementById('myProgress').style.width = progressPercent + '%';
    }

    /**
     * 获取题目已用时间（秒）
     */
    getQuestionElapsedTime() {
        // 实际实现需要记录题目显示时间
        // 这里简化为固定值
        return 5;
    }

    // ==================== 其他方法 ====================

    /**
     * 渲染选项
     */
    renderOptions(options) {
        const optionsList = document.getElementById('optionsList');
        optionsList.innerHTML = '';

        options.forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'pk-option';
            optionDiv.dataset.value = option.key;
            optionDiv.innerHTML = `
                <span class="pk-option-label">${option.key}</span>
                <span class="pk-option-text">${option.text}</span>
            `;

            optionDiv.addEventListener('click', () => {
                this.selectOption(option.key);
            });

            optionsList.appendChild(optionDiv);
        });
    }

    /**
     * 选择选项
     */
    selectOption(key) {
        // 移除其他选项的选中状态
        document.querySelectorAll('.pk-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // 选中当前选项
        const selectedOption = document.querySelector(`.pk-option[data-value="${key}"]`);
        selectedOption.classList.add('selected');

        this.selectedAnswer = key;

        // 启用提交按钮
        document.getElementById('submitAnswerBtn').disabled = false;
    }

    /**
     * 启动计时器
     */
    startTimer() {
        let seconds = 0;
        const maxTime = 20 * 60; // 20分钟

        this.timer = setInterval(() => {
            seconds++;

            const remaining = maxTime - seconds;
            const minutes = Math.floor(remaining / 60);
            const secs = remaining % 60;

            document.getElementById('battleTimer').textContent =
                `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (remaining <= 0) {
                clearInterval(this.timer);
                this.endBattle();
            }
        }, 1000);
    }

    /**
     * 结束对战
     */
    async endBattle() {
        console.log('🏁 对战结束');

        clearInterval(this.timer);

        try {
            const response = await fetch(`/api/pk/battles/${this.battleId}/end`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getToken()
                }
            });

            const result = await response.json();

            if (result.code === 200) {
                // 跳转到结果页面
                window.location.href = `pk-result.html?battleId=${this.battleId}`;
            }

        } catch (error) {
            console.error('结束对战失败', error);
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        // 关闭WebSocket连接
        if (this.ws) {
            this.ws.close();
        }
    }
}

// ==================== 工具函数 ====================

function getDifficultyBadge(difficulty) {
    const badges = {
        'EASY': '🟢 简单',
        'MEDIUM': '🟡 中等',
        'HARD': '🔴 困难',
        'EXPERT': '⚫ 专家'
    };
    return badges[difficulty] || '🟡 中等';
}

function getTypeBadge(type) {
    const badges = {
        'SINGLE_CHOICE': '单选题',
        'MULTIPLE_CHOICE': '多选题',
        'TRUE_FALSE': '判断题',
        'CODE': '代码题'
    };
    return badges[type] || '单选题';
}

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getCurrentUserId() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
    }
    return null;
}

// ==================== 导出 ====================

export { PKBattle };
