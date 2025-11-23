/**
 * Enhanced Search Component - 增强搜索组件
 * 提供实时搜索建议、智能筛选和优化的用户体验
 */

class EnhancedSearch {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: '/api/courses/search',
            minChars: 2,
            debounceDelay: 300,
            maxSuggestions: 5,
            ...options
        };

        this.cache = new Map();
        this.searchHistory = this.loadHistory();
        this.init();
    }

    init() {
        this.setupDOM();
        this.bindEvents();
    }

    setupDOM() {
        this.searchInput = document.querySelector('.search-input');
        this.searchBtn = document.querySelector('.search-btn');
        this.suggestionsContainer = this.createSuggestionsContainer();
    }

    createSuggestionsContainer() {
        let container = document.getElementById('search-suggestions');
        if (!container) {
            container = document.createElement('div');
            container.id = 'search-suggestions';
            container.className = 'search-suggestions';
            container.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                margin-top: 8px;
                max-height: 400px;
                overflow-y: auto;
                display: none;
                z-index: 1000;
                animation: fadeInUp 0.3s ease-out;
            `;

            if (this.searchInput && this.searchInput.parentElement) {
                this.searchInput.parentElement.style.position = 'relative';
                this.searchInput.parentElement.appendChild(container);
            }
        }
        return container;
    }

    bindEvents() {
        if (!this.searchInput) return;

        // 输入事件 - 使用防抖
        this.searchInput.addEventListener('input', window.UXUtils.debounce((e) => {
            this.handleInput(e.target.value);
        }, this.options.debounceDelay));

        // 焦点事件
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.length >= this.options.minChars) {
                this.showSuggestions();
            } else {
                this.showHistory();
            }
        });

        // 失焦事件 - 延迟关闭以允许点击建议
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // 键盘导航
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // 搜索按钮
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => {
                this.performSearch(this.searchInput.value);
            });
        }

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) &&
                !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    async handleInput(value) {
        const trimmed = value.trim();

        if (trimmed.length < this.options.minChars) {
            this.hideSuggestions();
            return;
        }

        // 检查缓存
        if (this.cache.has(trimmed)) {
            this.renderSuggestions(this.cache.get(trimmed), trimmed);
            return;
        }

        // 显示加载状态
        this.showLoading();

        try {
            const results = await this.fetchSuggestions(trimmed);
            this.cache.set(trimmed, results);
            this.renderSuggestions(results, trimmed);
        } catch (error) {
            console.error('Search suggestions error:', error);
            this.hideLoading();
        }
    }

    async fetchSuggestions(query) {
        const response = await fetch(
            `${this.options.apiEndpoint}?keyword=${encodeURIComponent(query)}&size=${this.options.maxSuggestions}`
        );

        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const data = await response.json();
        return data.data || [];
    }

    renderSuggestions(results, query) {
        this.hideLoading();

        if (!results || results.length === 0) {
            this.showNoResults(query);
            return;
        }

        const html = `
            <div class="suggestions-header" style="padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem; color: #6b7280;">
                搜索建议
            </div>
            <ul class="suggestions-list" style="list-style: none; padding: 0; margin: 0;">
                ${results.map((item, index) => `
                    <li class="suggestion-item" data-index="${index}" style="
                        padding: 0.75rem 1rem;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        border-bottom: 1px solid #f3f4f6;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="flex-shrink: 0; width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #f3f4f6;">
                                ${item.coverImage ? `
                                    <img src="${item.coverImage}" alt="${item.title}"
                                         style="width: 100%; height: 100%; object-fit: cover;">
                                ` : `
                                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 1.25rem; font-weight: bold;">
                                        ${item.title.charAt(0)}
                                    </div>
                                `}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 500; color: #1f2937; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${this.highlightMatch(item.title, query)}
                                </div>
                                <div style="font-size: 0.875rem; color: #6b7280;">
                                    <span style="margin-right: 1rem;">💰 ¥${item.price}</span>
                                    <span>👥 ${item.enrollmentCount || 0}人学习</span>
                                </div>
                            </div>
                            <div style="flex-shrink: 0; color: #9ca3af;">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;

        this.suggestionsContainer.innerHTML = html;
        this.showSuggestions();
        this.bindSuggestionEvents(results);
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: #fef3c7; color: #92400e; padding: 0 2px; border-radius: 2px;">$1</mark>');
    }

    bindSuggestionEvents(results) {
        const items = this.suggestionsContainer.querySelectorAll('.suggestion-item');

        items.forEach((item, index) => {
            // 鼠标悬停高亮
            item.addEventListener('mouseenter', () => {
                this.highlightItem(index);
            });

            // 点击选中
            item.addEventListener('click', () => {
                const course = results[index];
                this.selectSuggestion(course);
            });
        });
    }

    highlightItem(index) {
        const items = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#f3f4f6';
            } else {
                item.style.backgroundColor = 'transparent';
            }
        });
    }

    selectSuggestion(course) {
        this.addToHistory(course.title);
        this.hideSuggestions();
        this.searchInput.value = course.title;

        // 跳转到课程详情
        window.location.href = `/src/pages/course-detail.html?id=${course.id}`;
    }

    handleKeyboard(e) {
        const items = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        const currentIndex = Array.from(items).findIndex(
            item => item.style.backgroundColor === 'rgb(243, 244, 246)'
        );

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                this.highlightItem(nextIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                this.highlightItem(prevIndex);
                break;

            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    items[currentIndex].click();
                } else {
                    this.performSearch(this.searchInput.value);
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                this.searchInput.blur();
                break;
        }
    }

    showHistory() {
        if (this.searchHistory.length === 0) return;

        const html = `
            <div class="suggestions-header" style="padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem; color: #6b7280; display: flex; justify-content: space-between; align-items: center;">
                <span>搜索历史</span>
                <button class="clear-history" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 0.875rem;">清除</button>
            </div>
            <ul class="suggestions-list" style="list-style: none; padding: 0; margin: 0;">
                ${this.searchHistory.slice(0, 5).map((term, index) => `
                    <li class="history-item" data-term="${term}" style="
                        padding: 0.75rem 1rem;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        border-bottom: 1px solid #f3f4f6;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                    ">
                        <svg width="16" height="16" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style="flex: 1; color: #4b5563;">${term}</span>
                    </li>
                `).join('')}
            </ul>
        `;

        this.suggestionsContainer.innerHTML = html;
        this.showSuggestions();

        // 绑定历史记录事件
        this.suggestionsContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.searchInput.value = item.dataset.term;
                this.performSearch(item.dataset.term);
            });

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f3f4f6';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
        });

        // 清除历史按钮
        const clearBtn = this.suggestionsContainer.querySelector('.clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearHistory();
            });
        }
    }

    showLoading() {
        this.suggestionsContainer.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <div class="spinner small" style="margin: 0 auto;"></div>
                <div style="margin-top: 0.5rem; color: #6b7280; font-size: 0.875rem;">搜索中...</div>
            </div>
        `;
        this.showSuggestions();
    }

    hideLoading() {
        // 加载状态会被结果替换，这里不需要额外操作
    }

    showNoResults(query) {
        this.suggestionsContainer.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6b7280;">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.5rem;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div>未找到与 "${query}" 相关的课程</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">试试其他关键词</div>
            </div>
        `;
        this.showSuggestions();
    }

    showSuggestions() {
        this.suggestionsContainer.style.display = 'block';
    }

    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
    }

    performSearch(query) {
        if (!query.trim()) return;

        this.addToHistory(query);
        this.hideSuggestions();

        // 触发搜索事件
        const event = new CustomEvent('search', { detail: { query } });
        document.dispatchEvent(event);

        // 如果有回调函数
        if (this.options.onSearch) {
            this.options.onSearch(query);
        }
    }

    // 搜索历史管理
    loadHistory() {
        try {
            const history = localStorage.getItem('searchHistory');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    addToHistory(term) {
        if (!term.trim()) return;

        // 移除重复项
        this.searchHistory = this.searchHistory.filter(t => t !== term);

        // 添加到开头
        this.searchHistory.unshift(term);

        // 限制数量
        this.searchHistory = this.searchHistory.slice(0, 10);

        // 保存
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.error('Failed to save search history:', e);
        }
    }

    clearHistory() {
        this.searchHistory = [];
        try {
            localStorage.removeItem('searchHistory');
        } catch (e) {
            console.error('Failed to clear search history:', e);
        }
        this.hideSuggestions();
        window.UXUtils.Toast.success('搜索历史已清除');
    }
}

// 导出
window.EnhancedSearch = EnhancedSearch;

// 自动初始化（如果页面有搜索框）
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.search-input')) {
        window.searchInstance = new EnhancedSearch();
        console.log('✅ Enhanced Search initialized');
    }
});
