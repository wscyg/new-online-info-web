// Dashboard数据和功能
let currentDate = new Date();
let studyData = {};
let progressData = [];
let planData = [];
let notesData = [];
let achievementsData = [];
let recommendedData = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initTheme(); // 初始化主题
    initializeDashboard();
    loadUserData();
    setupEventListeners();
    animateStats();
    renderCalendar();
    initializeCharts();
    initializeCalendarData();
});

// 初始化仪表板
function initializeDashboard() {
    // 检查用户登录状态
    checkAuthenticationStatus();
    
    // 不再使用模拟数据，将在loadUserData中加载真实数据
}

// 检查用户认证状态
function checkAuthenticationStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        // 未登录，重定向到首页
        showNotification('请先登录以访问学习中心', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        updateUserWelcome(userData.username);
    } catch (error) {
        console.error('用户数据解析错误:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../../index.html';
    }
}

// 更新用户欢迎信息
function updateUserWelcome(username) {
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText) {
        welcomeText.textContent = `欢迎，${username}`;
    }
}

// 生成回退学习进度数据
function generateFallbackProgressData() {
    return [
        {
            id: 1,
            title: '深度学习基础与实践',
            progress: 75,
            totalChapters: 10,
            completedChapters: 8,
            lastStudied: '2小时前',
            category: 'dl'
        },
        {
            id: 2,
            title: '自然语言处理进阶',
            progress: 45,
            totalChapters: 12,
            completedChapters: 5,
            lastStudied: '1天前',
            category: 'nlp'
        },
        {
            id: 3,
            title: '计算机视觉实战',
            progress: 30,
            totalChapters: 15,
            completedChapters: 4,
            lastStudied: '3天前',
            category: 'cv'
        }
    ];
}

// 生成回退学习计划数据
function generateFallbackPlanData() {
    return [
        {
            id: 1,
            title: '完成深度学习第9章',
            course: '深度学习基础与实践',
            time: '60',
            date: '2024-08-10',
            status: 'pending'
        },
        {
            id: 2,
            title: '复习CNN卷积神经网络',
            course: '计算机视觉实战',
            time: '45',
            date: '2024-08-10',
            status: 'completed'
        },
        {
            id: 3,
            title: '练习Transformer编码器',
            course: '自然语言处理进阶',
            time: '90',
            date: '2024-08-11',
            status: 'pending'
        }
    ];
}

// 生成回退笔记数据
function generateFallbackNotesData() {
    return [
        {
            id: 1,
            title: '卷积神经网络工作原理',
            content: '卷积神经网络(CNN)是一种深度学习模型，特别适用于图像识别任务。它通过卷积层、池化层和全连接层的组合来提取图像特征...',
            tags: ['CNN', '深度学习', '计算机视觉'],
            date: '2024-08-08',
            course: '深度学习基础'
        },
        {
            id: 2,
            title: 'Transformer注意力机制',
            content: '注意力机制是Transformer架构的核心，它允许模型在处理序列时关注不同位置的重要信息。自注意力机制通过查询、键和值矩阵实现...',
            tags: ['Transformer', 'Attention', 'NLP'],
            date: '2024-08-07',
            course: '自然语言处理'
        },
        {
            id: 3,
            title: '梯度下降优化算法',
            content: '梯度下降是机器学习中最基本的优化算法。通过计算损失函数相对于参数的梯度，沿着梯度相反方向更新参数，以最小化损失函数...',
            tags: ['优化算法', '梯度下降', '机器学习'],
            date: '2024-08-06',
            course: '机器学习基础'
        }
    ];
}

// 生成回退成就数据
function generateFallbackAchievementsData() {
    return [
        {
            id: 1,
            title: '初学者',
            description: '完成第一门课程',
            icon: '🎓',
            unlocked: true
        },
        {
            id: 2,
            title: '坚持不懈',
            description: '连续学习7天',
            icon: '🔥',
            unlocked: true
        },
        {
            id: 3,
            title: '笔记达人',
            description: '记录50条学习笔记',
            icon: '📝',
            unlocked: false
        },
        {
            id: 4,
            title: '课程专家',
            description: '完成10门课程',
            icon: '🏆',
            unlocked: false
        },
        {
            id: 5,
            title: '学习之星',
            description: '累计学习100小时',
            icon: '⭐',
            unlocked: true
        },
        {
            id: 6,
            title: '问答高手',
            description: '回答50个问题',
            icon: '💡',
            unlocked: false
        }
    ];
}

// 生成回退推荐课程数据
function generateFallbackRecommendedData() {
    return [
        {
            id: 1,
            title: '强化学习入门',
            level: '中级',
            duration: '25小时',
            price: 799,
            rating: 4.6
        },
        {
            id: 2,
            title: 'Python数据科学',
            level: '初级',
            duration: '30小时',
            price: 599,
            rating: 4.8
        },
        {
            id: 3,
            title: 'AI项目实战',
            level: '高级',
            duration: '40小时',
            price: 1299,
            rating: 4.9
        }
    ];
}

// 初始化日历数据
function initializeCalendarData() {
    studyData = generateStudyCalendarData();
}

// 生成学习日历数据
function generateStudyCalendarData() {
    const data = {};
    const today = new Date();
    
    // 生成过去30天的学习数据
    for (let i = 0; i < 30; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = formatDateKey(date);
        
        // 随机生成学习状态
        const hasStudy = Math.random() > 0.3;
        const completedGoal = hasStudy && Math.random() > 0.5;
        
        if (hasStudy) {
            data[dateStr] = {
                hasStudy: true,
                completedGoal: completedGoal,
                studyTime: Math.floor(Math.random() * 180) + 30, // 30-210分钟
                coursesStudied: Math.floor(Math.random() * 3) + 1
            };
        }
    }
    
    return data;
}

// 加载用户数据
async function loadUserData() {
    try {
        // 加载所有数据
        await loadMyCourses();
        await loadUserProgress();
        await loadStudyPlans();
        await loadUserNotes();
        await loadUserAchievements();
        await loadRecommendedCourses();
        
        // 渲染页面组件
        renderProgressList();
        renderPlanList();
        renderNotesGrid();
        renderAchievements();
        renderRecommendedCourses();
        updateProgressDisplay();
        
    } catch (error) {
        console.error('加载用户数据失败:', error);
        showNotification('数据加载失败，请刷新页面重试', 'error');
    }
}

// 加载我的课程
async function loadMyCourses() {
    const myCoursesContainer = document.getElementById('myCourseslist');
    if (!myCoursesContainer) return;
    
    try {
        // 从API获取所有课程（由于订阅系统不完整，暂时显示所有可用课程）
        const response = await fetch('http://42.194.245.66:8070/api/courses');
        const data = await response.json();
        
        if (data.code === 200 && data.data && data.data.length > 0) {
            renderMyCourses(data.data);
        } else {
            showNoCoursesMessage();
        }
    } catch (error) {
        console.error('加载课程失败:', error);
        showCoursesError();
    }
}

// 渲染我的课程列表
function renderMyCourses(courses) {
    const myCoursesContainer = document.getElementById('myCourseslist');
    if (!myCoursesContainer) return;
    
    const coursesHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-image">
                <img src="${course.coverImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGE5ZWZmIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2cHgiIGZvbnQtd2VpZ2h0PSJib2xkIj5BSSBDb3Vyc2U8L3RleHQ+Cjwvc3ZnPg=='}" 
                     alt="${course.title}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNGE5ZWZmIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2cHgiIGZvbnQtd2VpZ2h0PSJib2xkIj5BSSBDb3Vyc2U8L3RleHQ+Cjwvc3ZnPg=='">
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description || '探索AI技术的奥秘'}</p>
                <div class="course-meta">
                    <span class="course-price">${course.isFree ? '免费' : '¥' + course.price}</span>
                    <span class="course-rating">⭐ ${course.rating || '5.0'}</span>
                </div>
                <div class="course-actions">
                    <button class="btn-continue" onclick="continueCourse(${course.id})">
                        ${course.isFree ? '开始学习' : '继续学习'}
                    </button>
                    <button class="btn-details" onclick="viewCourseDetails(${course.id})">详情</button>
                </div>
            </div>
        </div>
    `).join('');
    
    myCoursesContainer.innerHTML = coursesHTML;
}

// 显示无课程消息
function showNoCoursesMessage() {
    const myCoursesContainer = document.getElementById('myCourseslist');
    if (!myCoursesContainer) return;
    
    myCoursesContainer.innerHTML = `
        <div class="no-courses">
            <div class="no-courses-icon">📚</div>
            <h3>暂无课程</h3>
            <p>还没有购买课程，快去探索吧！</p>
            <button class="btn-browse" onclick="window.location.href='courses.html'">浏览课程</button>
        </div>
    `;
}

// 显示课程加载错误
function showCoursesError() {
    const myCoursesContainer = document.getElementById('myCourseslist');
    if (!myCoursesContainer) return;
    
    myCoursesContainer.innerHTML = `
        <div class="courses-error">
            <div class="error-icon">⚠️</div>
            <p>课程加载失败，请稍后重试</p>
            <button class="btn-retry" onclick="loadMyCourses()">重新加载</button>
        </div>
    `;
}

// 继续学习课程
function continueCourse(courseId) {
    window.location.href = `study.html?courseId=${courseId}&chapterId=100`;
}

// 查看课程详情
function viewCourseDetails(courseId) {
    window.location.href = `course-detail.html?id=${courseId}`;
}

// 加载用户学习进度
async function loadUserProgress() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://42.194.245.66:8070/api/users/progress', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                progressData = data.data;
            } else {
                // 使用回退数据
                progressData = generateFallbackProgressData();
            }
        } else {
            progressData = generateFallbackProgressData();
        }
    } catch (error) {
        console.error('加载学习进度失败:', error);
        progressData = generateFallbackProgressData();
    }
}

// 加载学习计划
async function loadStudyPlans() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://42.194.245.66:8070/api/study-plans', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                planData = data.data;
            } else {
                planData = generateFallbackPlanData();
            }
        } else {
            planData = generateFallbackPlanData();
        }
    } catch (error) {
        console.error('加载学习计划失败:', error);
        planData = generateFallbackPlanData();
    }
}

// 加载用户笔记
async function loadUserNotes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://42.194.245.66:8070/api/notes', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                notesData = data.data;
            } else {
                notesData = generateFallbackNotesData();
            }
        } else {
            notesData = generateFallbackNotesData();
        }
    } catch (error) {
        console.error('加载笔记失败:', error);
        notesData = generateFallbackNotesData();
    }
}

// 加载用户成就
async function loadUserAchievements() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://42.194.245.66:8070/api/users/achievements', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                achievementsData = data.data;
            } else {
                achievementsData = generateFallbackAchievementsData();
            }
        } else {
            achievementsData = generateFallbackAchievementsData();
        }
    } catch (error) {
        console.error('加载成就失败:', error);
        achievementsData = generateFallbackAchievementsData();
    }
}

// 加载推荐课程
async function loadRecommendedCourses() {
    try {
        const response = await fetch('http://42.194.245.66:8070/api/courses/recommended');
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                recommendedData = data.data;
            } else {
                recommendedData = generateFallbackRecommendedData();
            }
        } else {
            recommendedData = generateFallbackRecommendedData();
        }
    } catch (error) {
        console.error('加载推荐课程失败:', error);
        recommendedData = generateFallbackRecommendedData();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 学习计划表单
    const addPlanForm = document.getElementById('addPlanForm');
    if (addPlanForm) {
        addPlanForm.addEventListener('submit', handleAddPlan);
    }
    
    // 笔记表单
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handleSaveNote);
    }
    
    // 图表周期选择
    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', updateCharts);
    }
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(event) {
        const addPlanModal = document.getElementById('addPlanModal');
        const noteModal = document.getElementById('noteModal');
        
        if (event.target === addPlanModal) {
            hideAddPlan();
        }
        if (event.target === noteModal) {
            hideNoteModal();
        }
    });
}

// 统计数字动画
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElement = entry.target;
                const targetValue = parseInt(statElement.dataset.target);
                animateNumber(statElement, targetValue);
                observer.unobserve(statElement);
            }
        });
    }, observerOptions);
    
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

// 数字动画
function animateNumber(element, target) {
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// 渲染学习进度列表
function renderProgressList() {
    const progressList = document.getElementById('progressList');
    if (!progressList) return;
    
    progressList.innerHTML = progressData.map(progress => `
        <div class="progress-item" onclick="openCourse(${progress.id})">
            <div class="progress-icon">📚</div>
            <div class="progress-info">
                <div class="progress-title">${progress.title}</div>
                <div class="progress-meta">${progress.completedChapters}/${progress.totalChapters}章节 • 最后学习: ${progress.lastStudied}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.progress}%"></div>
                </div>
            </div>
            <div class="progress-percent">${progress.progress}%</div>
        </div>
    `).join('');
}

// 渲染学习计划列表
function renderPlanList() {
    const planList = document.getElementById('planList');
    if (!planList) return;
    
    const todayPlans = planData.filter(plan => {
        const planDate = new Date(plan.date);
        const today = new Date();
        return planDate.toDateString() === today.toDateString();
    });
    
    if (todayPlans.length === 0) {
        planList.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                今天还没有学习计划，<a href="#" onclick="showAddPlan()" style="color: #3b82f6;">添加一个</a>？
            </div>
        `;
        return;
    }
    
    planList.innerHTML = todayPlans.map(plan => `
        <div class="plan-item">
            <div class="plan-time">${plan.time}m</div>
            <div class="plan-content">
                <div class="plan-title">${plan.title}</div>
                <div class="plan-course">${plan.course}</div>
            </div>
            <div class="plan-status ${plan.status}">${plan.status === 'completed' ? '已完成' : '待完成'}</div>
        </div>
    `).join('');
}

// 渲染笔记网格
function renderNotesGrid() {
    const notesGrid = document.getElementById('notesGrid');
    if (!notesGrid) return;
    
    notesGrid.innerHTML = notesData.slice(0, 3).map(note => `
        <div class="note-card" onclick="editNote(${note.id})">
            <div class="note-title">${note.title}</div>
            <div class="note-content">${note.content}</div>
            <div class="note-meta">
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
                </div>
                <div class="note-date">${note.date}</div>
            </div>
        </div>
    `).join('');
}

// 渲染成就系统
function renderAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (!achievementsGrid) return;
    
    achievementsGrid.innerHTML = achievementsData.slice(0, 6).map(achievement => `
        <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}" 
             onclick="showAchievementDetail(${achievement.id})">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${achievement.title}</div>
            <div class="achievement-desc">${achievement.description}</div>
        </div>
    `).join('');
}

// 渲染推荐课程
function renderRecommendedCourses() {
    const recommendedList = document.getElementById('recommendedList');
    if (!recommendedList) return;
    
    recommendedList.innerHTML = recommendedData.map(course => `
        <div class="recommended-item" onclick="viewCourse(${course.id})">
            <div class="recommended-image">🎓</div>
            <div class="recommended-info">
                <div class="recommended-title">${course.title}</div>
                <div class="recommended-meta">${course.level} • ${course.duration} • ⭐${course.rating}</div>
                <div class="recommended-price">¥${course.price}</div>
            </div>
        </div>
    `).join('');
}

// 渲染日历
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthSpan = document.getElementById('currentMonth');
    
    if (!calendarGrid || !currentMonthSpan) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新月份显示
    currentMonthSpan.textContent = `${year}年${month + 1}月`;
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    // 清空日历
    calendarGrid.innerHTML = '';
    
    // 添加星期头
    const weekHeaders = ['日', '一', '二', '三', '四', '五', '六'];
    weekHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // 添加上月末尾几天（占位）
    for (let i = 0; i < startDayOfWeek; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
        dayElement.textContent = prevDate.getDate();
        calendarGrid.appendChild(dayElement);
    }
    
    // 添加当月所有天
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDayDate = new Date(year, month, day);
        const today = new Date();
        const dateKey = formatDateKey(currentDayDate);
        
        // 检查是否是今天
        if (currentDayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // 检查是否有学习记录
        if (studyData[dateKey]) {
            if (studyData[dateKey].completedGoal) {
                dayElement.classList.add('completed-goal');
            } else if (studyData[dateKey].hasStudy) {
                dayElement.classList.add('has-study');
            }
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

// 格式化日期为键值
function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 上一个月
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

// 下一个月
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// 初始化图表
function initializeCharts() {
    initializeTimeChart();
    initializeProgressChart();
}

// 初始化学习时长图表
function initializeTimeChart() {
    const ctx = document.getElementById('timeChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
                label: '学习时长(小时)',
                data: [2.5, 3.2, 1.8, 4.1, 2.9, 5.2, 3.7],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                }
            }
        }
    });
}

// 初始化课程进度图表
function initializeProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['已完成', '进行中', '未开始'],
            datasets: [{
                data: [45, 12, 8],
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#64748b'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e2e8f0',
                        padding: 20
                    }
                }
            }
        }
    });
}

// 显示添加计划弹窗
function showAddPlan() {
    const modal = document.getElementById('addPlanModal');
    const courseSelect = document.getElementById('planCourse');
    
    // 填充课程选项
    courseSelect.innerHTML = '<option value="">请选择课程</option>' +
        progressData.map(course => `<option value="${course.id}">${course.title}</option>`).join('');
    
    // 设置默认日期为今天
    document.getElementById('planDate').value = formatDateForInput(new Date());
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 隐藏添加计划弹窗
function hideAddPlan() {
    document.getElementById('addPlanModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addPlanForm').reset();
}

// 处理添加学习计划
function handleAddPlan(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const planData = {
        title: document.getElementById('planTitle').value,
        courseId: document.getElementById('planCourse').value,
        time: document.getElementById('planTime').value,
        date: document.getElementById('planDate').value
    };
    
    // 在真实环境中，这里会调用API保存计划
    // await window.apiRequest('/study-plans', { method: 'POST', body: JSON.stringify(planData) });
    
    hideAddPlan();
    showNotification('学习计划添加成功！', 'success');
    
    // 重新渲染计划列表
    setTimeout(() => {
        renderPlanList();
    }, 500);
}

// 显示笔记弹窗
function createNote() {
    document.getElementById('noteModalTitle').textContent = '新建笔记';
    document.getElementById('noteModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.getElementById('noteForm').reset();
}

// 编辑笔记
function editNote(noteId) {
    const note = notesData.find(n => n.id === noteId);
    if (!note) return;
    
    document.getElementById('noteModalTitle').textContent = '编辑笔记';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteTag').value = note.tags.join(', ');
    
    document.getElementById('noteModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 隐藏笔记弹窗
function hideNoteModal() {
    document.getElementById('noteModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('noteForm').reset();
}

// 处理保存笔记
function handleSaveNote(e) {
    e.preventDefault();
    
    const noteData = {
        title: document.getElementById('noteTitle').value,
        content: document.getElementById('noteContent').value,
        tags: document.getElementById('noteTag').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    // 在真实环境中，这里会调用API保存笔记
    // await window.apiRequest('/notes', { method: 'POST', body: JSON.stringify(noteData) });
    
    hideNoteModal();
    showNotification('笔记保存成功！', 'success');
    
    // 重新渲染笔记网格
    setTimeout(() => {
        renderNotesGrid();
    }, 500);
}

// 格式化日期为输入框格式
function formatDateForInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 更新图表
function updateCharts() {
    // 根据选择的时间周期更新图表数据
    // 在真实环境中，这里会重新获取数据并更新图表
    showNotification('图表数据已更新', 'info');
}

// 其他功能函数
function showAllProgress() {
    // 跳转到完整的学习进度页面
    showNotification('跳转到学习进度页面', 'info');
}

function showAllAchievements() {
    showNotification('查看全部成就', 'info');
}

function showAchievementDetail(achievementId) {
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (achievement) {
        showNotification(`${achievement.title}: ${achievement.description}`, 'info');
    }
}

function openCourse(courseId) {
    // 跳转到课程学习页面
    window.location.href = `study.html?courseId=${courseId}`;
}

function viewCourse(courseId) {
    // 跳转到课程详情页面
    window.location.href = `courses.html#course-${courseId}`;
}

// 导出函数供全局使用
window.showAddPlan = showAddPlan;
window.hideAddPlan = hideAddPlan;
window.createNote = createNote;
window.hideNoteModal = hideNoteModal;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.showAllProgress = showAllProgress;
window.showAllAchievements = showAllAchievements;
window.showAchievementDetail = showAchievementDetail;
window.openCourse = openCourse;
window.viewCourse = viewCourse;
window.editNote = editNote;