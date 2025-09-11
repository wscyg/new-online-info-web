// Dashboard Main JavaScript
(function() {
    'use strict';

    // State
    let currentMonth = new Date();
    let studyCalendarData = {};
    let userCourses = [];
    let userPlans = [];
    let userNotes = [];
    let userAchievements = [];

    // Initialize Dashboard
    document.addEventListener('DOMContentLoaded', function() {
        initDashboard();
    });

    async function initDashboard() {
        // Check authentication
        if (!isAuthenticated()) {
            window.location.href = 'login.html?redirect=dashboard.html';
            return;
        }

        // Load user info
        const user = getCurrentUser();
        if (user) {
            document.getElementById('username').textContent = user.username || user.name || '学员';
        }

        // Load dashboard data
        await Promise.all([
            loadStatistics(),
            loadMyCourses(),
            loadTodayPlans(),
            loadRecentNotes(),
            loadAchievements(),
            loadStudyCalendar()
        ]);

        // Initialize calendar
        renderCalendar();

        // Setup event listeners
        setupEventListeners();
    }

    // Load Statistics
    async function loadStatistics() {
        try {
            const stats = await api.get('/user/statistics');
            
            // Update stat cards
            updateStatCard('totalCourses', stats.learningCourses || 0);
            updateStatCard('completedCourses', stats.completedCourses || 0);
            updateStatCard('totalHours', stats.studyHours || 0);
            updateStatCard('totalPoints', stats.totalPoints || 0);
            
            // Update sidebar stats
            document.getElementById('todayStudyTime').textContent = `${stats.todayMinutes || 0}分钟`;
            document.getElementById('continuousDays').textContent = `${stats.continuousDays || 0}天`;
            document.getElementById('weekPoints').textContent = stats.weekPoints || 0;
            
        } catch (error) {
            console.error('Failed to load statistics:', error);
            // Use default values
            updateStatCard('totalCourses', 3);
            updateStatCard('completedCourses', 1);
            updateStatCard('totalHours', 24);
            updateStatCard('totalPoints', 350);
        }
    }

    function updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            animateNumber(element, 0, value, 1000);
        }
    }

    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const diff = end - start;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.floor(start + diff * progress);
            element.textContent = value;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    // Load My Courses
    async function loadMyCourses() {
        const container = document.getElementById('myCoursesGrid');
        
        try {
            const courses = await api.get('/user/courses');
            userCourses = courses;
            
            if (courses.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>还没有注册任何课程</p>
                        <a href="courses.html" class="btn btn-primary">浏览课程</a>
                    </div>
                `;
                return;
            }
            
            // Display first 3 courses
            const courseCards = courses.slice(0, 3).map(course => `
                <div class="course-card" onclick="window.location.href='study.html?courseId=${course.id}'">
                    <div class="course-image">
                        <img src="${course.coverImage || '/images/course-placeholder.png'}" alt="${course.title}">
                    </div>
                    <div class="course-info">
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${course.progress || 0}%"></div>
                            </div>
                            <span class="progress-text">${course.progress || 0}% 完成</span>
                        </div>
                        <button class="btn btn-primary btn-sm">继续学习</button>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = courseCards;
            
        } catch (error) {
            console.error('Failed to load courses:', error);
            container.innerHTML = '<p class="error-message">加载课程失败</p>';
        }
    }

    // Load Today's Plans
    async function loadTodayPlans() {
        const container = document.getElementById('todayPlanList');
        
        try {
            const plans = await api.get('/user/study-plans/today');
            userPlans = plans;
            
            if (plans.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>今天还没有学习计划</p>
                        <button class="btn btn-secondary" onclick="openAddPlanModal()">创建计划</button>
                    </div>
                `;
                return;
            }
            
            const planItems = plans.map(plan => `
                <div class="plan-item ${plan.completed ? 'completed' : ''}">
                    <input type="checkbox" ${plan.completed ? 'checked' : ''} 
                           onchange="togglePlanStatus(${plan.id}, this.checked)">
                    <div class="plan-content">
                        <h4>${plan.title}</h4>
                        <p>${plan.courseName} · ${plan.duration}分钟</p>
                    </div>
                    <button class="btn btn-text" onclick="editPlan(${plan.id})">编辑</button>
                </div>
            `).join('');
            
            container.innerHTML = planItems;
            
        } catch (error) {
            console.error('Failed to load plans:', error);
            container.innerHTML = '<p class="error-message">加载计划失败</p>';
        }
    }

    // Load Recent Notes
    async function loadRecentNotes() {
        const container = document.getElementById('recentNotesGrid');
        
        try {
            const notes = await api.get('/user/notes?limit=4');
            userNotes = notes;
            
            if (notes.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>还没有学习笔记</p>
                        <a href="notes.html" class="btn btn-secondary">写笔记</a>
                    </div>
                `;
                return;
            }
            
            const noteCards = notes.map(note => `
                <div class="note-card" onclick="window.location.href='notes.html#note-${note.id}'">
                    <h4 class="note-title">${note.title}</h4>
                    <p class="note-content">${note.content.substring(0, 100)}...</p>
                    <div class="note-meta">
                        <span class="note-date">${formatDate(note.createdAt)}</span>
                        ${note.tags ? `<span class="note-tags">${note.tags.join(', ')}</span>` : ''}
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = noteCards;
            
        } catch (error) {
            console.error('Failed to load notes:', error);
            container.innerHTML = '<p class="error-message">加载笔记失败</p>';
        }
    }

    // Load Achievements
    async function loadAchievements() {
        const container = document.getElementById('achievementsGrid');
        
        try {
            const achievements = await api.get('/user/achievements');
            userAchievements = achievements;
            
            if (achievements.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>还没有获得成就</p>
                        <a href="achievements.html" class="btn btn-secondary">查看成就</a>
                    </div>
                `;
                return;
            }
            
            // Display first 6 achievements
            const achievementCards = achievements.slice(0, 6).map(achievement => `
                <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <h4 class="achievement-name">${achievement.name}</h4>
                    <p class="achievement-desc">${achievement.description}</p>
                </div>
            `).join('');
            
            container.innerHTML = achievementCards;
            
        } catch (error) {
            console.error('Failed to load achievements:', error);
            // Show sample achievements
            container.innerHTML = `
                <div class="achievement-card unlocked">
                    <div class="achievement-icon">🎓</div>
                    <h4 class="achievement-name">初学者</h4>
                    <p class="achievement-desc">完成第一门课程</p>
                </div>
                <div class="achievement-card locked">
                    <div class="achievement-icon">🏆</div>
                    <h4 class="achievement-name">学习达人</h4>
                    <p class="achievement-desc">连续学习30天</p>
                </div>
            `;
        }
    }

    // Load Study Calendar Data
    async function loadStudyCalendar() {
        try {
            const data = await api.get('/user/study-calendar');
            studyCalendarData = data;
        } catch (error) {
            console.error('Failed to load calendar data:', error);
            // Generate sample data
            studyCalendarData = generateSampleCalendarData();
        }
    }

    function generateSampleCalendarData() {
        const data = {};
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = formatDateKey(date);
            
            if (Math.random() > 0.3) {
                data[dateStr] = {
                    studied: true,
                    minutes: Math.floor(Math.random() * 120) + 30,
                    completed: Math.random() > 0.5
                };
            }
        }
        
        return data;
    }

    // Calendar Functions
    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthLabel = document.getElementById('currentMonth');
        
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        monthLabel.textContent = `${year}年${month + 1}月`;
        
        // Clear grid
        grid.innerHTML = '';
        
        // Add weekday headers
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            grid.appendChild(header);
        });
        
        // Get first day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }
        
        // Add days of month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = formatDateKey(date);
            const dayCell = document.createElement('div');
            
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            
            // Check if today
            if (date.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }
            
            // Check study data
            if (studyCalendarData[dateKey]) {
                if (studyCalendarData[dateKey].completed) {
                    dayCell.classList.add('goal-completed');
                } else if (studyCalendarData[dateKey].studied) {
                    dayCell.classList.add('studied');
                }
            }
            
            grid.appendChild(dayCell);
        }
    }

    function formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        if (days < 365) return `${Math.floor(days / 30)}月前`;
        return `${Math.floor(days / 365)}年前`;
    }

    // Event Listeners
    function setupEventListeners() {
        // Add plan form
        const addPlanForm = document.getElementById('addPlanForm');
        if (addPlanForm) {
            addPlanForm.addEventListener('submit', handleAddPlan);
        }
    }

    // Modal Functions
    window.openAddPlanModal = function() {
        const modal = document.getElementById('addPlanModal');
        modal.classList.add('show');
        
        // Set today's date as default
        const dateInput = document.getElementById('planDate');
        dateInput.value = formatDateKey(new Date());
        
        // Load courses for select
        loadCoursesForSelect();
    };

    window.closeAddPlanModal = function() {
        const modal = document.getElementById('addPlanModal');
        modal.classList.remove('show');
        document.getElementById('addPlanForm').reset();
    };

    async function loadCoursesForSelect() {
        const select = document.getElementById('planCourse');
        
        try {
            const courses = await api.get('/courses');
            select.innerHTML = '<option value="">请选择课程</option>' +
                courses.map(course => `<option value="${course.id}">${course.title}</option>`).join('');
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    }

    async function handleAddPlan(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const planData = {
            title: formData.get('title'),
            courseId: formData.get('courseId'),
            duration: parseInt(formData.get('duration')),
            date: formData.get('date'),
            description: formData.get('description')
        };
        
        try {
            await api.post('/user/study-plans', planData);
            showNotification('计划添加成功', 'success');
            closeAddPlanModal();
            loadTodayPlans();
        } catch (error) {
            console.error('Failed to add plan:', error);
            showNotification('添加计划失败', 'error');
        }
    }

    window.togglePlanStatus = async function(planId, completed) {
        try {
            await api.put(`/user/study-plans/${planId}`, { completed });
            showNotification('计划状态已更新', 'success');
            loadTodayPlans();
        } catch (error) {
            console.error('Failed to update plan:', error);
            showNotification('更新失败', 'error');
        }
    };

    window.editPlan = function(planId) {
        // TODO: Implement edit plan
        showNotification('编辑功能开发中', 'info');
    };

    // Calendar navigation
    window.previousMonth = function() {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    };

    window.nextMonth = function() {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    };

})();