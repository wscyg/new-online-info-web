// 个人中心功能模块
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.editMode = false;
        this.originalData = {};
        this.init();
    }

    async init() {
        initTheme(); // 初始化主题
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadUserProfile();
        await this.loadOrders();
        this.setupTabSwitching();
        this.handleUrlParameters();
    }

    // 检查用户认证
    async checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log('=== 个人中心登录状态检查 ===');
        console.log('当前页面URL:', window.location.href);
        console.log('当前端口:', window.location.port);
        console.log('Token:', token ? `存在 (长度: ${token.length})` : '不存在');
        console.log('UserData:', userData ? `存在 (长度: ${userData.length})` : '不存在');
        
        // 列出所有localStorage项目
        console.log('=== localStorage所有项目 ===');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value ? `${value.substring(0, 50)}...` : 'null');
        }
        
        if (!token || !userData) {
            console.log('登录信息缺失，跳转到登录页');
            alert('检测到登录状态异常，请重新登录');
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            window.location.href = isDev ? '/src/pages/login.html' : '/login.html';
            return;
        }
        
        try {
            this.currentUser = JSON.parse(userData);
            console.log('用户信息解析成功:', this.currentUser.username);
            
            // 显示用户头像和隐藏登录按钮
            this.showUserProfileNav();
        } catch (error) {
            console.error('Error parsing user data:', error);
            alert('用户信息解析失败，请重新登录');
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            window.location.href = isDev ? '/src/pages/login.html' : '/login.html';
        }
    }

    // 显示导航栏用户头像
    showUserProfileNav() {
        const authContainer = document.getElementById('authContainer');
        const userProfile = document.getElementById('userProfile');
        
        if (authContainer) authContainer.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        
        // 更新用户信息
        if (this.currentUser) {
            const userName = document.getElementById('userName');
            const userPoints = document.getElementById('userPoints');
            
            if (userName) userName.textContent = this.currentUser.username || this.currentUser.nickname || '用户';
            if (userPoints) userPoints.textContent = this.currentUser.points || '0';
            
            // 设置头像
            this.setUserAvatar(this.currentUser.avatar);
        }
    }
    
    // 设置用户头像
    setUserAvatar(avatarUrl) {
        const avatarElements = document.querySelectorAll('#userAvatar, #userAvatarSmall');
        const defaultAvatar = '/assets/avatar-default.svg';
        
        avatarElements.forEach(element => {
            if (element) {
                element.src = avatarUrl || defaultAvatar;
                element.onerror = () => {
                    element.src = defaultAvatar;
                };
            }
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        // 编辑模式切换
        window.toggleEditMode = () => this.toggleEditMode();
        window.savePersonalInfo = () => this.savePersonalInfo();
        window.cancelEdit = () => this.cancelEdit();
        
        // 用户菜单切换
        window.toggleUserMenu = () => this.toggleUserMenu();
        window.handleLogout = () => this.handleLogout();
        
        // 订单过滤
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterOrders(e.target.dataset.status);
                // 更新按钮状态
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    // 设置标签页切换
    setupTabSwitching() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
                
                // 更新按钮状态
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    // 切换标签页
    switchTab(tabName) {
        // 隐藏所有面板
        document.querySelectorAll('.content-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // 显示对应面板
        const targetPanel = this.getPanelId(tabName);
        const panel = document.getElementById(targetPanel);
        if (panel) {
            panel.classList.add('active');
        }
    }

    // 获取面板ID
    getPanelId(tabName) {
        const panelMap = {
            'overview': 'overviewPanel',
            'personal-info': 'personalInfoPanel',
            'orders': 'ordersPanel',
            'achievements': 'achievementsPanel',
            'certificates': 'certificatesPanel',
            'skills': 'skillsPanel',
            'settings': 'settingsPanel'
        };
        return panelMap[tabName] || 'overviewPanel';
    }

    // 处理URL参数
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        
        if (tabParam) {
            // 切换到指定标签页
            this.switchTab(tabParam);
            
            // 更新按钮状态
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.tab === tabParam) {
                    btn.classList.add('active');
                }
            });
        }
    }

    // 加载用户资料
    async loadUserProfile() {
        if (!this.currentUser) return;
        
        try {
            // 填充个人信息表单
            const fields = {
                'displayName': this.currentUser.nickname || this.currentUser.username,
                'username': this.currentUser.username,
                'email': this.currentUser.email,
                'phone': this.currentUser.phone || '',
                'city': this.currentUser.city || '',
                'birthday': this.currentUser.birthday || '',
                'bio': this.currentUser.bio || ''
            };
            
            Object.keys(fields).forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.value = fields[fieldId];
                }
            });
            
            // 填充统计信息
            this.updateAccountStats();
            
            // 更新头部个人信息
            this.updateProfileHeader();
            
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    // 更新账户统计
    updateAccountStats() {
        const registrationElement = document.getElementById('registrationDate');
        const lastLoginElement = document.getElementById('lastLoginDate');
        const studyDaysElement = document.getElementById('studyDays');
        
        if (registrationElement && this.currentUser.createdAt) {
            registrationElement.textContent = this.formatDate(this.currentUser.createdAt);
        }
        
        if (lastLoginElement) {
            lastLoginElement.textContent = '今天';
        }
        
        if (studyDaysElement) {
            // 计算学习天数 (注册到现在的天数)
            const registrationDate = new Date(this.currentUser.createdAt);
            const today = new Date();
            const daysDiff = Math.ceil((today - registrationDate) / (1000 * 60 * 60 * 24));
            studyDaysElement.textContent = `${daysDiff} 天`;
        }
    }

    // 更新头部个人信息
    updateProfileHeader() {
        // 这里可以更新头像、姓名等显示
        const profileName = document.querySelector('.profile-name');
        if (profileName) {
            profileName.textContent = this.currentUser.nickname || this.currentUser.username;
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 切换编辑模式
    toggleEditMode() {
        this.editMode = !this.editMode;
        const inputs = document.querySelectorAll('#personalInfoPanel input, #personalInfoPanel textarea');
        const editToggleText = document.getElementById('editToggleText');
        const formActions = document.getElementById('formActions');
        
        if (this.editMode) {
            // 保存原始数据
            this.originalData = {};
            inputs.forEach(input => {
                input.removeAttribute('readonly');
                input.classList.add('editable');
                this.originalData[input.id] = input.value;
            });
            editToggleText.textContent = '取消';
            formActions.style.display = 'flex';
        } else {
            this.cancelEdit();
        }
    }

    // 保存个人信息
    async savePersonalInfo() {
        try {
            const formData = {
                nickname: document.getElementById('displayName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                city: document.getElementById('city').value,
                birthday: document.getElementById('birthday').value,
                bio: document.getElementById('bio').value
            };
            
            // 这里应该调用API更新用户信息
            // const response = await window.API.user.updateProfile(formData);
            
            // 暂时更新本地存储
            const updatedUser = { ...this.currentUser, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.currentUser = updatedUser;
            
            // 退出编辑模式
            this.exitEditMode();
            
            // 显示成功消息
            this.showMessage('个人信息已保存', 'success');
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showMessage('保存失败，请稍后重试', 'error');
        }
    }

    // 取消编辑
    cancelEdit() {
        // 恢复原始数据
        Object.keys(this.originalData).forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = this.originalData[fieldId];
            }
        });
        
        this.exitEditMode();
    }

    // 退出编辑模式
    exitEditMode() {
        this.editMode = false;
        const inputs = document.querySelectorAll('#personalInfoPanel input, #personalInfoPanel textarea');
        const editToggleText = document.getElementById('editToggleText');
        const formActions = document.getElementById('formActions');
        
        inputs.forEach(input => {
            input.setAttribute('readonly', true);
            input.classList.remove('editable');
        });
        editToggleText.textContent = '编辑';
        formActions.style.display = 'none';
    }

    // 加载订单数据
    async loadOrders(status = 'all') {
        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');
        
        try {
            // 这里应该调用API获取订单数据
            // const orders = await window.API.order.getSubscriptions({ status });
            
            // 模拟订单数据
            const mockOrders = [
                {
                    id: 'ORD001',
                    courseTitle: 'Transformer架构深度解析',
                    amount: 299.00,
                    status: 'paid',
                    createdAt: '2025-01-10T10:00:00',
                    paymentMethod: '支付宝'
                },
                {
                    id: 'ORD002',
                    courseTitle: '深度学习实战项目',
                    amount: 399.00,
                    status: 'completed',
                    createdAt: '2025-01-08T14:30:00',
                    paymentMethod: '微信支付'
                }
            ];
            
            this.renderOrders(mockOrders);
            
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<div class="error-state">加载订单失败，请刷新重试</div>';
        }
    }

    // 渲染订单列表
    renderOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');
        
        if (orders.length === 0) {
            ordersList.style.display = 'none';
            noOrders.style.display = 'block';
            return;
        }
        
        ordersList.style.display = 'block';
        noOrders.style.display = 'none';
        
        const ordersHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-id">#${order.id}</span>
                        <span class="order-date">${this.formatDate(order.createdAt)}</span>
                    </div>
                    <div class="order-status ${order.status}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                <div class="order-content">
                    <div class="course-info">
                        <h4 class="course-title">${order.courseTitle}</h4>
                        <p class="payment-method">支付方式：${order.paymentMethod}</p>
                    </div>
                    <div class="order-amount">
                        <span class="amount">￥${order.amount.toFixed(2)}</span>
                    </div>
                </div>
                <div class="order-actions">
                    ${this.getOrderActions(order)}
                </div>
            </div>
        `).join('');
        
        ordersList.innerHTML = ordersHTML;
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'pending': '待支付',
            'paid': '已支付',
            'completed': '已完成',
            'refunded': '已退款',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    }

    // 获取订单操作按钮
    getOrderActions(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button class="btn-action primary" onclick="payOrder('${order.id}')">立即支付</button>
                    <button class="btn-action secondary" onclick="cancelOrder('${order.id}')">取消订单</button>
                `;
            case 'paid':
            case 'completed':
                return `
                    <button class="btn-action secondary" onclick="viewCourse('${order.id}')">查看课程</button>
                    <button class="btn-action secondary" onclick="requestRefund('${order.id}')">申请退款</button>
                `;
            default:
                return '';
        }
    }

    // 过滤订单
    async filterOrders(status) {
        await this.loadOrders(status);
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // 显示动画
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // 3秒后自动消失
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
    
    // 切换用户菜单
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }
    
    // 处理退出登录
    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            window.location.href = isDev ? '/src/pages/login.html' : '/login.html';
        }
    }
}

// 订单相关全局函数
window.payOrder = async (orderId) => {
    alert(`支付订单 ${orderId} - 功能开发中`);
};

window.cancelOrder = async (orderId) => {
    if (confirm('确认取消这个订单吗？')) {
        alert(`取消订单 ${orderId} - 功能开发中`);
    }
};

window.viewCourse = (orderId) => {
    window.open('/src/pages/courses.html', '_blank');
};

window.requestRefund = async (orderId) => {
    if (confirm('确认申请退款吗？')) {
        alert(`申请退款 ${orderId} - 功能开发中`);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// CSS样式
const profileStyles = document.createElement('style');
profileStyles.textContent = `
    /* 个人信息面板样式 */
    .personal-info-section {
        padding: 24px;
    }
    
    .info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    
    .info-header h3 {
        margin: 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
    }
    
    .btn-edit {
        background: rgba(74, 158, 255, 0.1);
        border: 1px solid rgba(74, 158, 255, 0.3);
        color: #4a9eff;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .btn-edit:hover {
        background: rgba(74, 158, 255, 0.2);
    }
    
    .info-form {
        margin-bottom: 32px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
    }
    
    .form-group.full-width {
        grid-column: 1 / -1;
    }
    
    .form-group label {
        color: #d1d5db;
        font-size: 14px;
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .form-group input,
    .form-group textarea {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #4a9eff;
        background: rgba(255, 255, 255, 0.08);
    }
    
    .form-group input.editable,
    .form-group textarea.editable {
        border-color: rgba(74, 158, 255, 0.5);
        background: rgba(255, 255, 255, 0.08);
    }
    
    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
    }
    
    .btn-save,
    .btn-cancel {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }
    
    .btn-save {
        background: #10b981;
        color: white;
    }
    
    .btn-save:hover {
        background: #059669;
    }
    
    .btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
    }
    
    .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .account-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }
    
    .stat-item {
        text-align: center;
    }
    
    .stat-label {
        display: block;
        color: #9ca3af;
        font-size: 12px;
        margin-bottom: 4px;
    }
    
    .stat-value {
        display: block;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
    }
    
    /* 订单面板样式 */
    .orders-section {
        padding: 24px;
    }
    
    .orders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    
    .orders-header h3 {
        margin: 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
    }
    
    .orders-filter {
        display: flex;
        gap: 8px;
    }
    
    .filter-btn {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .filter-btn.active,
    .filter-btn:hover {
        background: rgba(74, 158, 255, 0.1);
        border-color: rgba(74, 158, 255, 0.3);
        color: #4a9eff;
    }
    
    .order-item {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        margin-bottom: 16px;
        overflow: hidden;
    }
    
    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .order-info {
        display: flex;
        gap: 16px;
        align-items: center;
    }
    
    .order-id {
        color: #4a9eff;
        font-weight: 600;
        font-size: 14px;
    }
    
    .order-date {
        color: #9ca3af;
        font-size: 14px;
    }
    
    .order-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .order-status.pending {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
    }
    
    .order-status.paid {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }
    
    .order-status.completed {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
    }
    
    .order-status.refunded {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
    }
    
    .order-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
    }
    
    .course-title {
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
    }
    
    .payment-method {
        color: #9ca3af;
        font-size: 14px;
        margin: 0;
    }
    
    .amount {
        color: #4a9eff;
        font-size: 18px;
        font-weight: 700;
    }
    
    .order-actions {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        justify-content: flex-end;
    }
    
    .btn-action {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }
    
    .btn-action.primary {
        background: #4a9eff;
        color: white;
    }
    
    .btn-action.primary:hover {
        background: #3b82f6;
    }
    
    .btn-action.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
    }
    
    .btn-action.secondary:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .loading-state,
    .error-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #9ca3af;
        flex-direction: column;
        gap: 12px;
    }
    
    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top: 3px solid #4a9eff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    .no-orders {
        text-align: center;
        padding: 60px 20px;
        color: #9ca3af;
    }
    
    .no-data-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }
    
    .no-orders p {
        margin: 0 0 20px 0;
        font-size: 16px;
    }
    
    .btn-browse {
        display: inline-block;
        padding: 10px 20px;
        background: #4a9eff;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: background 0.2s;
    }
    
    .btn-browse:hover {
        background: #3b82f6;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* 响应式设计 */
    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .account-stats {
            grid-template-columns: 1fr;
        }
        
        .orders-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
        }
        
        .orders-filter {
            flex-wrap: wrap;
        }
        
        .order-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }
        
        .order-actions {
            flex-wrap: wrap;
        }
    }
`;

document.head.appendChild(profileStyles);

export default ProfileManager;