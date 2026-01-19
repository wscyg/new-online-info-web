/**
 * 课程内容渲染引擎
 * 将JSON格式的课程数据渲染为交互式HTML页面
 */

class CourseRenderer {
    constructor(options = {}) {
        this.options = {
            container: null,
            enableAnimations: true,
            enableNavigation: true,
            onPageChange: null,
            onQuizAnswer: null,
            onProgress: null,
            ...options
        };

        this.currentPage = 0;
        this.totalPages = 0;
        this.courseData = null;
        this.flatPages = [];
        this.isAnimating = false;

        // 组件渲染器映射
        this.componentRenderers = {
            'hero': this.renderHero.bind(this),
            'section': this.renderSection.bind(this),
            'heading': this.renderHeading.bind(this),
            'paragraph': this.renderParagraph.bind(this),
            'text': this.renderText.bind(this),  // 简化格式支持
            'highlight': this.renderHighlight.bind(this),
            'cards-grid': this.renderCardsGrid.bind(this),
            'card': this.renderCard.bind(this),
            'glass-card': this.renderGlassCard.bind(this),
            'sticky-note': this.renderStickyNote.bind(this),
            'formula': this.renderFormula.bind(this),
            'formula-box': this.renderFormulaBox.bind(this),
            'code-block': this.renderCodeBlock.bind(this),
            'diagram': this.renderDiagram.bind(this),
            'svg': this.renderSvg.bind(this),
            'timeline': this.renderTimeline.bind(this),
            'comparison': this.renderComparison.bind(this),
            'two-column': this.renderTwoColumn.bind(this),
            'quiz': this.renderQuiz.bind(this),
            'image': this.renderImage.bind(this),
            'video': this.renderVideo.bind(this),
            'quote': this.renderQuote.bind(this),
            'callout': this.renderCallout.bind(this),
            'divider': this.renderDivider.bind(this),
            'spacer': this.renderSpacer.bind(this),
            'typing-text': this.renderTypingText.bind(this),
            'socratic-dialogue': this.renderSocraticDialogue.bind(this),
            'experiment': this.renderExperiment.bind(this),
            'key-points': this.renderKeyPoints.bind(this),
            'navigation-hint': this.renderNavigationHint.bind(this),
            'reveal': this.renderReveal.bind(this)
        };
    }

    /**
     * 加载并渲染课程
     */
    async render(courseData, container) {
        this.courseData = courseData;
        this.container = container || this.options.container;

        if (!this.container) {
            throw new Error('Container element is required');
        }

        // 扁平化所有页面
        this.flattenPages();
        this.totalPages = this.flatPages.length;

        // 创建主容器结构
        this.createMainStructure();

        // 渲染所有页面
        this.renderAllPages();

        // 初始化导航
        if (this.options.enableNavigation) {
            this.initNavigation();
        }

        // 显示第一页
        this.goToPage(0);

        return this;
    }

    /**
     * 扁平化章节中的所有页面
     */
    flattenPages() {
        this.flatPages = [];

        // 格式1: 带 chapters 的嵌套结构
        if (this.courseData.chapters) {
            this.courseData.chapters.forEach((chapter, chapterIndex) => {
                if (chapter.pages) {
                    chapter.pages.forEach((page, pageIndex) => {
                        this.flatPages.push({
                            ...page,
                            chapterIndex,
                            chapterTitle: chapter.title,
                            pageIndex,
                            globalIndex: this.flatPages.length
                        });
                    });
                }
            });
        }
        // 格式2: 直接的 pages 数组（扁平结构）
        else if (this.courseData.pages) {
            this.courseData.pages.forEach((page, pageIndex) => {
                this.flatPages.push({
                    ...page,
                    chapterIndex: 0,
                    chapterTitle: this.courseData.title || '课程',
                    pageIndex,
                    globalIndex: pageIndex
                });
            });
        }
    }

    /**
     * 创建主容器结构
     */
    createMainStructure() {
        this.container.innerHTML = '';
        this.container.classList.add('course-container');

        // 页面容器
        this.pagesContainer = document.createElement('div');
        this.pagesContainer.className = 'course-pages';
        this.container.appendChild(this.pagesContainer);

        // 进度条
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'course-progress';
        this.progressBar.innerHTML = '<div class="course-progress-fill"></div>';
        this.container.appendChild(this.progressBar);

        // 导航按钮
        this.navContainer = document.createElement('div');
        this.navContainer.className = 'course-nav';
        this.navContainer.innerHTML = `
            <button class="nav-btn nav-prev" aria-label="上一页">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
            <div class="nav-info">
                <span class="nav-current">1</span> / <span class="nav-total">${this.totalPages}</span>
            </div>
            <button class="nav-btn nav-next" aria-label="下一页">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        `;
        this.container.appendChild(this.navContainer);

        // 章节目录
        this.tocContainer = document.createElement('div');
        this.tocContainer.className = 'course-toc';
        this.renderTableOfContents();
        this.container.appendChild(this.tocContainer);
    }

    /**
     * 渲染目录
     */
    renderTableOfContents() {
        let html = '<div class="toc-toggle"><span>目录</span></div><div class="toc-content">';

        // 格式1: 带 chapters 的嵌套结构
        if (this.courseData.chapters) {
            this.courseData.chapters.forEach((chapter, chapterIndex) => {
                html += `<div class="toc-chapter">
                    <div class="toc-chapter-title">${chapter.title}</div>
                    <div class="toc-pages">`;

                chapter.pages.forEach((page, pageIndex) => {
                    const globalIndex = this.flatPages.findIndex(
                        p => p.chapterIndex === chapterIndex && p.pageIndex === pageIndex
                    );
                    html += `<div class="toc-page" data-page="${globalIndex}">
                        ${page.title || `第 ${pageIndex + 1} 页`}
                    </div>`;
                });

                html += '</div></div>';
            });
        }
        // 格式2: 直接的 pages 数组
        else if (this.courseData.pages) {
            html += `<div class="toc-chapter">
                <div class="toc-chapter-title">${this.courseData.title || '课程'}</div>
                <div class="toc-pages">`;

            this.courseData.pages.forEach((page, pageIndex) => {
                html += `<div class="toc-page" data-page="${pageIndex}">
                    ${page.title || `第 ${pageIndex + 1} 页`}
                </div>`;
            });

            html += '</div></div>';
        }

        html += '</div>';
        this.tocContainer.innerHTML = html;
    }

    /**
     * 渲染所有页面
     */
    renderAllPages() {
        this.flatPages.forEach((page, index) => {
            const pageEl = document.createElement('div');
            pageEl.className = `course-page ${page.layout || 'default'}`;
            pageEl.dataset.page = index;

            if (page.background) {
                this.applyBackground(pageEl, page.background);
            }

            // 渲染页面内的所有组件（支持 components 或 elements）
            const contentEl = document.createElement('div');
            contentEl.className = 'page-content';

            // 兼容两种格式: components 或 elements
            const items = page.components || page.elements || [];
            items.forEach(item => {
                const componentEl = this.renderComponent(item);
                if (componentEl) {
                    contentEl.appendChild(componentEl);
                }
            });

            pageEl.appendChild(contentEl);
            this.pagesContainer.appendChild(pageEl);
        });
    }

    /**
     * 应用背景样式
     */
    applyBackground(element, background) {
        switch (background.type) {
            case 'color':
                element.style.backgroundColor = background.value;
                break;
            case 'gradient':
                element.style.background = background.value;
                break;
            case 'image':
                element.style.backgroundImage = `url(${background.value})`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                break;
            case 'pattern':
                element.classList.add(`pattern-${background.value}`);
                break;
        }
    }

    /**
     * 渲染单个组件
     */
    renderComponent(component) {
        const renderer = this.componentRenderers[component.type];
        if (!renderer) {
            console.warn(`Unknown component type: ${component.type}`);
            return null;
        }

        const el = renderer(component);
        if (!el) return null;

        // 添加通用属性
        if (component.id) el.id = component.id;
        if (component.className) el.classList.add(...component.className.split(' '));
        if (component.style) Object.assign(el.style, component.style);

        // 添加动画
        if (component.animation && this.options.enableAnimations) {
            this.applyAnimation(el, component.animation);
        }

        return el;
    }

    /**
     * 应用动画
     */
    applyAnimation(element, animation) {
        element.classList.add('animate-on-enter');
        element.dataset.animation = animation.type || 'fadeIn';
        if (animation.delay) element.dataset.animationDelay = animation.delay;
        if (animation.duration) element.dataset.animationDuration = animation.duration;
    }

    // ========== 组件渲染器 ==========

    renderHero(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-hero';

        el.innerHTML = `
            ${content.badge ? `<div class="hero-badge">${content.badge}</div>` : ''}
            <h1 class="hero-title">${content.title || ''}</h1>
            ${content.subtitle ? `<p class="hero-subtitle">${content.subtitle}</p>` : ''}
            ${content.description ? `<p class="hero-description">${content.description}</p>` : ''}
            ${content.particles ? '<div class="hero-particles"></div>' : ''}
        `;

        if (content.backgroundImage) {
            el.style.backgroundImage = `url(${content.backgroundImage})`;
        }

        return el;
    }

    renderSection(component) {
        const content = component.content || {};
        const el = document.createElement('section');
        el.className = 'component-section';

        if (content.title) {
            const titleEl = document.createElement('h2');
            titleEl.className = 'section-title';
            titleEl.textContent = content.title;
            el.appendChild(titleEl);
        }

        if (content.subtitle) {
            const subtitleEl = document.createElement('p');
            subtitleEl.className = 'section-subtitle';
            subtitleEl.textContent = content.subtitle;
            el.appendChild(subtitleEl);
        }

        if (content.children) {
            content.children.forEach(child => {
                const childEl = this.renderComponent(child);
                if (childEl) el.appendChild(childEl);
            });
        }

        return el;
    }

    renderHeading(component) {
        const content = component.content;
        // 支持简化格式: {type: "heading", content: "标题文本"}
        if (typeof content === 'string') {
            const el = document.createElement('h2');
            el.className = 'component-heading';
            el.textContent = content;
            return el;
        }
        // 复杂格式: {type: "heading", content: {level, icon, text}}
        const contentObj = content || {};
        const level = contentObj.level || 2;
        const el = document.createElement(`h${level}`);
        el.className = 'component-heading';

        if (contentObj.icon) {
            el.innerHTML = `<span class="heading-icon">${contentObj.icon}</span> `;
        }
        el.innerHTML += contentObj.text || '';

        return el;
    }

    renderParagraph(component) {
        const content = component.content;
        const el = document.createElement('p');
        el.className = 'component-paragraph';

        // 支持简化格式: {type: "paragraph", content: "段落文本"}
        if (typeof content === 'string') {
            el.textContent = content;
            return el;
        }
        // 复杂格式: {type: "paragraph", content: {html or text}}
        const contentObj = content || {};
        if (contentObj.html) {
            el.innerHTML = contentObj.html;
        } else {
            el.textContent = contentObj.text || '';
        }

        return el;
    }

    /**
     * 渲染文本组件 (简化API格式支持)
     */
    renderText(component) {
        const content = component.content;
        const el = document.createElement('p');
        el.className = 'component-text';

        if (typeof content === 'string') {
            el.textContent = content;
        } else if (content && content.text) {
            el.textContent = content.text;
        } else if (content && content.html) {
            el.innerHTML = content.html;
        }

        return el;
    }

    renderHighlight(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-highlight';
        el.innerHTML = content.html || content.text || '';
        return el;
    }

    renderCardsGrid(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-cards-grid';
        el.style.gridTemplateColumns = `repeat(${content.columns || 3}, 1fr)`;
        if (content.gap) el.style.gap = content.gap;

        if (content.cards) {
            content.cards.forEach(card => {
                const cardEl = this.renderCard({ content: card });
                if (cardEl) el.appendChild(cardEl);
            });
        }

        return el;
    }

    renderCard(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = `component-card ${content.variant || 'default'}`;

        if (content.color) {
            el.style.setProperty('--card-color', content.color);
        }

        el.innerHTML = `
            ${content.icon || content.emoji ? `<div class="card-icon">${content.icon || content.emoji}</div>` : ''}
            ${content.title ? `<h3 class="card-title">${content.title}</h3>` : ''}
            ${content.subtitle ? `<p class="card-subtitle">${content.subtitle}</p>` : ''}
            ${content.description || content.content ? `<p class="card-content">${content.description || content.content}</p>` : ''}
        `;

        if (content.link) {
            el.style.cursor = 'pointer';
            el.onclick = () => window.location.href = content.link;
        }

        return el;
    }

    renderGlassCard(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-glass-card';

        el.innerHTML = `
            ${content.icon ? `<div class="glass-icon">${content.icon}</div>` : ''}
            ${content.title ? `<h3 class="glass-title">${content.title}</h3>` : ''}
            ${content.content || content.description ? `<p class="glass-content">${content.content || content.description}</p>` : ''}
        `;

        return el;
    }

    renderStickyNote(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = `component-sticky-note ${content.color || 'yellow'}`;

        if (content.rotation) {
            el.style.transform = `rotate(${content.rotation}deg)`;
        }

        el.innerHTML = `
            ${content.icon ? `<div class="sticky-icon">${content.icon}</div>` : ''}
            ${content.title ? `<div class="sticky-title">${content.title}</div>` : ''}
            <div class="sticky-text">${content.text || ''}</div>
        `;

        return el;
    }

    renderFormula(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-formula';

        if (content.latex) {
            el.innerHTML = `<div class="formula-latex">${content.latex}</div>`;
            // 如果有 KaTeX 或 MathJax，可以在这里渲染
            if (window.katex) {
                try {
                    el.querySelector('.formula-latex').innerHTML =
                        window.katex.renderToString(content.latex, { throwOnError: false });
                } catch (e) {
                    console.warn('KaTeX render error:', e);
                }
            }
        } else if (content.html) {
            el.innerHTML = content.html;
        }

        return el;
    }

    renderFormulaBox(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-formula-box';

        let html = '';
        if (content.title) {
            html += `<div class="formula-box-title">${content.title}</div>`;
        }

        html += '<div class="formula-box-content">';
        if (content.latex) {
            html += `<div class="formula-main">${content.latex}</div>`;
        } else if (content.html) {
            html += content.html;
        }
        html += '</div>';

        if (content.explanation) {
            html += `<div class="formula-explanation">${content.explanation}</div>`;
        }

        if (content.parts && content.parts.length > 0) {
            html += '<div class="formula-parts">';
            content.parts.forEach(part => {
                html += `<div class="formula-part">
                    <span class="part-symbol">${part.symbol}</span>
                    <span class="part-desc">${part.description}</span>
                </div>`;
            });
            html += '</div>';
        }

        el.innerHTML = html;
        return el;
    }

    renderCodeBlock(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-code-block';

        let html = '';
        if (content.filename) {
            html += `<div class="code-header">
                <span class="code-filename">${content.filename}</span>
                <button class="code-copy" title="复制代码">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                </button>
            </div>`;
        }

        const code = this.escapeHtml(content.code || '');
        const lines = code.split('\n');

        html += `<pre class="code-pre" data-language="${content.language || 'text'}"><code>`;

        if (content.showLineNumbers !== false) {
            lines.forEach((line, index) => {
                const lineNum = index + 1;
                const isHighlighted = content.highlightLines?.includes(lineNum);
                html += `<span class="code-line${isHighlighted ? ' highlighted' : ''}">
                    <span class="line-number">${lineNum}</span>
                    <span class="line-content">${line}</span>
                </span>\n`;
            });
        } else {
            html += code;
        }

        html += '</code></pre>';

        if (content.runnable) {
            html += '<button class="code-run">运行代码</button>';
        }

        el.innerHTML = html;

        // 复制功能
        const copyBtn = el.querySelector('.code-copy');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content.code || '');
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 2000);
            };
        }

        return el;
    }

    renderDiagram(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-diagram';

        if (content.title) {
            el.innerHTML += `<div class="diagram-title">${content.title}</div>`;
        }

        const diagramContent = document.createElement('div');
        diagramContent.className = 'diagram-content';

        if (content.type === 'svg' || content.svg) {
            diagramContent.innerHTML = content.svg;
        } else if (content.type === 'mermaid' && content.mermaid) {
            diagramContent.className += ' mermaid';
            diagramContent.textContent = content.mermaid;
        } else if (content.src) {
            diagramContent.innerHTML = `<img src="${content.src}" alt="${content.caption || ''}" />`;
        }

        el.appendChild(diagramContent);

        if (content.caption) {
            el.innerHTML += `<div class="diagram-caption">${content.caption}</div>`;
        }

        return el;
    }

    renderSvg(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-svg';
        el.innerHTML = content.svg || '';
        return el;
    }

    renderTimeline(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = `component-timeline ${content.orientation || 'vertical'}`;

        if (content.title) {
            el.innerHTML = `<h3 class="timeline-title">${content.title}</h3>`;
        }

        const itemsHtml = (content.items || []).map((item, index) => `
            <div class="timeline-item" style="--item-index: ${index}; ${item.color ? `--item-color: ${item.color}` : ''}">
                <div class="timeline-marker">
                    ${item.icon || (index + 1)}
                </div>
                <div class="timeline-content">
                    ${item.year || item.date ? `<div class="timeline-date">${item.year || item.date}</div>` : ''}
                    <div class="timeline-item-title">${item.title || ''}</div>
                    ${item.description ? `<div class="timeline-desc">${item.description}</div>` : ''}
                </div>
            </div>
        `).join('');

        el.innerHTML += `<div class="timeline-items">${itemsHtml}</div>`;

        return el;
    }

    renderComparison(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-comparison';

        let html = '';
        if (content.title) {
            html += `<h3 class="comparison-title">${content.title}</h3>`;
        }

        html += `<table class="comparison-table">
            <thead>
                <tr>
                    <th></th>
                    <th>${content.leftTitle || '选项 A'}</th>
                    <th>${content.rightTitle || '选项 B'}</th>
                </tr>
            </thead>
            <tbody>`;

        (content.items || []).forEach(item => {
            html += `<tr>
                <td class="comparison-aspect">${item.aspect || ''}</td>
                <td>${item.left || ''}</td>
                <td>${item.right || ''}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        el.innerHTML = html;

        return el;
    }

    renderTwoColumn(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-two-column';

        const ratio = content.ratio || '1:1';
        const [left, right] = ratio.split(':').map(Number);
        el.style.gridTemplateColumns = `${left}fr ${right}fr`;

        const leftCol = document.createElement('div');
        leftCol.className = 'column-left';
        if (content.left) {
            const leftContent = this.renderComponent(content.left);
            if (leftContent) leftCol.appendChild(leftContent);
        }

        const rightCol = document.createElement('div');
        rightCol.className = 'column-right';
        if (content.right) {
            const rightContent = this.renderComponent(content.right);
            if (rightContent) rightCol.appendChild(rightContent);
        }

        el.appendChild(leftCol);
        el.appendChild(rightCol);

        return el;
    }

    renderQuiz(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-quiz';
        el.dataset.quizId = component.id || Math.random().toString(36).substr(2, 9);

        let html = '';
        if (content.title) {
            html += `<div class="quiz-title">${content.title}</div>`;
        }

        html += `<div class="quiz-question">${content.question || ''}</div>`;
        html += '<div class="quiz-options">';

        (content.options || []).forEach((option, index) => {
            const optionId = option.id || index;
            html += `<label class="quiz-option" data-option="${optionId}">
                <input type="${content.type === 'multiple' ? 'checkbox' : 'radio'}"
                       name="quiz-${el.dataset.quizId}" value="${optionId}">
                <span class="option-marker"></span>
                <span class="option-text">${option.text}</span>
            </label>`;
        });

        html += '</div>';

        if (content.hint) {
            html += `<div class="quiz-hint" style="display:none">
                <span class="hint-icon">💡</span> ${content.hint}
            </div>`;
        }

        html += `<div class="quiz-feedback" style="display:none"></div>`;
        html += `<button class="quiz-submit">提交答案</button>`;

        el.innerHTML = html;

        // 提交逻辑
        const submitBtn = el.querySelector('.quiz-submit');
        submitBtn.onclick = () => this.handleQuizSubmit(el, content);

        return el;
    }

    handleQuizSubmit(el, content) {
        const selected = Array.from(el.querySelectorAll('input:checked')).map(i => i.value);
        const feedback = el.querySelector('.quiz-feedback');

        let isCorrect = false;
        if (content.type === 'multiple') {
            const correctIds = content.options.filter(o => o.isCorrect).map(o => o.id?.toString() || content.options.indexOf(o).toString());
            isCorrect = selected.length === correctIds.length &&
                        selected.every(s => correctIds.includes(s));
        } else {
            const correctOption = content.options.find(o => o.isCorrect);
            const correctId = correctOption?.id?.toString() || content.options.indexOf(correctOption).toString();
            isCorrect = selected[0] === correctId;
        }

        feedback.style.display = 'block';
        feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.innerHTML = isCorrect
            ? `✓ 正确！${content.explanation ? `<br>${content.explanation}` : ''}`
            : `✗ 再想想...${content.explanation ? `<br>${content.explanation}` : ''}`;

        // 高亮正确/错误选项
        el.querySelectorAll('.quiz-option').forEach(opt => {
            const optId = opt.dataset.option;
            const optData = content.options.find((o, i) => (o.id?.toString() || i.toString()) === optId);
            if (optData?.isCorrect) {
                opt.classList.add('correct');
            } else if (selected.includes(optId)) {
                opt.classList.add('incorrect');
            }
        });

        if (this.options.onQuizAnswer) {
            this.options.onQuizAnswer({
                quizId: el.dataset.quizId,
                selected,
                isCorrect,
                points: isCorrect ? (content.points || 10) : 0
            });
        }
    }

    renderImage(component) {
        const content = component.content || {};
        const el = document.createElement('figure');
        el.className = 'component-image';

        el.innerHTML = `
            <img src="${content.src || ''}" alt="${content.alt || ''}"
                 ${content.width ? `width="${content.width}"` : ''}
                 ${content.height ? `height="${content.height}"` : ''} />
            ${content.caption ? `<figcaption>${content.caption}</figcaption>` : ''}
        `;

        return el;
    }

    renderVideo(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-video';

        el.innerHTML = `
            <video ${content.controls !== false ? 'controls' : ''}
                   ${content.autoplay ? 'autoplay muted' : ''}
                   ${content.poster ? `poster="${content.poster}"` : ''}>
                <source src="${content.src || ''}" type="video/mp4">
            </video>
        `;

        return el;
    }

    renderQuote(component) {
        const content = component.content || {};
        const el = document.createElement('blockquote');
        el.className = 'component-quote';

        el.innerHTML = `
            <p class="quote-text">${content.text || ''}</p>
            ${content.author ? `<cite class="quote-author">— ${content.author}${content.source ? `, ${content.source}` : ''}</cite>` : ''}
        `;

        return el;
    }

    renderCallout(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = `component-callout ${content.type || 'info'}`;

        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            success: '✓',
            error: '✗',
            tip: '💡'
        };

        el.innerHTML = `
            <div class="callout-icon">${icons[content.type] || icons.info}</div>
            <div class="callout-content">
                ${content.title ? `<div class="callout-title">${content.title}</div>` : ''}
                <div class="callout-text">${content.text || ''}</div>
            </div>
        `;

        return el;
    }

    renderDivider(component) {
        const el = document.createElement('hr');
        el.className = 'component-divider';
        return el;
    }

    renderSpacer(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-spacer';
        el.style.height = content.height || '2rem';
        return el;
    }

    renderTypingText(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-typing-text';
        el.dataset.text = content.text || '';
        el.dataset.speed = content.speed || 50;

        if (content.cursor) {
            el.classList.add('with-cursor');
        }

        return el;
    }

    renderSocraticDialogue(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-socratic';

        let html = '';
        if (content.title) {
            html += `<div class="socratic-title">${content.title}</div>`;
        }

        html += '<div class="socratic-dialogues">';
        (content.dialogues || []).forEach(dialogue => {
            html += `<div class="dialogue-item ${dialogue.role}">
                <div class="dialogue-avatar">${dialogue.role === 'teacher' ? '👨‍🏫' : '🧑‍🎓'}</div>
                <div class="dialogue-content">
                    <div class="dialogue-name">${dialogue.name || (dialogue.role === 'teacher' ? '老师' : '学生')}</div>
                    <div class="dialogue-text">${dialogue.text}</div>
                    ${dialogue.thought ? `<div class="dialogue-thought">💭 ${dialogue.thought}</div>` : ''}
                </div>
            </div>`;
        });
        html += '</div>';

        el.innerHTML = html;
        return el;
    }

    renderExperiment(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-experiment';

        let html = `
            <div class="experiment-header">
                <span class="experiment-icon">🔬</span>
                <span class="experiment-label">动手实验</span>
            </div>
        `;

        if (content.title) {
            html += `<div class="experiment-title">${content.title}</div>`;
        }

        if (content.description) {
            html += `<div class="experiment-desc">${content.description}</div>`;
        }

        if (content.steps && content.steps.length > 0) {
            html += '<div class="experiment-steps">';
            content.steps.forEach((step, index) => {
                html += `<div class="experiment-step">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-content">
                        <div class="step-instruction">${step.instruction}</div>
                        ${step.code ? `<pre class="step-code"><code>${this.escapeHtml(step.code)}</code></pre>` : ''}
                        ${step.expected ? `<div class="step-expected">预期结果：${step.expected}</div>` : ''}
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        if (content.conclusion) {
            html += `<div class="experiment-conclusion">
                <span class="conclusion-icon">📝</span>
                ${content.conclusion}
            </div>`;
        }

        el.innerHTML = html;
        return el;
    }

    renderKeyPoints(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-key-points';

        let html = `
            <div class="key-points-header">
                <span class="key-points-icon">${content.icon || '📌'}</span>
                <span class="key-points-title">${content.title || '重点总结'}</span>
            </div>
            <ul class="key-points-list">
        `;

        (content.points || []).forEach(point => {
            html += `<li class="key-point">${point}</li>`;
        });

        html += '</ul>';
        el.innerHTML = html;

        return el;
    }

    renderNavigationHint(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-nav-hint';
        el.innerHTML = `
            <div class="nav-hint-text">${content.text || '使用 ← → 键或点击箭头翻页'}</div>
            <div class="nav-hint-arrows">
                <span class="arrow-left">←</span>
                <span class="arrow-right">→</span>
            </div>
        `;
        return el;
    }

    renderReveal(component) {
        const content = component.content || {};
        const el = document.createElement('div');
        el.className = 'component-reveal';

        el.innerHTML = `
            <button class="reveal-trigger">${content.buttonText || '点击查看答案'}</button>
            <div class="reveal-content" style="display:none">
                ${content.html || content.text || ''}
            </div>
        `;

        el.querySelector('.reveal-trigger').onclick = function() {
            const revealContent = el.querySelector('.reveal-content');
            revealContent.style.display = revealContent.style.display === 'none' ? 'block' : 'none';
            this.textContent = revealContent.style.display === 'none'
                ? (content.buttonText || '点击查看答案')
                : (content.hideText || '收起');
        };

        return el;
    }

    // ========== 导航功能 ==========

    initNavigation() {
        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.nextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevPage();
            }
        });

        // 按钮导航
        this.navContainer.querySelector('.nav-prev').onclick = () => this.prevPage();
        this.navContainer.querySelector('.nav-next').onclick = () => this.nextPage();

        // 目录导航
        this.tocContainer.querySelector('.toc-toggle').onclick = () => {
            this.tocContainer.classList.toggle('open');
        };

        this.tocContainer.querySelectorAll('.toc-page').forEach(pageEl => {
            pageEl.onclick = () => {
                this.goToPage(parseInt(pageEl.dataset.page));
                this.tocContainer.classList.remove('open');
            };
        });
    }

    goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.totalPages || this.isAnimating) return;

        this.isAnimating = true;
        const oldPage = this.currentPage;
        this.currentPage = pageIndex;

        // 更新页面显示
        const pages = this.pagesContainer.querySelectorAll('.course-page');
        pages.forEach((page, index) => {
            page.classList.remove('active', 'prev', 'next');
            if (index === pageIndex) {
                page.classList.add('active');
                this.triggerPageAnimations(page);
            } else if (index < pageIndex) {
                page.classList.add('prev');
            } else {
                page.classList.add('next');
            }
        });

        // 更新导航信息
        this.navContainer.querySelector('.nav-current').textContent = pageIndex + 1;

        // 更新进度条
        const progress = ((pageIndex + 1) / this.totalPages) * 100;
        this.progressBar.querySelector('.course-progress-fill').style.width = `${progress}%`;

        // 更新目录高亮
        this.tocContainer.querySelectorAll('.toc-page').forEach(p => {
            p.classList.toggle('active', parseInt(p.dataset.page) === pageIndex);
        });

        // 回调
        if (this.options.onPageChange) {
            this.options.onPageChange({
                page: pageIndex,
                total: this.totalPages,
                pageData: this.flatPages[pageIndex]
            });
        }

        if (this.options.onProgress) {
            this.options.onProgress({
                current: pageIndex + 1,
                total: this.totalPages,
                percentage: progress
            });
        }

        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }

    triggerPageAnimations(pageEl) {
        const animatedElements = pageEl.querySelectorAll('.animate-on-enter');
        animatedElements.forEach((el, index) => {
            const animation = el.dataset.animation || 'fadeIn';
            const delay = el.dataset.animationDelay || (index * 100);
            const duration = el.dataset.animationDuration || 500;

            el.style.animationDelay = `${delay}ms`;
            el.style.animationDuration = `${duration}ms`;
            el.classList.add(`animate-${animation}`);

            // 打字效果
            if (el.classList.contains('component-typing-text')) {
                this.startTypingAnimation(el);
            }
        });
    }

    startTypingAnimation(el) {
        const text = el.dataset.text;
        const speed = parseInt(el.dataset.speed) || 50;
        el.textContent = '';

        let i = 0;
        const type = () => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        type();
    }

    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    prevPage() {
        this.goToPage(this.currentPage - 1);
    }

    // ========== 工具方法 ==========

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CourseRenderer;
}
window.CourseRenderer = CourseRenderer;
