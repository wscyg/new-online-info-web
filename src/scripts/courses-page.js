// 课程页面管理器 - 重新设计版
(function() {
    const coursesManager = {
        courses: [],
        bundles: [],
        categories: {},
        currentView: 'all', // 'all', 'bundles', 'individual'
        currentCategory: 'all',
        currentPriceFilter: 'all',
        searchTerm: '',
        currentPage: 1,
        pageSize: 12,
        
        // 初始化
        async init() {
            await this.loadData();
            this.bindEvents();
            this.updateCategoryCounts();
            this.renderCurrentView();
        },
        
        // 加载数据
        async loadData() {
            try {
                console.log('开始加载课程数据...');
                
                // 加载课程数据
                const coursesResponse = await fetch('/api/courses?page=1&size=50');
                const coursesData = await coursesResponse.json();
                
                console.log('API响应:', coursesData);
                
                if (coursesData.code === 200 && coursesData.data) {
                    this.courses = Array.isArray(coursesData.data) ? coursesData.data : [];
                    console.log('成功加载课程数据:', this.courses.length, '门课程');
                } else {
                    console.error('API返回数据格式错误:', coursesData);
                    this.courses = [];
                }
                
                // 加载课程包数据（模拟数据）
                this.loadBundles();
                
                // 统计分类数量
                this.calculateCategoryCounts();
                
            } catch (error) {
                console.error('加载课程数据失败:', error);
                this.showEmptyState('数据加载失败: ' + error.message);
            }
        },
        
        // 加载课程包数据（模拟）
        loadBundles() {
            this.bundles = [
                {
                    id: 'ai-full',
                    title: 'AI全栈工程师套餐',
                    description: '从零基础到专家级，全面掌握AI核心技术，包含机器学习、深度学习、NLP、计算机视觉等全套课程',
                    price: 899,
                    originalPrice: 1299,
                    courseCount: 6,
                    duration: '50+ 小时',
                    projects: '20+ 项目'
                },
                {
                    id: 'deep-learning',
                    title: '深度学习专家包',
                    description: '专攻深度学习，成为AI算法专家，包含神经网络、CNN/RNN、GAN、强化学习等核心内容',
                    price: 399,
                    originalPrice: 599,
                    courseCount: 4,
                    duration: '30+ 小时',
                    projects: '12+ 项目'
                },
                {
                    id: 'nlp-package',
                    title: 'NLP工程师包',
                    description: '掌握自然语言处理核心技术，Transformer、BERT/GPT、对话系统、文本分析等前沿技术',
                    price: 299,
                    originalPrice: 499,
                    courseCount: 4,
                    duration: '25+ 小时',
                    projects: '8+ 项目'
                }
            ];
        },
        
        // 计算分类数量
        calculateCategoryCounts() {
            this.categories = {
                '1': this.courses.filter(c => c.categoryId === 1).length,
                '2': this.courses.filter(c => c.categoryId === 2).length,
                '3': this.courses.filter(c => c.categoryId === 3).length,
                '4': this.courses.filter(c => c.categoryId === 4).length,
                '5': this.courses.filter(c => c.categoryId === 5).length
            };
        },
        
        // 更新分类数量显示
        updateCategoryCounts() {
            document.getElementById('allCount').textContent = this.courses.length;
            document.getElementById('individualCount').textContent = this.courses.length;
            
            // 更新各分类数量
            Object.entries(this.categories).forEach(([categoryId, count]) => {
                const countEl = document.querySelector(`[data-category="${categoryId}"] .count`);
                if (countEl) countEl.textContent = count;
            });
        },
        
        // 渲染当前视图
        renderCurrentView() {
            const bundlesView = document.getElementById('bundlesView');
            const coursesView = document.getElementById('coursesView');
            const loadMore = document.getElementById('loadMore');
            
            if (this.currentView === 'bundles') {
                bundlesView.style.display = 'block';
                coursesView.style.display = 'none';
                loadMore.style.display = 'none';
                this.renderBundles();
                this.updateContentHeader('课程包', '精选课程包，一次购买全套掌握');
            } else {
                bundlesView.style.display = 'none';
                coursesView.style.display = 'block';
                loadMore.style.display = 'block';
                this.renderCourses();
                this.updateContentHeader('全部课程', '精选优质课程，系统化学习路径');
            }
        },
        
        // 更新内容标题
        updateContentHeader(title, subtitle) {
            document.getElementById('contentTitle').textContent = title;
            document.getElementById('contentSubtitle').textContent = subtitle;
        },
        
        // 渲染课程包
        renderBundles() {
            const container = document.getElementById('bundlesGrid');
            if (!container) return;
            
            const bundlesHtml = this.bundles.map(bundle => this.createBundleCard(bundle)).join('');
            container.innerHTML = bundlesHtml;
        },
        
        // 创建课程包卡片
        createBundleCard(bundle) {
            const discount = Math.round((1 - bundle.price / bundle.originalPrice) * 100);
            return `
                <div class="bundle-card" data-bundle-id="${bundle.id}">
                    <h3 class="bundle-title">${bundle.title}</h3>
                    <p class="bundle-description">${bundle.description}</p>
                    <div class="bundle-meta">
                        <span>${bundle.courseCount}门课程</span>
                        <span>${bundle.duration}</span>
                        <span>${bundle.projects}</span>
                    </div>
                    <div class="bundle-price">
                        <span class="current-price">¥${bundle.price.toFixed(2)}</span>
                        <span class="original-price">¥${bundle.originalPrice.toFixed(2)}</span>
                        <div style="color: #ef4444; font-size: 0.9rem; margin-top: 0.5rem;">立省${(bundle.originalPrice - bundle.price).toFixed(2)}元 (省${discount}%)</div>
                    </div>
                    <button class="btn-purchase" onclick="purchaseBundle('${bundle.id}')">立即购买</button>
                </div>
            `;
        },
        
        // 渲染课程列表
        renderCourses() {
            const container = document.getElementById('coursesGrid');
            if (!container) return;
            
            const filteredCourses = this.getFilteredCourses();
            
            if (filteredCourses.length === 0) {
                this.showEmptyState();
                return;
            }
            
            this.hideEmptyState();
            const coursesHtml = filteredCourses.map(course => this.createCourseCard(course)).join('');
            container.innerHTML = coursesHtml;
        },
        
        // 获取过滤后的课程
        getFilteredCourses() {
            let filtered = [...this.courses];
            
            // 分类过滤
            if (this.currentCategory !== 'all') {
                filtered = filtered.filter(course => course.categoryId == this.currentCategory);
            }
            
            // 价格过滤
            if (this.currentPriceFilter === 'free') {
                filtered = filtered.filter(course => course.isFree);
            } else if (this.currentPriceFilter === 'paid') {
                filtered = filtered.filter(course => !course.isFree);
            }
            
            // 搜索过滤
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                filtered = filtered.filter(course => 
                    course.title.toLowerCase().includes(term) ||
                    (course.description && course.description.toLowerCase().includes(term))
                );
            }
            
            return filtered;
        },
        
        // 创建课程卡片
        createCourseCard(course) {
            const difficultyMap = {
                'beginner': '入门',
                'intermediate': '进阶', 
                'advanced': '高级'
            };
            
            const difficulty = difficultyMap[course.difficulty] || '入门';
            
            // 确保数据类型正确
            const isFree = course.isFree === true || course.isFree === 'true' || course.price == 0;
            const price = course.price ? parseFloat(course.price) : 0;
            const rating = course.rating ? parseFloat(course.rating) : 5.0;
            const enrollmentCount = course.enrollmentCount || 0;
            const viewCount = course.viewCount || 0;
            
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-header">
                        <span class="badge badge-level">${difficulty}</span>
                        ${isFree ? '<span class="badge badge-free">免费</span>' : ''}
                        ${course.isHot ? '<span class="badge badge-hot">热门</span>' : ''}
                    </div>
                    <div class="course-image">
                        ${course.coverImage ? 
                            `<img src="${course.coverImage}" alt="${course.title}" 
                                 onerror="this.parentElement.innerHTML='${this.getPlaceholderImageHtml()}'">` :
                            this.getPlaceholderImageHtml()
                        }
                    </div>
                    <div class="course-body">
                        <h3 class="course-title">${course.title || '未命名课程'}</h3>
                        <p class="course-description">${course.description || '探索AI技术的奥秘，开启智能学习之旅'}</p>
                        <div class="course-meta">
                            <span class="meta-item">
                                👥 ${enrollmentCount}人学习
                            </span>
                            <span class="meta-item">
                                ⭐ ${rating.toFixed(1)}分
                            </span>
                            <span class="meta-item">
                                👁 ${viewCount}浏览
                            </span>
                        </div>
                        <div class="course-footer">
                            <div class="course-price">
                                ${isFree ? 
                                    '<span class="price-free">免费</span>' : 
                                    `<span class="price">¥${price.toFixed(2)}</span>`
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
        
        // 获取占位图片
        getPlaceholderImage() {
            return "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='400' height='200' fill='%234a90e2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='20' font-weight='bold'>AI Course</text></svg>";
        },
        
        // 获取占位图片HTML
        getPlaceholderImageHtml() {
            return `<div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; font-weight: bold;">🎓 AI课程</div>`;
        },
        
        // 显示空状态
        showEmptyState(message = '暂无内容') {
            const emptyState = document.getElementById('emptyState');
            const coursesGrid = document.getElementById('coursesGrid');
            
            if (emptyState && coursesGrid) {
                emptyState.style.display = 'block';
                coursesGrid.style.display = 'none';
                emptyState.querySelector('p').textContent = message;
            }
        },
        
        // 隐藏空状态
        hideEmptyState() {
            const emptyState = document.getElementById('emptyState');
            const coursesGrid = document.getElementById('coursesGrid');
            
            if (emptyState && coursesGrid) {
                emptyState.style.display = 'none';
                coursesGrid.style.display = 'grid';
            }
        },
        
        // 查看课程
        viewCourse(courseId) {
            window.location.href = `/src/pages/course-detail.html?id=${courseId}`;
        },
        
        // 绑定事件
        bindEvents() {
            // 侧边导航事件
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleNavClick(item);
                });
            });
            
            // 搜索功能
            const searchInput = document.getElementById('courseSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchTerm = e.target.value;
                    this.renderCurrentView();
                });
            }
            
            // 排序功能
            const sortSelect = document.getElementById('sortSelect');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.handleSort(e.target.value);
                });
            }
        },
        
        // 处理导航点击
        handleNavClick(item) {
            // 移除所有active状态
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // 获取点击的类型
            const view = item.getAttribute('data-view');
            const category = item.getAttribute('data-category');
            const price = item.getAttribute('data-price');
            
            if (view) {
                this.currentView = view;
            } else if (category) {
                this.currentView = 'individual';
                this.currentCategory = category;
            } else if (price) {
                this.currentView = 'individual';
                this.currentPriceFilter = price;
            }
            
            this.renderCurrentView();
        },
        
        // 处理排序
        handleSort(sortType) {
            switch (sortType) {
                case 'popular':
                    this.courses.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
                    break;
                case 'newest':
                    this.courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'rating':
                    this.courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'price-low':
                    this.courses.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                case 'price-high':
                    this.courses.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
            }
            this.renderCurrentView();
        }
    };
    
    // 课程包购买功能
    window.purchaseBundle = function(bundleId) {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录才能购买课程包');
            const loginPath = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? '/src/pages/login.html?returnUrl=courses.html'
                : '/login.html?returnUrl=courses.html';
            window.location.href = loginPath;
            return;
        }
        
        const bundle = coursesManager.bundles.find(b => b.id === bundleId);
        if (!bundle) {
            alert('课程包不存在');
            return;
        }
        
        if (confirm(`确认购买「${bundle.title}」？\n价格：¥${bundle.price}\n包含${bundle.courseCount}门课程`)) {
            // 跳转到支付页面
            const paymentData = {
                type: 'bundle',
                bundleId: bundleId,
                name: bundle.title,
                price: bundle.price
            };
            
            sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const paymentPath = isDev ? '/src/pages/payment.html' : '/payment.html';
            window.location.href = paymentPath;
        }
    };
    
    // 加载更多课程
    window.loadMoreCourses = function() {
        // 模拟加载更多功能
        const btn = document.querySelector('.btn-load-more');
        const spinner = btn.querySelector('.loading-spinner');
        
        spinner.style.display = 'inline-block';
        btn.disabled = true;
        
        setTimeout(() => {
            spinner.style.display = 'none';
            btn.disabled = false;
            // 实际上可以在这里加载更多数据
        }, 1000);
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