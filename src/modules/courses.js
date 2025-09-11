// 课程模块 - 处理课程相关的所有功能
import '../utils/api.js';

class CoursesManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 12;
        this.courses = [];
        this.categories = [];
        this.filters = {
            category: null,
            difficulty: null,
            isFree: null,
            search: ''
        };
    }

    // 初始化
    async init() {
        await this.loadCourses();
        this.bindEvents();
        this.initializeSearch();
    }

    // 加载课程列表
    async loadCourses(page = 1) {
        try {
            const params = {
                page: page,
                size: this.pageSize,
                ...this.filters
            };

            // 调用API获取课程
            const response = await window.API.course.getCourses(params);
            
            if (response.code === 200) {
                this.courses = response.data || [];
                this.renderCourses();
                this.updatePagination(response.total || this.courses.length);
            } else {
                console.error('Failed to load courses:', response.message);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.showEmptyState();
        }
    }

    // 渲染课程列表
    renderCourses() {
        const container = document.getElementById('coursesGrid');
        if (!container) return;

        if (this.courses.length === 0) {
            this.showEmptyState();
            return;
        }

        container.innerHTML = this.courses.map(course => this.createCourseCard(course)).join('');
        this.addCardAnimations();
    }

    // 创建课程卡片
    createCourseCard(course) {
        const difficultyMap = {
            'beginner': { text: '入门', class: 'beginner' },
            'intermediate': { text: '进阶', class: 'intermediate' },
            'advanced': { text: '高级', class: 'advanced' }
        };

        const difficulty = difficultyMap[course.difficulty] || difficultyMap.beginner;

        return `
            <div class="course-card tech-card" data-course-id="${course.id}">
                <div class="card-glow"></div>
                <div class="card-content">
                    <div class="course-badge">
                        <span class="badge-${difficulty.class}">${difficulty.text}</span>
                        ${course.isFree ? '<span class="badge-free">免费</span>' : ''}
                        ${course.isHot ? '<span class="badge-hot">热门</span>' : ''}
                    </div>
                    <div class="course-thumbnail">
                        <img src="${course.coverImage || '/images/ai-course-default.jpg'}" 
                             alt="${course.title}" 
                             onerror="this.src='/images/ai-course-default.jpg'">
                        <div class="course-overlay">
                            <button class="btn-preview" onclick="coursesManager.previewCourse(${course.id})">
                                <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                预览课程
                            </button>
                        </div>
                    </div>
                    <div class="course-info">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description || '探索AI技术的奥秘'}</p>
                        <div class="course-meta">
                            <div class="meta-item">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>${course.durationHours || 20}小时</span>
                            </div>
                            <div class="meta-item">
                                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                                <span>${course.enrollmentCount || 0}人学习</span>
                            </div>
                            <div class="meta-item rating">
                                <svg class="icon-star" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span>${course.rating || 5.0}</span>
                            </div>
                        </div>
                        <div class="course-footer">
                            <div class="course-price">
                                ${course.isFree ? 
                                    '<span class="price-free">免费</span>' : 
                                    `<span class="price-current">¥${course.price.toFixed(2)}</span>
                                     ${course.originalPrice ? 
                                        `<span class="price-original">¥${course.originalPrice.toFixed(2)}</span>` : ''}`
                                }
                            </div>
                            <button class="btn-enroll" onclick="coursesManager.enrollCourse(${course.id})">
                                ${course.isFree ? '立即学习' : '立即购买'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 显示空状态
    showEmptyState() {
        const container = document.getElementById('coursesGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                        <path d="M2 17L12 22L22 17"/>
                        <path d="M2 12L12 17L22 12"/>
                    </svg>
                </div>
                <h3>暂无课程</h3>
                <p>我们正在准备更多精彩的AI课程，敬请期待！</p>
            </div>
        `;
    }

    // 添加卡片动画
    addCardAnimations() {
        const cards = document.querySelectorAll('.course-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in-up');
        });
    }

    // 预览课程
    async previewCourse(courseId) {
        try {
            const course = await window.API.course.getCourseById(courseId);
            if (course.data) {
                window.location.href = `/src/pages/course-detail.html?id=${courseId}`;
            }
        } catch (error) {
            console.error('Error previewing course:', error);
            alert('无法预览课程，请稍后重试');
        }
    }

    // 报名课程
    async enrollCourse(courseId) {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = '/src/pages/login.html';
            return;
        }

        try {
            const course = this.courses.find(c => c.id === courseId);
            if (!course) return;

            if (course.isFree) {
                // 免费课程直接加入学习
                const response = await window.API.order.subscribeCourse(courseId);
                if (response.code === 200) {
                    window.location.href = `/src/pages/study.html?courseId=${courseId}`;
                } else {
                    alert(response.message || '加入课程失败');
                }
            } else {
                // 付费课程跳转到支付页面
                window.location.href = `/src/pages/payment.html?courseId=${courseId}`;
            }
        } catch (error) {
            console.error('Error enrolling course:', error);
            alert('操作失败，请稍后重试');
        }
    }

    // 初始化搜索
    initializeSearch() {
        const searchInput = document.getElementById('courseSearch');
        if (searchInput) {
            let searchTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.loadCourses(1);
                }, 500);
            });
        }
    }

    // 绑定事件
    bindEvents() {
        // 分类筛选
        document.querySelectorAll('.filter-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.dataset.category;
                this.filters.category = categoryId === 'all' ? null : categoryId;
                this.loadCourses(1);
                
                // 更新按钮状态
                document.querySelectorAll('.filter-category').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 难度筛选
        document.querySelectorAll('.filter-difficulty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.target.dataset.difficulty;
                this.filters.difficulty = difficulty === 'all' ? null : difficulty;
                this.loadCourses(1);
                
                // 更新按钮状态
                document.querySelectorAll('.filter-difficulty').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 免费/付费筛选
        const freeToggle = document.getElementById('freeToggle');
        if (freeToggle) {
            freeToggle.addEventListener('change', (e) => {
                this.filters.isFree = e.target.checked ? true : null;
                this.loadCourses(1);
            });
        }
    }

    // 更新分页
    updatePagination(total) {
        const totalPages = Math.ceil(total / this.pageSize);
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        let paginationHTML = '';
        
        // 上一页
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="coursesManager.goToPage(${this.currentPage - 1})">上一页</button>`;
        }

        // 页码
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            paginationHTML += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                                      onclick="coursesManager.goToPage(${i})">${i}</button>`;
        }

        // 下一页
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="coursesManager.goToPage(${this.currentPage + 1})">下一页</button>`;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    // 跳转页面
    goToPage(page) {
        this.currentPage = page;
        this.loadCourses(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 创建全局实例
window.coursesManager = new CoursesManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.coursesManager.init();
});