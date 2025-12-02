// 师徒系统前端逻辑 - 增强版
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8070/api'
    : 'http://42.194.245.66:8070/api';

class MentorshipManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.relationships = null;
        this.init();
    }

    init() {
        if (!this.token) {
            window.location.href = '../login.html';
            return;
        }

        this.addStyles();
        this.setupUI();
        this.loadData();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.3); }
                50% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); }
            }
            .mentorship-card {
                animation: fadeInUp 0.4s ease forwards;
                transition: all 0.3s ease;
            }
            .mentorship-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.1);
            }
            .exp-share-indicator {
                background: linear-gradient(90deg, #8b5cf6, #a855f7, #8b5cf6);
                background-size: 200% 100%;
                animation: shimmer 2s infinite;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: bold;
            }
            .graduation-glow {
                animation: glow 2s infinite;
            }
            .modal-overlay {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .modal-overlay.active {
                opacity: 1;
            }
            .modal-content {
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s ease;
            }
            .modal-overlay.active .modal-content {
                transform: scale(1) translateY(0);
            }
            .btn-primary {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                transition: all 0.3s ease;
            }
            .btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            }
            .btn-primary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .btn-secondary {
                background: #f3f4f6;
                color: #374151;
                transition: all 0.3s ease;
            }
            .btn-secondary:hover {
                background: #e5e7eb;
            }
            .pending-invitation {
                animation: pulse 2s infinite;
            }
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 12px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                animation: fadeInUp 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .toast.success {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .toast.error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }
            .toast.info {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            }
            .loading-skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
            }
            .avatar-wrapper {
                position: relative;
            }
            .avatar-wrapper::after {
                content: '';
                position: absolute;
                inset: -2px;
                border-radius: 50%;
                background: linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b);
                z-index: -1;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .avatar-wrapper:hover::after {
                opacity: 1;
            }
            .search-container {
                position: relative;
            }
            .search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                max-height: 200px;
                overflow-y: auto;
                z-index: 100;
                display: none;
            }
            .search-results.active {
                display: block;
            }
            .search-result-item {
                padding: 12px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .search-result-item:hover {
                background: #f3f4f6;
            }
        `;
        document.head.appendChild(style);
    }

    setupUI() {
        // Display user info
        const userInfoEl = document.getElementById('userInfo');
        if (userInfoEl) {
            userInfoEl.textContent = this.user.nickname || this.user.username || '用户';
        }

        // Invite button
        const inviteBtn = document.getElementById('inviteBtn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => this.showInviteModal());
        }

        // Invite modal
        const closeInviteModal = document.getElementById('closeInviteModal');
        if (closeInviteModal) {
            closeInviteModal.addEventListener('click', () => this.hideInviteModal());
        }

        const cancelInviteBtn = document.getElementById('cancelInviteBtn');
        if (cancelInviteBtn) {
            cancelInviteBtn.addEventListener('click', () => this.hideInviteModal());
        }

        const sendInviteBtn = document.getElementById('sendInviteBtn');
        if (sendInviteBtn) {
            sendInviteBtn.addEventListener('click', () => this.sendInvitation());
        }

        // Detail modal
        const closeDetailModal = document.getElementById('closeDetailModal');
        if (closeDetailModal) {
            closeDetailModal.addEventListener('click', () => this.hideDetailModal());
        }

        // User search with debounce
        const apprenticeInput = document.getElementById('apprenticeInput');
        if (apprenticeInput) {
            let searchTimeout;
            apprenticeInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.searchUsers(e.target.value), 300);
            });
        }

        // Click outside modal to close
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    async loadData() {
        this.showLoadingSkeleton();
        try {
            await Promise.all([
                this.loadRelationships(),
                this.loadPendingInvitations()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showToast('加载数据失败: ' + error.message, 'error');
        }
    }

    showLoadingSkeleton() {
        const mentorList = document.getElementById('mentorList');
        const apprenticeList = document.getElementById('apprenticeList');

        const skeletonHTML = `
            <div class="loading-skeleton" style="height: 80px; margin-bottom: 12px;"></div>
            <div class="loading-skeleton" style="height: 80px; margin-bottom: 12px;"></div>
        `;

        if (mentorList) mentorList.innerHTML = skeletonHTML;
        if (apprenticeList) apprenticeList.innerHTML = skeletonHTML;
    }

    async searchUsers(query) {
        if (!query || query.length < 2) {
            this.hideSearchResults();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.code === 200) {
                    this.showSearchResults(data.data);
                }
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(users) {
        let container = document.getElementById('searchResults');
        if (!container) {
            container = document.createElement('div');
            container.id = 'searchResults';
            container.className = 'search-results';
            document.getElementById('apprenticeInput').parentNode.appendChild(container);
        }

        if (!users || users.length === 0) {
            container.innerHTML = '<div class="search-result-item" style="color: #6b7280;">未找到用户</div>';
        } else {
            container.innerHTML = users.map(user => `
                <div class="search-result-item" onclick="mentorshipManager.selectUser(${user.id}, '${user.nickname || user.username}')">
                    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <i class="fas fa-user text-purple-600"></i>
                    </div>
                    <div>
                        <div class="font-semibold">${user.nickname || user.username}</div>
                        <div class="text-sm text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            `).join('');
        }
        container.classList.add('active');
    }

    hideSearchResults() {
        const container = document.getElementById('searchResults');
        if (container) {
            container.classList.remove('active');
        }
    }

    selectUser(userId, username) {
        document.getElementById('apprenticeInput').value = userId;
        this.hideSearchResults();
        this.showToast(`已选择用户: ${username}`, 'info');
    }

    async loadRelationships() {
        const response = await fetch(`${API_BASE_URL}/mentorship/my`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load relationships');
        }

        const data = await response.json();
        if (data.code === 200) {
            this.relationships = data.data;
            this.renderRelationships();
        } else {
            throw new Error(data.message);
        }
    }

    async loadPendingInvitations() {
        const response = await fetch(`${API_BASE_URL}/mentorship/invitations/pending`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load invitations');
        }

        const data = await response.json();
        if (data.code === 200) {
            this.renderPendingInvitations(data.data);
        }
    }

    renderRelationships() {
        const { asMentor, asApprentice, activeApprenticesCount, totalGraduatedCount, hasActiveMentor } = this.relationships;

        // Update statistics with animation
        this.animateNumber('activeApprenticesCount', activeApprenticesCount);
        this.animateNumber('totalGraduatedCount', totalGraduatedCount);

        // Render current mentor
        const currentMentorInfo = document.getElementById('currentMentorInfo');
        if (currentMentorInfo) {
            if (hasActiveMentor) {
                const activeMentor = asApprentice.find(m => m.status === 'ACTIVE');
                if (activeMentor) {
                    currentMentorInfo.innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="avatar-wrapper">
                                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <i class="fas fa-user-tie text-purple-600"></i>
                                </div>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-800">${activeMentor.mentor?.nickname || activeMentor.mentor?.username || '师父'}</p>
                                <p class="text-sm">
                                    <span class="exp-share-indicator">+${activeMentor.totalSharedExp || 0} 经验</span>
                                </p>
                            </div>
                        </div>
                    `;
                }
            } else {
                currentMentorInfo.innerHTML = `
                    <p class="text-gray-500 text-sm">暂无师父，快去拜师吧！</p>
                `;
            }
        }

        // Render mentor list
        this.renderMentorList(asApprentice || []);

        // Render apprentice list
        this.renderApprenticeList(asMentor || []);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    renderMentorList(mentors) {
        const container = document.getElementById('mentorList');
        if (!container) return;

        if (!mentors || mentors.length === 0) {
            container.innerHTML = `
                <div class="empty-state text-center py-8">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                        <i class="fas fa-user-graduate text-purple-400 text-2xl"></i>
                    </div>
                    <p class="text-lg font-semibold text-gray-700">暂无师父</p>
                    <p class="text-sm text-gray-500 mt-1">找一位导师，开启学习之旅吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = mentors.map((m, index) => `
            <div class="mentorship-card border border-gray-200 rounded-xl p-4 mb-3 bg-white"
                 style="animation-delay: ${index * 0.1}s">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="avatar-wrapper">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                                <i class="fas fa-user-tie text-xl"></i>
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="font-semibold text-gray-800">
                                    ${m.mentor?.nickname || m.mentor?.username || '师父'}
                                </span>
                                <span class="status-badge status-${m.status.toLowerCase()} px-2 py-0.5 rounded-full text-xs font-medium
                                    ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                      m.status === 'GRADUATED' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                                    ${this.getStatusText(m.status)}
                                </span>
                            </div>
                            <p class="text-sm text-gray-500 mt-1">
                                <span class="exp-share-indicator">+${m.totalSharedExp || 0} 经验</span>
                                <span class="mx-2">•</span>
                                <span>${this.calculateDays(m.createdAt)}天</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${m.status === 'ACTIVE' ? `
                            <button
                                onclick="mentorshipManager.dissolveRelationship(${m.id}, '徒弟主动解除')"
                                class="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors">
                                <i class="fas fa-unlink"></i>
                            </button>
                        ` : ''}
                        <button
                            onclick="mentorshipManager.showDetail(${m.id})"
                            class="px-3 py-1.5 text-purple-500 hover:bg-purple-50 rounded-lg text-sm transition-colors">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderApprenticeList(apprentices) {
        const container = document.getElementById('apprenticeList');
        if (!container) return;

        if (!apprentices || apprentices.length === 0) {
            container.innerHTML = `
                <div class="empty-state text-center py-8">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-50 flex items-center justify-center">
                        <i class="fas fa-users text-pink-400 text-2xl"></i>
                    </div>
                    <p class="text-lg font-semibold text-gray-700">暂无徒弟</p>
                    <p class="text-sm text-gray-500 mt-1">点击"发起邀请"收一位徒弟吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = apprentices.map((a, index) => {
            const progress = this.calculateGraduationProgress(a);
            const canGraduate = progress >= 100;
            return `
                <div class="mentorship-card border border-gray-200 rounded-xl p-4 mb-3 bg-white ${canGraduate && a.status === 'ACTIVE' ? 'graduation-glow' : ''}"
                     style="animation-delay: ${index * 0.1}s">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="avatar-wrapper">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white">
                                    <i class="fas fa-user text-xl"></i>
                                </div>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-semibold text-gray-800">
                                        ${a.apprentice?.nickname || a.apprentice?.username || '徒弟'}
                                    </span>
                                    <span class="status-badge px-2 py-0.5 rounded-full text-xs font-medium
                                        ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                          a.status === 'GRADUATED' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                                        ${this.getStatusText(a.status)}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-500 mt-1">
                                    Lv.${a.apprenticeLevel || 1}
                                    <span class="mx-2">•</span>
                                    <span class="exp-share-indicator">+${a.totalSharedExp || 0}</span>
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${a.status === 'ACTIVE' ? `
                                <button
                                    onclick="mentorshipManager.graduateApprentice(${a.id})"
                                    class="btn-primary px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-1"
                                    ${!canGraduate ? 'disabled' : ''}>
                                    <i class="fas fa-graduation-cap"></i>
                                    <span>出师</span>
                                </button>
                                <button
                                    onclick="mentorshipManager.dissolveRelationship(${a.id}, '师父主动解除')"
                                    class="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors">
                                    <i class="fas fa-unlink"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${a.status === 'ACTIVE' ? `
                        <div class="mt-3">
                            <div class="flex items-center justify-between text-sm mb-2">
                                <span class="text-gray-600">出师进度</span>
                                <span class="font-semibold ${canGraduate ? 'text-green-600' : 'text-purple-600'}">${progress.toFixed(0)}%</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500 ${canGraduate ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-purple-400 to-purple-500'}"
                                     style="width: ${progress}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">
                                ${canGraduate ? '已满足出师条件！' : `目标: Lv.20 (当前 Lv.${a.apprenticeLevel || 1})`}
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderPendingInvitations(invitations) {
        const pendingSection = document.getElementById('pendingSection');
        if (!pendingSection) return;

        if (!invitations || invitations.length === 0) {
            pendingSection.style.display = 'none';
            return;
        }

        pendingSection.style.display = 'block';
        const pendingCount = document.getElementById('pendingCount');
        if (pendingCount) {
            pendingCount.textContent = `(${invitations.length})`;
        }

        const container = document.getElementById('pendingList');
        if (container) {
            container.innerHTML = invitations.map((inv, index) => `
                <div class="pending-invitation flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl mb-3"
                     style="animation-delay: ${index * 0.1}s">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white">
                            <i class="fas fa-envelope text-xl"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800">
                                ${inv.mentor?.nickname || inv.mentor?.username || '用户'} 邀请你成为徒弟
                            </p>
                            <p class="text-sm text-gray-500">
                                ${new Date(inv.createdAt).toLocaleString('zh-CN')}
                            </p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button
                            onclick="mentorshipManager.acceptInvitation(${inv.id})"
                            class="btn-primary px-4 py-2 rounded-lg text-sm text-white flex items-center gap-1">
                            <i class="fas fa-check"></i>
                            <span>接受</span>
                        </button>
                        <button
                            onclick="mentorshipManager.rejectInvitation(${inv.id})"
                            class="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                            <i class="fas fa-times"></i>
                            <span>拒绝</span>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // ==================== Actions ====================

    showInviteModal() {
        const modal = document.getElementById('inviteModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('apprenticeInput').value = '';
            document.getElementById('apprenticeInput').focus();
        }
    }

    hideInviteModal() {
        const modal = document.getElementById('inviteModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.hideSearchResults();
    }

    async sendInvitation() {
        const input = document.getElementById('apprenticeInput').value.trim();
        if (!input) {
            this.showToast('请输入徒弟的用户ID', 'error');
            return;
        }

        const apprenticeId = parseInt(input);
        if (isNaN(apprenticeId)) {
            this.showToast('请输入有效的用户ID（数字）', 'error');
            return;
        }

        const sendBtn = document.getElementById('sendInviteBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';

        try {
            const response = await fetch(`${API_BASE_URL}/mentorship/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ apprenticeId })
            });

            const data = await response.json();
            if (data.code === 200) {
                this.showToast('邀请已发送！', 'success');
                this.hideInviteModal();
                this.loadData();
            } else {
                this.showToast('发送失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Send invitation error:', error);
            this.showToast('发送失败: ' + error.message, 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发送邀请';
        }
    }

    async acceptInvitation(invitationId) {
        if (!confirm('确定接受此师徒邀请吗？')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/mentorship/accept/${invitationId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.showToast('已接受邀请！欢迎加入师门！', 'success');
                this.loadData();
            } else {
                this.showToast('操作失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Accept invitation error:', error);
            this.showToast('操作失败: ' + error.message, 'error');
        }
    }

    async rejectInvitation(invitationId) {
        if (!confirm('确定拒绝此师徒邀请吗？')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/mentorship/reject/${invitationId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.showToast('已拒绝邀请', 'info');
                this.loadData();
            } else {
                this.showToast('操作失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Reject invitation error:', error);
            this.showToast('操作失败: ' + error.message, 'error');
        }
    }

    async graduateApprentice(mentorshipId) {
        if (!confirm('确定让徒弟出师吗？出师后将获得奖励，师徒关系将结束。')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/mentorship/graduate/${mentorshipId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.showToast('恭喜！徒弟已出师！', 'success');
                this.loadData();
            } else {
                this.showToast('操作失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Graduate error:', error);
            this.showToast('操作失败: ' + error.message, 'error');
        }
    }

    async dissolveRelationship(mentorshipId, reason) {
        if (!confirm('确定解除师徒关系吗？此操作不可撤销。')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/mentorship/dissolve/${mentorshipId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();
            if (data.code === 200) {
                this.showToast('已解除师徒关系', 'info');
                this.loadData();
            } else {
                this.showToast('操作失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Dissolve error:', error);
            this.showToast('操作失败: ' + error.message, 'error');
        }
    }

    async showDetail(mentorshipId) {
        try {
            const response = await fetch(`${API_BASE_URL}/mentorship/${mentorshipId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();
            if (data.code === 200) {
                this.renderDetail(data.data);
                document.getElementById('detailModal').classList.add('active');
            } else {
                this.showToast('加载失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Load detail error:', error);
            this.showToast('加载失败: ' + error.message, 'error');
        }
    }

    hideDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
    }

    renderDetail(mentorship) {
        const content = document.getElementById('detailContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-purple-50 rounded-xl">
                        <p class="text-sm text-purple-600 mb-1">经验共享比例</p>
                        <p class="text-2xl font-bold text-purple-700">${mentorship.expShareRate}%</p>
                    </div>
                    <div class="p-4 bg-pink-50 rounded-xl">
                        <p class="text-sm text-pink-600 mb-1">奖励分成比例</p>
                        <p class="text-2xl font-bold text-pink-700">${mentorship.rewardShareRate}%</p>
                    </div>
                </div>

                <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <p class="text-sm text-gray-600 mb-1">累计共享经验</p>
                    <p class="text-3xl font-bold exp-share-indicator">${mentorship.totalSharedExp || 0}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <p class="text-xs text-gray-500">关系ID</p>
                        <p class="font-semibold">#${mentorship.id}</p>
                    </div>
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <p class="text-xs text-gray-500">状态</p>
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium
                            ${mentorship.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              mentorship.status === 'GRADUATED' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}">
                            ${this.getStatusText(mentorship.status)}
                        </span>
                    </div>
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <p class="text-xs text-gray-500">徒弟等级</p>
                        <p class="font-semibold">Lv.${mentorship.apprenticeLevel || 1}</p>
                    </div>
                    <div class="p-3 border border-gray-200 rounded-xl">
                        <p class="text-xs text-gray-500">结契时间</p>
                        <p class="font-semibold text-sm">${new Date(mentorship.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                </div>

                ${mentorship.graduatedAt ? `
                    <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p class="text-sm text-green-600 flex items-center gap-2">
                            <i class="fas fa-graduation-cap"></i>
                            出师时间: ${new Date(mentorship.graduatedAt).toLocaleString('zh-CN')}
                        </p>
                    </div>
                ` : ''}

                ${mentorship.dissolvedAt ? `
                    <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p class="text-sm text-red-600 flex items-center gap-2">
                            <i class="fas fa-unlink"></i>
                            解除时间: ${new Date(mentorship.dissolvedAt).toLocaleString('zh-CN')}
                        </p>
                        ${mentorship.dissolveReason ? `<p class="text-xs text-red-500 mt-1">原因: ${mentorship.dissolveReason}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ==================== Utilities ====================

    getStatusText(status) {
        const statusMap = {
            'PENDING': '待接受',
            'ACTIVE': '在籍',
            'GRADUATED': '已出师',
            'DISSOLVED': '已解除'
        };
        return statusMap[status] || status;
    }

    calculateDays(dateString) {
        const created = new Date(dateString);
        const now = new Date();
        const diff = now - created;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    calculateGraduationProgress(mentorship) {
        const currentLevel = mentorship.apprenticeLevel || 1;
        const requiredLevel = 20;
        return Math.min((currentLevel / requiredLevel) * 100, 100);
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'fa-check-circle' :
                     type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeInUp 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize on page load
let mentorshipManager;
window.addEventListener('DOMContentLoaded', () => {
    mentorshipManager = new MentorshipManager();
    window.mentorshipManager = mentorshipManager;
});
