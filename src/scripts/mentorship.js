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
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
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
            <div class="relationship-card" style="height: 96px; background: var(--bg-secondary); animation: pulse 1.5s ease-in-out infinite;">
            </div>
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
            container.innerHTML = '<div class="search-result-item" style="color: var(--text-tertiary);">未找到用户</div>';
        } else {
            container.innerHTML = users.map(user => `
                <div class="search-result-item" onclick="mentorshipManager.selectUser(${user.id}, '${user.nickname || user.username}')">
                    <div class="avatar" style="width: 40px; height: 40px; font-size: 14px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${user.nickname || user.username}</div>
                        <div style="font-size: 13px; color: var(--text-tertiary);">ID: ${user.id}</div>
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
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div class="avatar" style="width: 48px; height: 48px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="relationship-name" style="font-size: 17px; margin-bottom: 4px;">${activeMentor.mentor?.nickname || activeMentor.mentor?.username || '师父'}</div>
                                <div class="exp-indicator" style="font-size: 14px;">+${activeMentor.totalSharedExp || 0} 经验</div>
                            </div>
                        </div>
                    `;
                }
            } else {
                currentMentorInfo.innerHTML = `
                    <p class="stat-description">暂无师父，快去拜师吧</p>
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
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        </svg>
                    </div>
                    <p class="empty-title">暂无师父</p>
                    <p class="empty-description">找一位导师，开启学习之旅吧</p>
                </div>
            `;
            return;
        }

        container.innerHTML = mentors.map((m, index) => `
            <div class="relationship-card">
                <div class="relationship-header">
                    <div class="relationship-info">
                        <div class="avatar">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="relationship-details">
                            <div class="relationship-name">
                                ${m.mentor?.nickname || m.mentor?.username || '师父'}
                                <span class="badge ${m.status === 'ACTIVE' ? 'badge-success' : m.status === 'GRADUATED' ? 'badge-primary' : ''}" style="margin-left: 8px; font-size: 12px;">
                                    ${this.getStatusText(m.status)}
                                </span>
                            </div>
                            <div class="relationship-meta">
                                <span class="exp-indicator">+${m.totalSharedExp || 0} 经验</span>
                                <span>•</span>
                                <span>${this.calculateDays(m.createdAt)}天</span>
                            </div>
                        </div>
                    </div>
                    <div class="relationship-actions">
                        ${m.status === 'ACTIVE' ? `
                            <button
                                onclick="mentorshipManager.dissolveRelationship(${m.id}, '徒弟主动解除')"
                                class="icon-btn"
                                title="解除关系">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 8A5 5 0 1 0 6 8h10M9 12v8m6-8v8"></path>
                                </svg>
                            </button>
                        ` : ''}
                        <button
                            onclick="mentorshipManager.showDetail(${m.id})"
                            class="icon-btn"
                            title="查看详情">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
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
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <p class="empty-title">暂无徒弟</p>
                    <p class="empty-description">点击"发起邀请"收一位徒弟吧</p>
                </div>
            `;
            return;
        }

        container.innerHTML = apprentices.map((a, index) => {
            const progress = this.calculateGraduationProgress(a);
            const canGraduate = progress >= 100;
            return `
                <div class="relationship-card ${canGraduate && a.status === 'ACTIVE' ? 'graduation-ready' : ''}">
                    <div class="relationship-header">
                        <div class="relationship-info">
                            <div class="avatar">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div class="relationship-details">
                                <div class="relationship-name">
                                    ${a.apprentice?.nickname || a.apprentice?.username || '徒弟'}
                                    <span class="badge ${a.status === 'ACTIVE' ? 'badge-success' : a.status === 'GRADUATED' ? 'badge-primary' : ''}" style="margin-left: 8px; font-size: 12px;">
                                        ${this.getStatusText(a.status)}
                                    </span>
                                </div>
                                <div class="relationship-meta">
                                    <span>Lv.${a.apprenticeLevel || 1}</span>
                                    <span>•</span>
                                    <span class="exp-indicator">+${a.totalSharedExp || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div class="relationship-actions">
                            ${a.status === 'ACTIVE' ? `
                                <button
                                    onclick="mentorshipManager.graduateApprentice(${a.id})"
                                    class="btn btn-primary btn-sm"
                                    ${!canGraduate ? 'disabled' : ''}
                                    title="出师">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                    </svg>
                                    出师
                                </button>
                                <button
                                    onclick="mentorshipManager.dissolveRelationship(${a.id}, '师父主动解除')"
                                    class="icon-btn"
                                    title="解除关系">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M16 8A5 5 0 1 0 6 8h10M9 12v8m6-8v8"></path>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${a.status === 'ACTIVE' ? `
                        <div class="progress-section">
                            <div class="progress-header">
                                <span style="color: var(--text-secondary);">出师进度</span>
                                <span style="font-weight: 600; color: ${canGraduate ? '#34c759' : 'var(--accent)'};">${progress.toFixed(0)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%; background: ${canGraduate ? 'linear-gradient(90deg, #34c759, #30d158)' : 'linear-gradient(90deg, var(--accent), var(--accent-light))'}"></div>
                            </div>
                            <p class="progress-description">
                                ${canGraduate ? '已满足出师条件' : `目标: Lv.20 (当前 Lv.${a.apprenticeLevel || 1})`}
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
                <div class="pending-card">
                    <div class="relationship-header">
                        <div class="relationship-info">
                            <div class="avatar" style="background: linear-gradient(135deg, #ff9500 0%, #ff6500 100%);">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <div class="relationship-details">
                                <div class="relationship-name">
                                    ${inv.mentor?.nickname || inv.mentor?.username || '用户'} 邀请你成为徒弟
                                </div>
                                <div class="relationship-meta">
                                    ${new Date(inv.createdAt).toLocaleString('zh-CN')}
                                </div>
                            </div>
                        </div>
                        <div class="relationship-actions">
                            <button
                                onclick="mentorshipManager.acceptInvitation(${inv.id})"
                                class="btn btn-primary btn-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                接受
                            </button>
                            <button
                                onclick="mentorshipManager.rejectInvitation(${inv.id})"
                                class="btn btn-secondary btn-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                拒绝
                            </button>
                        </div>
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
        sendBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div> 发送中...';

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
                this.showToast('邀请已发送', 'success');
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
            sendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg> 发送邀请';
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
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">经验共享比例</div>
                    <div class="detail-value" style="color: var(--accent);">${mentorship.expShareRate}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">奖励分成比例</div>
                    <div class="detail-value" style="color: var(--accent);">${mentorship.rewardShareRate}%</div>
                </div>
            </div>

            <div class="detail-item" style="margin-top: 16px; background: linear-gradient(135deg, rgba(0, 113, 227, 0.1), rgba(20, 124, 229, 0.1));">
                <div class="detail-label">累计共享经验</div>
                <div class="detail-value exp-indicator">${mentorship.totalSharedExp || 0}</div>
            </div>

            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">关系ID</div>
                    <div class="detail-value" style="font-size: 19px;">#${mentorship.id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">状态</div>
                    <span class="badge ${mentorship.status === 'ACTIVE' ? 'badge-success' : mentorship.status === 'GRADUATED' ? 'badge-primary' : ''}" style="font-size: 14px; margin-top: 8px; display: inline-block;">
                        ${this.getStatusText(mentorship.status)}
                    </span>
                </div>
                <div class="detail-item">
                    <div class="detail-label">徒弟等级</div>
                    <div class="detail-value" style="font-size: 19px;">Lv.${mentorship.apprenticeLevel || 1}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">结契时间</div>
                    <div class="detail-value" style="font-size: 15px; font-weight: 500;">${new Date(mentorship.createdAt).toLocaleDateString('zh-CN')}</div>
                </div>
            </div>

            ${mentorship.graduatedAt ? `
                <div class="detail-item" style="margin-top: 16px; background: rgba(52, 199, 89, 0.1); border: 1px solid rgba(52, 199, 89, 0.3);">
                    <div style="display: flex; align-items: center; gap: 8px; color: #34c759;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                        <span style="font-weight: 500;">出师时间: ${new Date(mentorship.graduatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                </div>
            ` : ''}

            ${mentorship.dissolvedAt ? `
                <div class="detail-item" style="margin-top: 16px; background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.3);">
                    <div style="display: flex; align-items: center; gap: 8px; color: #ff3b30;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 8A5 5 0 1 0 6 8h10M9 12v8m6-8v8"></path>
                        </svg>
                        <span style="font-weight: 500;">解除时间: ${new Date(mentorship.dissolvedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    ${mentorship.dissolveReason ? `<p style="font-size: 13px; color: #ff3b30; margin-top: 8px;">原因: ${mentorship.dissolveReason}</p>` : ''}
                </div>
            ` : ''}
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
        toast.className = 'toast show';
        toast.style.cssText = `
            position: fixed;
            top: 64px;
            right: 22px;
            padding: 14px 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            font-size: 15px;
            color: var(--text-primary);
            z-index: 2000;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease;
        `;

        let iconSVG = '';
        let iconColor = 'var(--accent)';

        if (type === 'success') {
            iconColor = '#34c759';
            iconSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else if (type === 'error') {
            iconColor = '#ff3b30';
            iconSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        } else {
            iconColor = 'var(--accent)';
            iconSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }

        toast.innerHTML = `<span style="color: ${iconColor}; display: flex;">${iconSVG}</span><span>${message}</span>`;
        document.body.appendChild(toast);

        // Add animation style if not exists
        if (!document.getElementById('toast-animation-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-style';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
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
