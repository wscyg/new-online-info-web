/**
 * 卡片播放器引擎 - CardPlayer.js
 * 功能：沉浸式卡片学习体验
 * - 从后端API加载卡片数据
 * - 卡片渲染与动画效果
 * - 键盘控制翻页
 * - 自动可视化元素处理
 */

class CardPlayer {
    constructor(chapterId) {
        this.chapterId = chapterId;
        this.cards = [];
        this.currentIndex = 0;
        this.isLoading = false;

        // API配置
        this.apiBaseUrl = '/api';

        // DOM元素
        this.cardTitle = document.getElementById('cardTitle');
        this.cardHtml = document.getElementById('cardHtml');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.pageIndicator = document.getElementById('pageIndicator');
        this.progressBar = document.getElementById('progressBar');

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 初始化播放器
     */
    async init() {
        console.log(`[CardPlayer] Initializing with chapter ID: ${this.chapterId}`);

        try {
            await this.loadCards();

            if (this.cards.length > 0) {
                this.renderCard(0);
            } else {
                this.showError('该章节暂无卡片内容');
            }
        } catch (error) {
            console.error('[CardPlayer] Initialization failed:', error);
            this.showError('加载失败: ' + error.message);
        }
    }

    /**
     * 从后端API加载卡片数据
     */
    async loadCards() {
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/cards/chapters/${this.chapterId}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || '加载失败');
            }

            this.cards = result.data.cards;
            console.log(`[CardPlayer] Successfully loaded ${this.cards.length} cards`);

        } catch (error) {
            console.error('[CardPlayer] Failed to load cards:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 渲染指定索引的卡片
     */
    renderCard(index) {
        if (index < 0 || index >= this.cards.length) {
            console.warn('卡片索引越界:', index);
            return;
        }

        const card = this.cards[index];
        this.currentIndex = index;

        console.log(`[CardPlayer] Rendering card ${index + 1}/${this.cards.length}: ${card.title}`);

        // 1. 清空容器（淡出动画）
        gsap.to([this.cardTitle, this.cardHtml], {
            opacity: 0,
            y: -30,
            duration: 0.3,
            onComplete: () => {
                // 2. 更新内容
                this.cardTitle.textContent = card.title;
                this.cardHtml.innerHTML = card.htmlContent;

                // 3. 处理特殊卡片类型
                this.handleCardType(card);

                // 4. 入场动画（GSAP Stagger Effect）
                gsap.from(this.cardTitle, {
                    y: 50,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power3.out'
                });

                gsap.from(this.cardHtml.children, {
                    y: 30,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.1, // 依次出现效果
                    ease: 'power2.out',
                    delay: 0.2
                });

                // 5. 滚动到顶部
                document.getElementById('cardContainer').scrollTop = 0;
            }
        });

        // 6. 更新UI状态
        this.updateUI();
    }

    /**
     * 处理不同类型的卡片
     */
    handleCardType(card) {
        const { type } = card;

        switch (type) {
            case 'viz':
                // 可视化卡片：初始化Canvas或SVG
                this.initVisualization();
                break;

            case 'summary':
                // 总结卡片：添加特殊样式
                this.cardHtml.classList.add('summary-card');
                break;

            case 'read':
            default:
                // 普通阅读卡片
                break;
        }
    }

    /**
     * 初始化可视化效果（占位示例）
     */
    initVisualization() {
        // 查找是否有canvas元素
        const canvas = this.cardHtml.querySelector('canvas');

        if (canvas) {
            console.log('[CardPlayer] Canvas element detected, initializing visualization...');
            // 这里可以添加Three.js、D3.js等可视化库的初始化代码
            // 示例：简单的粒子背景
            this.drawSimpleParticles(canvas);
        }
    }

    /**
     * 绘制简单的粒子背景（Canvas示例）
     */
    drawSimpleParticles(canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight || 400;

        const particles = [];
        const particleCount = 50;

        // 创建粒子
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 3 + 1
            });
        }

        // 动画循环
        function animate() {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                // 绘制粒子
                ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // 更新位置
                p.x += p.vx;
                p.y += p.vy;

                // 边界反弹
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            requestAnimationFrame(animate);
        }

        animate();
    }

    /**
     * 上一页
     */
    prev() {
        if (this.currentIndex > 0) {
            this.renderCard(this.currentIndex - 1);
        }
    }

    /**
     * 下一页
     */
    next() {
        if (this.currentIndex < this.cards.length - 1) {
            this.renderCard(this.currentIndex + 1);
        }
    }

    /**
     * 更新UI状态（按钮、进度条、页码）
     */
    updateUI() {
        // 更新按钮状态
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex === this.cards.length - 1;

        // 更新页码
        this.pageIndicator.textContent = `${this.currentIndex + 1} / ${this.cards.length}`;

        // 更新进度条
        const progress = ((this.currentIndex + 1) / this.cards.length) * 100;
        this.progressBar.style.width = `${progress}%`;
    }

    /**
     * 绑定事件监听
     */
    bindEvents() {
        // 按钮点击事件
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    this.prev();
                    break;

                case 'ArrowRight':
                case 'ArrowDown':
                case ' ': // 空格键
                    e.preventDefault();
                    this.next();
                    break;

                case 'Home':
                    e.preventDefault();
                    this.renderCard(0);
                    break;

                case 'End':
                    e.preventDefault();
                    this.renderCard(this.cards.length - 1);
                    break;
            }
        });

        // 触摸滑动支持（移动端）
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        const handleSwipe = () => {
            if (touchEndX < touchStartX - 50) {
                // 向左滑动 - 下一页
                this.next();
            }
            if (touchEndX > touchStartX + 50) {
                // 向右滑动 - 上一页
                this.prev();
            }
        };

        this.handleSwipe = handleSwipe;
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        this.cardTitle.textContent = '加载中...';
        this.cardHtml.innerHTML = '<div class="loading-spinner"></div>';
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        this.cardTitle.textContent = '加载失败';
        this.cardHtml.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="font-size: 1.2rem; color: var(--text-secondary);">${message}</p>
                <button onclick="window.location.reload()"
                        style="margin-top: 1.5rem; padding: 12px 24px;
                               background: var(--accent);
                               border: 1px solid var(--accent);
                               border-radius: 980px; cursor: pointer;
                               color: #fff; font-size: 15px;
                               font-family: var(--font-sans);
                               transition: all 0.2s ease;">
                    重新加载
                </button>
            </div>
        `;
    }
}

// 导出供全局使用
window.CardPlayer = CardPlayer;
