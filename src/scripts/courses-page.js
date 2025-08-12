// 课程页面脚本
(function() {
    // 课程管理器
    const coursesManager = {
        courses: [],
        currentPage: 1,
        pageSize: 12,
        
        // 初始化
        async init() {
            await this.loadCourses();
            this.bindEvents();
        },
        
        // 加载课程
        async loadCourses() {
            try {
                // 确保API服务已加载
                if (typeof window.API === 'undefined') {
                    console.error('API service not loaded, falling back to direct fetch');
                    const response = await fetch('http://localhost:8080/api/courses');
                    const data = await response.json();
                    
                    if (data.code === 200) {
                        this.courses = data.data || [];
                        this.renderCourses();
                    } else {
                        this.showEmptyState();
                    }
                    return;
                }
                
                // 使用API服务
                const response = await window.API.course.getCourses({
                    page: this.currentPage,
                    size: this.pageSize
                });
                
                if (response.code === 200) {
                    this.courses = response.data || [];
                    this.renderCourses();
                } else {
                    console.error('Failed to load courses:', response.message);
                    this.showEmptyState();
                }
            } catch (error) {
                console.error('Error loading courses:', error);
                this.showEmptyState();
            }
        },
        
        // 渲染课程
        renderCourses() {
            const container = document.getElementById('coursesGrid');
            if (!container) return;
            
            if (this.courses.length === 0) {
                this.showEmptyState();
                return;
            }
            
            container.innerHTML = this.courses.map(course => this.createCourseCard(course)).join('');
            this.addCardAnimations();
        },
        
        // 获取占位图片
        getPlaceholderImage() {
            return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'><rect width='400' height='225' fill='%234a90e2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='24' font-weight='bold'>AI Course</text></svg>";
        },
        
        // 创建课程卡片
        createCourseCard(course) {
            const difficultyMap = {
                'beginner': '入门',
                'intermediate': '进阶',
                'advanced': '高级'
            };
            
            const difficulty = difficultyMap[course.difficulty] || '入门';
            
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-header">
                        <span class="badge badge-level">${difficulty}</span>
                        ${course.isFree ? '<span class="badge badge-free">免费</span>' : ''}
                    </div>
                    <div class="course-image">
                        <img src="${course.coverImage || this.getPlaceholderImage()}" 
                             alt="${course.title}"
                             onerror="this.src='${this.getPlaceholderImage()}'">
                    </div>
                    <div class="course-body">
                        <h3 class="course-title">${course.title}</h3>
                        <p class="course-description">${course.description || '探索AI技术的奥秘'}</p>
                        <div class="course-meta">
                            <span class="meta-item">
                                <i class="icon-users"></i>
                                ${course.enrollmentCount || 0}人学习
                            </span>
                            <span class="meta-item">
                                <i class="icon-star"></i>
                                ${course.rating || 5.0}分
                            </span>
                        </div>
                        <div class="course-footer">
                            <div class="course-price">
                                ${course.isFree ? 
                                    '<span class="price-free">免费</span>' : 
                                    `<span class="price">¥${course.price}</span>`
                                }
                            </div>
                            <button class="btn-primary btn-small" onclick="coursesManager.viewCourse(${course.id})">
                                查看详情
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },
        
        // 显示空状态
        showEmptyState() {
            const container = document.getElementById('coursesGrid');
            if (!container) return;
            
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>暂无课程</h3>
                    <p>正在准备更多精彩课程，敬请期待！</p>
                </div>
            `;
        },
        
        // 添加动画
        addCardAnimations() {
            const cards = document.querySelectorAll('.course-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, index * 100);
            });
        },
        
        // 查看课程
        viewCourse(courseId) {
            window.location.href = `/src/pages/course-detail.html?id=${courseId}`;
        },
        
        // 绑定事件
        bindEvents() {
            // 搜索功能
            const searchInput = document.getElementById('courseSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filterCourses(e.target.value);
                });
            }
        },
        
        // 筛选课程
        filterCourses(keyword) {
            if (!keyword) {
                this.loadCourses();
                return;
            }
            
            const filtered = this.courses.filter(course => 
                course.title.toLowerCase().includes(keyword.toLowerCase()) ||
                course.description.toLowerCase().includes(keyword.toLowerCase())
            );
            
            this.courses = filtered;
            this.renderCourses();
        }
    };
    
    // 设置全局访问
    window.coursesManager = coursesManager;
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => coursesManager.init());
    } else {
        coursesManager.init();
    }
})();