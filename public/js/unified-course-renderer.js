/**
 * Unified Course Renderer - 统一课程渲染器
 * 将FormatMigrator和ChapterTemplateEngine结合，提供统一的渲染接口
 *
 * 依赖：
 * - window.FormatMigrator
 * - window.ChapterTemplateEngine
 */
(function() {
    'use strict';

    const UnifiedCourseRenderer = {
        VERSION: '1.0.0',

        // 缓存已加载的模版
        templateCache: {},

        // 模版清单缓存
        manifestCache: null,
        manifestCacheAt: 0,
        manifestCacheTTL: 24 * 60 * 60 * 1000,

        // 模版基础路径
        templateBasePath: '',

        /**
         * 初始化渲染器
         * @param {Object} options - 配置选项
         */
        init(options = {}) {
            this.templateBasePath = options.templateBasePath || '';
            if (options.manifestCacheTTL !== undefined) {
                this.manifestCacheTTL = options.manifestCacheTTL;
            }
            return this;
        },

        /**
         * 检查依赖是否已加载
         */
        checkDependencies() {
            if (!window.FormatMigrator) {
                throw new Error('UnifiedCourseRenderer: FormatMigrator not loaded');
            }
            if (!window.ChapterTemplateEngine) {
                throw new Error('UnifiedCourseRenderer: ChapterTemplateEngine not loaded');
            }
            return true;
        },

        /**
         * 加载模版清单
         * @returns {Promise<Object>}
         */
        async loadManifest() {
            if (this.manifestCache && this.manifestCacheAt && (Date.now() - this.manifestCacheAt) < this.manifestCacheTTL) {
                return this.manifestCache;
            }

            try {
                const apiBase = localStorage.getItem('TEMPLATE_API_BASE') || '/api/course-templates';
                const res = await fetch(`${apiBase}/manifest`, { cache: 'no-store' });
                if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
                const payload = await res.json();
                const data = payload?.data || payload;
                this.manifestCache = data;
                this.manifestCacheAt = Date.now();
                return this.manifestCache;
            } catch (e) {
                console.warn('Manifest API unavailable, falling back to local manifest:', e);
            }

            try {
                const res = await fetch(`${this.templateBasePath}/templates/manifest.json`, {
                    cache: 'no-store'
                });
                if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
                this.manifestCache = await res.json();
                this.manifestCacheAt = Date.now();
                return this.manifestCache;
            } catch (e) {
                console.error('Failed to load template manifest:', e);
                // 返回默认清单
                return {
                    version: 1,
                    templates: [
                        {
                            id: 'chapter2',
                            name: 'Chapter2（默认）',
                            file: 'templates/chapter2.template.html'
                        }
                    ]
                };
            }
        },

        /**
         * 获取可用模版列表
         * @returns {Promise<Array>}
         */
        async getTemplates() {
            const manifest = await this.loadManifest();
            return manifest.templates || [];
        },

        /**
         * 获取模板详情
         * @param {string} templateId
         * @returns {Promise<Object|null>}
         */
        async getTemplateById(templateId) {
            const manifest = await this.loadManifest();
            const templates = manifest.templates || [];
            return templates.find(t => t.id === templateId) || null;
        },

        /**
         * 加载模版HTML
         * @param {string} templateId - 模版ID
         * @returns {Promise<string>} - 模版HTML内容
         */
        async loadTemplate(templateId) {
            // 检查缓存
            if (this.templateCache[templateId]) {
                return this.templateCache[templateId];
            }

            const manifest = await this.loadManifest();
            const template = manifest.templates.find(t => t.id === templateId);

            if (!template) {
                console.warn(`Template "${templateId}" not found, using default`);
                // 使用默认模版
                const defaultTemplate = manifest.templates[0];
                if (!defaultTemplate) {
                    throw new Error('No templates available');
                }
                templateId = defaultTemplate.id;
                if (this.templateCache[templateId]) {
                    return this.templateCache[templateId];
                }
            }

            const templateFile = template ? template.file : manifest.templates[0].file;
            const res = await fetch(`${this.templateBasePath}/${templateFile}`, {
                cache: 'no-store'
            });

            if (!res.ok) {
                throw new Error(`Failed to load template: ${res.status}`);
            }

            const html = await res.text();
            this.templateCache[templateId] = html;
            return html;
        },

        /**
         * 渲染课程到容器
         * @param {Object} config - 课程配置（支持v1.0和v2.0格式）
         * @param {HTMLElement|HTMLIFrameElement} container - 渲染目标
         * @param {Object} options - 渲染选项
         * @returns {Promise<string>} - 生成的HTML
         */
        async renderCourse(config, container, options = {}) {
            this.checkDependencies();

            const templateId = options.templateId || config.templateId || 'chapter2';

            // 1. 确保格式是 v2.0
            const normalizedConfig = window.FormatMigrator.ensureV2(config);

            // 2. 加载模版HTML
            const templateHtml = await this.loadTemplate(templateId);

            // 3. 渲染页面
            let pagesHtml;
            try {
                pagesHtml = window.ChapterTemplateEngine.renderPages(normalizedConfig.pages);
            } catch (e) {
                console.error('Failed to render pages:', e);
                pagesHtml = `<div class="render-error">渲染错误: ${e.message}</div>`;
            }

            // 4. 应用模版
            let fullHtml;
            try {
                fullHtml = window.ChapterTemplateEngine.applyTemplate({
                    templateHtml,
                    title: normalizedConfig.title || 'Untitled',
                    pagesHtml
                });
            } catch (e) {
                // 如果模版没有标记，直接使用模版HTML（独立模版）
                if (e.message.includes('markers not found') || e.message.includes('Template markers')) {
                    console.warn('Template has no markers, using as standalone');
                    fullHtml = templateHtml;
                } else {
                    throw e;
                }
            }

            // 5. 注入到容器
            if (container) {
                this.injectToContainer(fullHtml, container, options);
            }

            return fullHtml;
        },

        /**
         * 将HTML注入到容器
         * @param {string} html - HTML内容
         * @param {HTMLElement|HTMLIFrameElement} container - 目标容器
         * @param {Object} options - 选项
         */
        injectToContainer(html, container, options = {}) {
            if (container instanceof HTMLIFrameElement) {
                // iframe 使用 srcdoc
                if (options.sandbox !== false) {
                    container.sandbox = 'allow-scripts allow-same-origin';
                }
                container.srcdoc = html;
            } else if (container.tagName === 'IFRAME') {
                container.srcdoc = html;
            } else {
                // 普通元素使用 innerHTML
                container.innerHTML = html;

                // 执行内联脚本（如果需要）
                if (options.executeScripts !== false) {
                    this.executeInlineScripts(container);
                }
            }
        },

        /**
         * 执行容器内的内联脚本
         * @param {HTMLElement} container
         */
        executeInlineScripts(container) {
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        },

        /**
         * 预览课程（在新窗口中打开）
         * @param {Object} config - 课程配置
         * @param {Object} options - 选项
         */
        async previewInNewWindow(config, options = {}) {
            const html = await this.renderCourse(config, null, options);
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

            // 5秒后释放URL
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        },

        /**
         * 下载课程HTML
         * @param {Object} config - 课程配置
         * @param {Object} options - 选项
         */
        async downloadHtml(config, options = {}) {
            const html = await this.renderCourse(config, null, options);
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${config.title || config.id || 'course'}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        },

        /**
         * 验证课程配置
         * @param {Object} config - 课程配置
         * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
         */
        validateConfig(config) {
            const errors = [];
            const warnings = [];

            if (!config) {
                errors.push('配置为空');
                return { valid: false, errors, warnings };
            }

            // 检查必要字段
            if (!config.title) {
                warnings.push('缺少标题 (title)');
            }

            if (!Array.isArray(config.pages) || config.pages.length === 0) {
                errors.push('缺少页面 (pages) 或页面为空');
            } else {
                // 检查每个页面
                config.pages.forEach((page, idx) => {
                    if (!page.id) {
                        warnings.push(`页面 ${idx + 1} 缺少ID`);
                    }
                    if (!Array.isArray(page.blocks) && !page.html) {
                        warnings.push(`页面 ${idx + 1} (${page.id || idx}) 没有blocks或html内容`);
                    }
                });
            }

            // 检查格式版本
            const version = window.FormatMigrator?.detectVersion(config);
            if (version === '1.0') {
                warnings.push('使用旧格式 (v1.0)，建议迁移到新格式');
            }

            return {
                valid: errors.length === 0,
                errors,
                warnings
            };
        },

        /**
         * 清除缓存
         */
        clearCache() {
            this.templateCache = {};
            this.manifestCache = null;
            this.manifestCacheAt = 0;
        },

        /**
         * 手动刷新模板清单
         */
        async refreshManifest() {
            this.manifestCache = null;
            this.manifestCacheAt = 0;
            return this.loadManifest();
        },

        /**
         * 获取渲染统计信息
         * @param {Object} config - 课程配置
         * @returns {Object}
         */
        getStats(config) {
            const normalizedConfig = window.FormatMigrator?.ensureV2(config) || config;
            let totalBlocks = 0;
            const blockTypes = {};

            (normalizedConfig.pages || []).forEach(page => {
                (page.blocks || []).forEach(block => {
                    totalBlocks++;
                    blockTypes[block.type] = (blockTypes[block.type] || 0) + 1;
                });
            });

            return {
                version: window.FormatMigrator?.detectVersion(config) || 'unknown',
                pageCount: (normalizedConfig.pages || []).length,
                totalBlocks,
                blockTypes,
                hasLiving: !!blockTypes.living,
                hasCodeBlock: !!blockTypes.codeBlock
            };
        }
    };

    // 导出到全局
    window.UnifiedCourseRenderer = UnifiedCourseRenderer;

})();
