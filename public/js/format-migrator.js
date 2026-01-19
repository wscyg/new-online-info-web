/**
 * Format Migrator - 课程JSON格式转换器
 * 支持旧格式（v1.0）自动转换为新格式（v2.0）
 *
 * v1.0 格式: pages[].type + pages[].content
 * v2.0 格式: pages[].kind + pages[].header + pages[].blocks
 */
(function() {
    'use strict';

    const FormatMigrator = {
        VERSION: '1.0.0',

        /**
         * 检测JSON格式版本
         * @param {Object} json - 课程配置对象
         * @returns {string} - '1.0' | '2.0' | 'unknown'
         */
        detectVersion(json) {
            if (!json || typeof json !== 'object') return 'unknown';

            // 明确标记的版本
            if (json.version === '2.0') return '2.0';

            // 检查pages结构
            const pages = json.pages;
            if (!Array.isArray(pages) || pages.length === 0) return 'unknown';

            const firstPage = pages[0];
            if (!firstPage) return 'unknown';

            // v2.0 特征: 有 blocks 数组或 header 对象
            if (Array.isArray(firstPage.blocks) || firstPage.header) return '2.0';

            // v1.0 特征: 有 type 和 content
            if (firstPage.type && firstPage.content) return '1.0';

            return 'unknown';
        },

        /**
         * 自动转换为v2.0格式（如果需要）
         * @param {Object} json - 课程配置对象
         * @returns {Object} - v2.0格式的配置对象
         */
        ensureV2(json) {
            const version = this.detectVersion(json);
            if (version === '2.0') return json;
            if (version === '1.0') return this.migrateV1ToV2(json);
            // unknown 格式尝试作为v2.0处理
            return { ...json, version: '2.0' };
        },

        /**
         * 将v1.0格式转换为v2.0格式
         * @param {Object} oldJson - v1.0格式配置
         * @returns {Object} - v2.0格式配置
         */
        migrateV1ToV2(oldJson) {
            return {
                version: '2.0',
                id: oldJson.id || this.generateId(),
                title: oldJson.title || '未命名课程',
                subtitle: oldJson.subtitle || '',
                templateId: this.themeToTemplateId(oldJson.theme),
                accent: this.themeToAccent(oldJson.theme),
                metadata: {
                    migratedFrom: '1.0',
                    migratedAt: new Date().toISOString(),
                    originalTheme: oldJson.theme
                },
                pages: (oldJson.pages || []).map((page, idx) =>
                    this.migratePageV1ToV2(page, idx)
                )
            };
        },

        /**
         * 转换单个页面
         * @param {Object} page - v1.0页面对象
         * @param {number} index - 页面索引
         * @returns {Object} - v2.0页面对象
         */
        migratePageV1ToV2(page, index) {
            const isHero = page.type === 'hero';
            const content = page.content || {};

            const newPage = {
                id: page.id || `p-${index}`,
                kind: isHero ? 'hero' : 'section',
                accent: 'cyan'
            };

            // 转换 header
            if (isHero) {
                newPage.header = {
                    badgeHtml: content.badge ?
                        `<span class="hero-badge"><span class="hero-badge-dot"></span>${this.escapeHtml(content.badge)}</span>` : '',
                    title: content.title || '',
                    subtitle: content.subtitle || '',
                    extraHtml: ''
                };
            } else {
                newPage.header = {
                    label: content.sectionLabel || '',
                    title: content.sectionTitle || content.title || '',
                    descHtml: content.description || ''
                };
            }

            // 转换 content 到 blocks
            newPage.blocks = this.contentToBlocks(content, page.type);

            return newPage;
        },

        /**
         * 将v1.0的content对象转换为blocks数组
         * @param {Object} content - v1.0 content对象
         * @param {string} pageType - 页面类型
         * @returns {Array} - blocks数组
         */
        contentToBlocks(content, pageType) {
            const blocks = [];
            if (!content) return blocks;

            // 卡片网格
            if (content.cardsGrid && Array.isArray(content.cardsGrid)) {
                blocks.push({
                    type: 'html',
                    html: this.renderCardsGridHtml(content.cardsGrid)
                });
            }

            // 公式框
            if (content.formulaBox) {
                blocks.push({
                    type: 'callout',
                    title: content.formulaBox.label || '公式',
                    tag: 'Formula',
                    bodyHtml: `<div class="formula">${content.formulaBox.formula || ''}</div>${content.formulaBox.explanation ? `<p>${content.formulaBox.explanation}</p>` : ''}`
                });
            }

            // 便签
            if (content.stickyNote) {
                blocks.push({
                    type: 'callout',
                    title: content.stickyNote.title || '',
                    tag: 'Note',
                    bodyHtml: `<p>${this.escapeHtml(content.stickyNote.content || content.stickyNote.text || '')}</p>`
                });
            }

            // 时间线
            if (content.timeline && Array.isArray(content.timeline)) {
                blocks.push({
                    type: 'html',
                    html: this.renderTimelineHtml(content.timeline)
                });
            }

            // 要点列表
            if (content.keyPoints && Array.isArray(content.keyPoints)) {
                blocks.push({
                    type: 'accordion',
                    summary: content.keyPointsTitle || '要点',
                    badge: 'Key',
                    open: true,
                    contentHtml: `<ul>${content.keyPoints.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}</ul>`
                });
            }

            // 代码块
            if (content.code) {
                blocks.push({
                    type: 'codeBlock',
                    file: content.language || 'code',
                    code: content.code
                });
            }

            // 段落文本
            if (content.text || content.paragraph) {
                blocks.push({
                    type: 'prose',
                    paragraphs: [content.text || content.paragraph]
                });
            }

            // SVG/图表
            if (content.svg || content.diagram) {
                blocks.push({
                    type: 'html',
                    html: content.svg || content.diagram
                });
            }

            return blocks;
        },

        /**
         * 渲染卡片网格HTML
         */
        renderCardsGridHtml(cards) {
            const cardsHtml = cards.map(card => `
                <div class="content-card">
                    <div class="card-icon ${card.iconClass || ''}">${this.escapeHtml(card.icon || '')}</div>
                    <div class="card-title">${this.escapeHtml(card.title || '')}</div>
                    ${card.subtitle ? `<div class="card-subtitle">${this.escapeHtml(card.subtitle)}</div>` : ''}
                    ${card.description ? `<div class="card-desc">${this.escapeHtml(card.description)}</div>` : ''}
                </div>
            `).join('');
            return `<div class="cards-grid">${cardsHtml}</div>`;
        },

        /**
         * 渲染时间线HTML
         */
        renderTimelineHtml(items) {
            const itemsHtml = items.map(item => `
                <div class="timeline-item">
                    <div class="timeline-year">${this.escapeHtml(item.year || '')}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${this.escapeHtml(item.title || '')}</div>
                        ${item.description ? `<div class="timeline-desc">${this.escapeHtml(item.description)}</div>` : ''}
                    </div>
                </div>
            `).join('');
            return `<div class="timeline">${itemsHtml}</div>`;
        },

        /**
         * theme转templateId
         */
        themeToTemplateId(theme) {
            const map = {
                'star-purple': 'chapter2',
                'ocean-blue': 'chapter2',
                'forest-green': 'chapter2',
                'sunset-orange': 'chapter2'
            };
            return map[theme] || 'chapter2';
        },

        /**
         * theme转accent
         */
        themeToAccent(theme) {
            const map = {
                'star-purple': 'purple',
                'ocean-blue': 'cyan',
                'forest-green': 'green',
                'sunset-orange': 'amber'
            };
            return map[theme] || 'cyan';
        },

        /**
         * 生成唯一ID
         */
        generateId() {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 4).toUpperCase();
            return `CHAP-${timestamp.slice(-4)}${random}`;
        },

        /**
         * HTML转义
         */
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        /**
         * 创建默认的v2.0格式章节配置
         * @param {Object} options - 配置选项
         * @returns {Object} - v2.0格式配置
         */
        createDefaultConfig(options = {}) {
            const id = options.id || this.generateId();
            return {
                version: '2.0',
                id: id,
                title: options.title || '新章节',
                subtitle: options.subtitle || '',
                templateId: options.templateId || 'chapter2',
                accent: options.accent || 'cyan',
                pages: [
                    {
                        id: 'p-hero',
                        kind: 'hero',
                        accent: options.accent || 'cyan',
                        header: {
                            badgeHtml: `<span class="hero-badge"><span class="hero-badge-dot"></span>${this.escapeHtml(options.badge || '新章节')}</span>`,
                            title: options.title || '新章节',
                            subtitle: options.subtitle || '副标题',
                            extraHtml: ''
                        },
                        blocks: [
                            {
                                type: 'bridgeRow',
                                prevLabel: '上一页',
                                prev: '—',
                                currentLabel: '本页',
                                current: options.title || '新章节',
                                nextLabel: '下一页',
                                next: '待续'
                            },
                            {
                                type: 'microLead',
                                text: '本页路线：① 了解基本概念 ② 查看示例 ③ 动手实践'
                            }
                        ]
                    }
                ]
            };
        }
    };

    // 导出到全局
    window.FormatMigrator = FormatMigrator;

})();
