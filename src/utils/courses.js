// 课程数据和功能
let currentPage = 1;
const coursesPerPage = 6;
let currentFilter = 'all';
let currentSort = 'popular';
let searchQuery = '';
let allCourses = [];
let filteredCourses = [];

// 模拟课程数据
const coursesData = [
    {
        id: 1,
        title: '深度学习基础与实践',
        description: '从神经网络基础到深度学习框架应用，全面掌握深度学习核心技术，包括CNN、RNN、LSTM等',
        category: 'dl',
        level: '中级',
        duration: '40小时',
        rating: 4.8,
        originalPrice: 1299,
        currentPrice: 899,
        badge: '热门',
        students: 5240,
        chapters: [
            '深度学习概述与发展历程',
            '神经网络基础理论',
            '反向传播算法详解',
            '卷积神经网络CNN',
            '循环神经网络RNN与LSTM',
            'TensorFlow框架实践',
            'PyTorch框架实践',
            '项目实战：图像分类',
            '项目实战：文本生成',
            '模型优化与部署'
        ],
        instructor: 'Dr. AI',
        tags: ['深度学习', 'TensorFlow', 'PyTorch', '神经网络']
    },
    {
        id: 2,
        title: '自然语言处理进阶',
        description: '掌握NLP核心技术，从文本预处理到Transformer模型应用，包含BERT、GPT等前沿技术',
        category: 'nlp',
        level: '高级',
        duration: '35小时',
        rating: 4.9,
        originalPrice: 1599,
        currentPrice: 1199,
        badge: '推荐',
        students: 3180,
        chapters: [
            'NLP发展历程与应用场景',
            '文本预处理与特征提取',
            '词向量技术：Word2Vec、GloVe',
            '语言模型基础',
            'Transformer架构详解',
            'BERT模型原理与应用',
            'GPT系列模型解析',
            '文本分类实战项目',
            '机器翻译系统构建',
            '问答系统开发'
        ],
        instructor: 'Prof. NLP',
        tags: ['NLP', 'Transformer', 'BERT', 'GPT']
    },
    {
        id: 3,
        title: '机器学习算法详解',
        description: '系统学习机器学习算法原理，掌握实际应用技巧，涵盖监督学习、无监督学习等',
        category: 'ml',
        level: '初级',
        duration: '30小时',
        rating: 4.7,
        originalPrice: 999,
        currentPrice: 699,
        badge: '新上线',
        students: 8920,
        chapters: [
            '机器学习概述与分类',
            '线性回归与逻辑回归',
            '决策树与随机森林',
            '支持向量机SVM',
            '朴素贝叶斯分类器',
            'K-means聚类算法',
            '主成分分析PCA',
            '模型评估与选择',
            '特征工程技巧',
            '实战项目：房价预测'
        ],
        instructor: 'Dr. ML',
        tags: ['机器学习', 'Scikit-learn', '算法', '数据分析']
    },
    {
        id: 4,
        title: '计算机视觉实战',
        description: '深入学习计算机视觉技术，从图像基础处理到高级目标检测，掌握OpenCV和深度学习视觉技术',
        category: 'cv',
        level: '中级',
        duration: '45小时',
        rating: 4.6,
        originalPrice: 1399,
        currentPrice: 999,
        badge: '实战',
        students: 4560,
        chapters: [
            '计算机视觉基础',
            'OpenCV图像处理',
            '图像特征提取',
            '目标检测算法',
            'YOLO系列详解',
            'R-CNN系列算法',
            '图像分割技术',
            '人脸识别系统',
            '姿态估计技术',
            '视觉项目部署'
        ],
        instructor: 'CV Expert',
        tags: ['计算机视觉', 'OpenCV', 'YOLO', '目标检测']
    },
    {
        id: 5,
        title: '强化学习从入门到精通',
        description: '全面掌握强化学习理论与实践，从基础概念到深度强化学习，包含多个游戏AI项目',
        category: 'rl',
        level: '高级',
        duration: '38小时',
        rating: 4.5,
        originalPrice: 1499,
        currentPrice: 1099,
        badge: '进阶',
        students: 2340,
        chapters: [
            '强化学习基础概念',
            'MDP马尔可夫决策过程',
            'Q-Learning算法',
            '策略梯度方法',
            'Actor-Critic架构',
            'DQN深度Q网络',
            'A3C算法详解',
            'PPO算法实现',
            '游戏AI项目：贪吃蛇',
            '游戏AI项目：Flappy Bird'
        ],
        instructor: 'RL Master',
        tags: ['强化学习', 'DQN', 'A3C', '游戏AI']
    },
    {
        id: 6,
        title: 'Python机器学习实战',
        description: '使用Python进行机器学习项目开发，涵盖数据处理、模型训练、评估等完整流程',
        category: 'ml',
        level: '初级',
        duration: '32小时',
        rating: 4.4,
        originalPrice: 899,
        currentPrice: 599,
        badge: '基础',
        students: 12000,
        chapters: [
            'Python数据科学环境搭建',
            'NumPy数值计算基础',
            'Pandas数据处理',
            'Matplotlib数据可视化',
            'Scikit-learn机器学习',
            '数据预处理技巧',
            '模型训练与调优',
            '交叉验证技术',
            '模型解释与可视化',
            '端到端项目实战'
        ],
        instructor: 'Python Guru',
        tags: ['Python', 'Pandas', 'Scikit-learn', '数据科学']
    }
];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeCourses();
    setupEventListeners();
    animateElements();
});

// 初始化粒子背景
function initializeParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#00ff96'
                },
                shape: {
                    type: 'circle',
                    stroke: {
                        width: 0,
                        color: '#000000'
                    }
                },
                opacity: {
                    value: 0.1,
                    random: false,
                    anim: {
                        enable: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#00ff96',
                    opacity: 0.1,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 400,
                        line_linked: {
                            opacity: 1
                        }
                    },
                    repulse: {
                        distance: 100,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
    }
}

// 从API加载课程数据
async function loadCoursesFromAPI() {
    try {
        const response = await fetch('http://42.194.245.66/api/courses');
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            // 将API数据转换为前端需要的格式
            allCourses = data.data.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                category: getCategoryKey(course.categoryId),
                level: mapDifficulty(course.difficulty),
                duration: `${course.durationHours || 20}小时`,
                rating: course.rating || 4.5,
                originalPrice: course.originalPrice || course.price,
                currentPrice: course.price,
                badge: course.isFree ? '免费' : '精品',
                students: course.enrollmentCount || 100,
                chapters: [], // 章节信息需要单独API获取
                instructor: '专业讲师',
                tags: ['AI', '机器学习', '深度学习'] // 可以根据分类生成标签
            }));
        } else {
            throw new Error('API返回数据格式错误');
        }
    } catch (error) {
        console.error('API加载失败:', error);
        throw error;
    }
}

// 根据categoryId获取分类键值
function getCategoryKey(categoryId) {
    const categoryMap = {
        1: 'ai',
        2: 'dl',
        3: 'ml', 
        4: 'nlp',
        5: 'cv',
        6: 'rl'
    };
    return categoryMap[categoryId] || 'ai';
}

// 映射难度等级
function mapDifficulty(difficulty) {
    const difficultyMap = {
        'beginner': '初级',
        'intermediate': '中级',
        'advanced': '高级'
    };
    return difficultyMap[difficulty] || '初级';
}

// 初始化课程数据
async function initializeCourses() {
    try {
        // 从API加载真实课程数据
        await loadCoursesFromAPI();
        filterAndSortCourses();
        renderCourses();
    } catch (error) {
        console.error('加载课程数据失败:', error);
        // 使用回退数据
        allCourses = [...coursesData];
        filterAndSortCourses();
        renderCourses();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 筛选标签
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            currentPage = 1;
            filterAndSortCourses();
            renderCourses();
        });
    });

    // 搜索功能
    const searchInput = document.getElementById('courseSearch');
    const searchBtn = document.querySelector('.search-btn');
    
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchBtn.addEventListener('click', handleSearch);
    
    // 排序功能
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        currentPage = 1;
        filterAndSortCourses();
        renderCourses();
    });
}

// 搜索处理
function handleSearch() {
    searchQuery = document.getElementById('courseSearch').value.trim().toLowerCase();
    currentPage = 1;
    filterAndSortCourses();
    renderCourses();
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 筛选和排序课程
function filterAndSortCourses() {
    // 筛选
    filteredCourses = allCourses.filter(course => {
        const matchesFilter = currentFilter === 'all' || course.category === currentFilter;
        const matchesSearch = searchQuery === '' || 
            course.title.toLowerCase().includes(searchQuery) ||
            course.description.toLowerCase().includes(searchQuery) ||
            course.tags.some(tag => tag.toLowerCase().includes(searchQuery));
        return matchesFilter && matchesSearch;
    });

    // 排序
    filteredCourses.sort((a, b) => {
        switch (currentSort) {
            case 'popular':
                return b.students - a.students;
            case 'newest':
                return b.id - a.id;
            case 'rating':
                return b.rating - a.rating;
            case 'price-low':
                return a.currentPrice - b.currentPrice;
            case 'price-high':
                return b.currentPrice - a.currentPrice;
            default:
                return 0;
        }
    });
}

// 渲染课程
function renderCourses() {
    const coursesGrid = document.getElementById('coursesGrid');
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const coursesToShow = filteredCourses.slice(0, endIndex);

    if (currentPage === 1) {
        coursesGrid.innerHTML = '';
    }

    coursesToShow.slice(startIndex).forEach((course, index) => {
        const courseCard = createCourseCard(course, startIndex + index);
        coursesGrid.appendChild(courseCard);
        
        // 添加动画延迟
        setTimeout(() => {
            courseCard.style.opacity = '1';
            courseCard.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // 更新加载更多按钮
    updateLoadMoreButton();
}

// 创建课程卡片
function createCourseCard(course, index) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    courseCard.style.opacity = '0';
    courseCard.style.transform = 'translateY(20px)';
    courseCard.style.transition = 'all 0.5s ease';

    courseCard.innerHTML = `
        <div class="course-image">
            <div class="course-badge">${course.badge}</div>
        </div>
        <div class="course-content">
            <h3>${course.title}</h3>
            <p>${course.description}</p>
            <div class="course-meta">
                <span class="course-level">${course.level}</span>
                <span class="course-duration">${course.duration}</span>
                <span class="course-students">${course.students}人学习</span>
            </div>
            <div class="course-rating">
                <span class="stars">${generateStars(course.rating)}</span>
                <span class="rating-score">${course.rating}</span>
            </div>
            <div class="course-price">
                <span class="original-price">¥${course.originalPrice.toFixed(2)}</span>
                <span class="current-price">¥${course.currentPrice.toFixed(2)}</span>
            </div>
            <button class="btn-view-course" onclick="showCourseModal(${course.id})">
                查看详情
            </button>
        </div>
    `;

    return courseCard;
}

// 生成星级评分
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    
    if (hasHalfStar) {
        stars += '⭐';
    }
    
    return stars;
}

// 更新加载更多按钮
function updateLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.btn-load-more');
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
    
    if (currentPage >= totalPages) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-flex';
    }
}

// 加载更多课程
function loadMoreCourses() {
    const loadMoreBtn = document.querySelector('.btn-load-more');
    loadMoreBtn.classList.add('loading');
    
    setTimeout(() => {
        currentPage++;
        renderCourses();
        loadMoreBtn.classList.remove('loading');
    }, 1000);
}

// 显示课程详情弹窗
async function showCourseModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    // 更新弹窗内容
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseDescription').textContent = course.description;
    document.getElementById('courseLevel').textContent = course.level;
    document.getElementById('courseDuration').textContent = course.duration;
    document.getElementById('courseRating').textContent = course.rating;
    document.getElementById('originalPrice').textContent = `¥${course.originalPrice.toFixed(2)}`;
    document.getElementById('currentPrice').textContent = `¥${course.currentPrice.toFixed(2)}`;
    document.getElementById('courseBadge').textContent = course.badge;

    // 渲染章节列表
    const chaptersContainer = document.getElementById('courseChapters');
    
    // 先显示加载状态
    chaptersContainer.innerHTML = `
        <h3>课程内容</h3>
        <div class="chapters-list">
            <div style="text-align: center; padding: 2rem; color: #8892b0;">
                正在加载章节信息...
            </div>
        </div>
    `;

    // 显示弹窗
    document.getElementById('courseModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 存储当前课程ID用于报名
    window.currentCourseId = courseId;
    
    // 异步加载章节信息
    try {
        const chapters = await loadCourseChapters(courseId);
        displayCourseChapters(chapters, course.tags, chaptersContainer);
    } catch (error) {
        console.error('加载章节失败:', error);
        // 使用回退数据或显示错误
        displayFallbackChapters(course.chapters, course.tags, chaptersContainer);
    }
}

// 加载课程章节
async function loadCourseChapters(courseId) {
    try {
        const response = await fetch(`http://42.194.245.66/api/content/courses/${courseId}/chapters`);
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            return data.data;
        } else {
            throw new Error('无法获取章节信息');
        }
    } catch (error) {
        console.error('章节加载失败:', error);
        throw error;
    }
}

// 显示课程章节
function displayCourseChapters(chapters, tags, container) {
    container.innerHTML = `
        <h3>课程内容</h3>
        <div class="chapters-list">
            ${chapters.map((chapter, index) => `
                <div class="chapter-item">
                    <div class="chapter-number">${index + 1}</div>
                    <div class="chapter-title">${chapter.title}</div>
                    <div class="chapter-duration">${chapter.durationMinutes || 45}分钟</div>
                    ${chapter.isFree ? '<span class="free-badge">免费</span>' : ''}
                </div>
            `).join('')}
        </div>
        <div class="course-tags">
            <h4>技术标签</h4>
            ${tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
        </div>
    `;
}

// 显示回退章节数据
function displayFallbackChapters(chapters, tags, container) {
    container.innerHTML = `
        <h3>课程内容</h3>
        <div class="chapters-list">
            ${chapters.length > 0 ? chapters.map((chapter, index) => `
                <div class="chapter-item">
                    <div class="chapter-number">${index + 1}</div>
                    <div class="chapter-title">${chapter}</div>
                    <div class="chapter-duration">45分钟</div>
                </div>
            `).join('') : '<div style="text-align: center; color: #8892b0;">课程内容制作中</div>'}
        </div>
        <div class="course-tags">
            <h4>技术标签</h4>
            ${tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
        </div>
    `;
}

// 隐藏课程详情弹窗
function hideCourseModal() {
    document.getElementById('courseModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 课程报名
async function enrollCourse() {
    if (!window.isAuthenticated || !window.isAuthenticated()) {
        showNotification('请先登录后再报名课程', 'error');
        hideCourseModal();
        setTimeout(() => {
            if (typeof showLogin === 'function') {
                showLogin();
            }
        }, 500);
        return;
    }

    const courseId = window.currentCourseId;
    const course = allCourses.find(c => c.id === courseId);
    
    try {
        const result = await window.apiRequest('/orders/create', {
            method: 'POST',
            body: JSON.stringify({
                courseId: courseId,
                courseName: course.title,
                price: course.currentPrice,
                originalPrice: course.originalPrice
            })
        });

        if (result && result.success) {
            hideCourseModal();
            showNotification('课程报名成功！', 'success');
            
            // 跳转到支付页面
            setTimeout(() => {
                window.location.href = `payment.html?orderId=${result.data.orderId}`;
            }, 1500);
        } else {
            showNotification(result?.message || '报名失败，请重试', 'error');
        }
    } catch (error) {
        console.error('报名错误:', error);
        showNotification('报名失败，请检查网络连接', 'error');
    }
}

// 动画元素
function animateElements() {
    // 观察器配置
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    // 创建观察器
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // 观察所有需要动画的元素
    document.querySelectorAll('.course-card, .filter-tab, .hero-stats').forEach(el => {
        observer.observe(el);
    });
}

// 点击弹窗外部关闭
window.addEventListener('click', function(event) {
    const courseModal = document.getElementById('courseModal');
    if (event.target === courseModal) {
        hideCourseModal();
    }
});

// 键盘事件
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideCourseModal();
    }
});

// 添加CSS样式补充
const additionalStyles = `
<style>
.course-students {
    background: rgba(0, 204, 255, 0.1);
    color: #00ccff;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid rgba(0, 204, 255, 0.3);
}

.course-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.rating-score {
    color: #00ff96;
    font-weight: 600;
}

.chapters-list {
    margin-top: 1rem;
}

.chapter-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 255, 150, 0.05);
    border: 1px solid rgba(0, 255, 150, 0.1);
    border-radius: 10px;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
}

.chapter-item:hover {
    background: rgba(0, 255, 150, 0.1);
    border-color: rgba(0, 255, 150, 0.3);
}

.chapter-number {
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #00ff96, #00ccff);
    color: #0a0e1a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
}

.chapter-title {
    flex: 1;
    color: #e2e8f0;
}

.chapter-duration {
    color: #94a3b8;
    font-size: 0.9rem;
}

.course-tags {
    margin-top: 2rem;
}

.course-tags h4 {
    color: #00ff96;
    margin-bottom: 1rem;
}

.tech-tag {
    display: inline-block;
    padding: 6px 12px;
    background: rgba(0, 255, 150, 0.1);
    border: 1px solid rgba(0, 255, 150, 0.3);
    border-radius: 20px;
    color: #00ff96;
    font-size: 0.8rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
}

@keyframes animate-in {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: animate-in 0.6s ease-out forwards;
}
</style>
`;

// 添加样式到页面
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// 导出函数供全局使用
window.loadMoreCourses = loadMoreCourses;
window.showCourseModal = showCourseModal;
window.hideCourseModal = hideCourseModal;
window.enrollCourse = enrollCourse;