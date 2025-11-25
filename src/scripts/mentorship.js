// 师徒系统前端逻辑
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

        this.setupUI();
        this.loadData();
    }

    setupUI() {
        // Display user info
        document.getElementById('userInfo').textContent =
            this.user.nickname || this.user.username || '用户';

        // Invite button
        document.getElementById('inviteBtn').addEventListener('click', () => {
            this.showInviteModal();
        });

        // Invite modal
        document.getElementById('closeInviteModal').addEventListener('click', () => {
            this.hideInviteModal();
        });
        document.getElementById('cancelInviteBtn').addEventListener('click', () => {
            this.hideInviteModal();
        });
        document.getElementById('sendInviteBtn').addEventListener('click', () => {
            this.sendInvitation();
        });

        // Detail modal
        document.getElementById('closeDetailModal').addEventListener('click', () => {
            this.hideDetailModal();
        });
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadRelationships(),
                this.loadPendingInvitations()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('加载数据失败: ' + error.message);
        }
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

        // Update statistics
        document.getElementById('activeApprenticesCount').textContent = activeApprenticesCount;
        document.getElementById('totalGraduatedCount').textContent = totalGraduatedCount;

        // Render current mentor
        if (hasActiveMentor) {
            const activeMentor = asApprentice.find(m => m.status === 'ACTIVE');
            if (activeMentor) {
                document.getElementById('currentMentorInfo').innerHTML = `
                    <p class="font-semibold text-gray-800">${activeMentor.mentor.nickname || activeMentor.mentor.username}</p>
                    <p class="text-sm text-gray-500">已收徒: ${activeMentor.totalSharedExp || 0} 经验</p>
                `;
            }
        }

        // Render mentor list
        this.renderMentorList(asApprentice);

        // Render apprentice list
        this.renderApprenticeList(asMentor);
    }

    renderMentorList(mentors) {
        const container = document.getElementById('mentorList');

        if (mentors.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <p class="text-lg font-semibold">暂无师父</p>
                    <p class="text-sm">找一位导师，开启学习之旅吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = mentors.map(m => `
            <div class="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <i class="fas fa-user-tie text-purple-600 text-xl"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="font-semibold text-gray-800">
                                    ${m.mentor?.nickname || m.mentor?.username || '师父'}
                                </span>
                                <span class="status-badge status-${m.status.toLowerCase()}">
                                    ${this.getStatusText(m.status)}
                                </span>
                            </div>
                            <p class="text-sm text-gray-500">
                                共享经验: ${m.totalSharedExp || 0} |
                                在籍时长: ${this.calculateDays(m.createdAt)}天
                            </p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        ${m.status === 'ACTIVE' ? `
                            <button
                                onclick="mentorshipManager.dissolveRelationship(${m.id}, '徒弟主动解除')"
                                class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-unlink"></i> 解除
                            </button>
                        ` : ''}
                        <button
                            onclick="mentorshipManager.showDetail(${m.id})"
                            class="text-purple-500 hover:text-purple-700 text-sm">
                            <i class="fas fa-info-circle"></i> 详情
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderApprenticeList(apprentices) {
        const container = document.getElementById('apprenticeList');

        if (apprentices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p class="text-lg font-semibold">暂无徒弟</p>
                    <p class="text-sm">点击上方"发起邀请"按钮，收一位徒弟吧！</p>
                </div>
            `;
            return;
        }

        container.innerHTML = apprentices.map(a => {
            const progress = this.calculateGraduationProgress(a);
            return `
                <div class="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                                <i class="fas fa-user text-pink-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="font-semibold text-gray-800">
                                        ${a.apprentice?.nickname || a.apprentice?.username || '徒弟'}
                                    </span>
                                    <span class="status-badge status-${a.status.toLowerCase()}">
                                        ${this.getStatusText(a.status)}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-500">
                                    等级: ${a.apprenticeLevel || 1} |
                                    共享经验: ${a.totalSharedExp || 0}
                                </p>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            ${a.status === 'ACTIVE' ? `
                                <button
                                    onclick="mentorshipManager.graduateApprentice(${a.id})"
                                    class="btn-primary text-sm"
                                    ${progress < 100 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                                    <i class="fas fa-graduation-cap"></i> 出师
                                </button>
                                <button
                                    onclick="mentorshipManager.dissolveRelationship(${a.id}, '师父主动解除')"
                                    class="text-red-500 hover:text-red-700 text-sm">
                                    <i class="fas fa-unlink"></i> 解除
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${a.status === 'ACTIVE' ? `
                        <div>
                            <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>出师进度</span>
                                <span>${progress.toFixed(0)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                                距离出师: 等级${20 - (a.apprenticeLevel || 1)} + PK胜场待统计
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    renderPendingInvitations(invitations) {
        if (invitations.length === 0) {
            document.getElementById('pendingSection').style.display = 'none';
            return;
        }

        document.getElementById('pendingSection').style.display = 'block';
        document.getElementById('pendingCount').textContent = `(${invitations.length})`;

        const container = document.getElementById('pendingList');
        container.innerHTML = invitations.map(inv => `
            <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-envelope text-yellow-500 text-xl"></i>
                    <div>
                        <p class="font-semibold text-gray-800">
                            ${inv.mentor?.nickname || inv.mentor?.username} 邀请你成为徒弟
                        </p>
                        <p class="text-sm text-gray-500">
                            ${new Date(inv.createdAt).toLocaleString('zh-CN')}
                        </p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button
                        onclick="mentorshipManager.acceptInvitation(${inv.id})"
                        class="btn-primary text-sm">
                        <i class="fas fa-check"></i> 接受
                    </button>
                    <button
                        onclick="mentorshipManager.rejectInvitation(${inv.id})"
                        class="btn-secondary text-sm">
                        <i class="fas fa-times"></i> 拒绝
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ==================== Actions ====================

    showInviteModal() {
        document.getElementById('inviteModal').classList.add('active');
        document.getElementById('apprenticeInput').value = '';
    }

    hideInviteModal() {
        document.getElementById('inviteModal').classList.remove('active');
    }

    async sendInvitation() {
        const input = document.getElementById('apprenticeInput').value.trim();
        if (!input) {
            alert('请输入徒弟的用户ID或用户名');
            return;
        }

        try {
            const apprenticeId = parseInt(input) || null;
            if (!apprenticeId) {
                alert('请输入有效的用户ID（数字）');
                return;
            }

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
                alert('邀请已发送！');
                this.hideInviteModal();
                this.loadData();
            } else {
                alert('发送失败: ' + data.message);
            }
        } catch (error) {
            console.error('Send invitation error:', error);
            alert('发送失败: ' + error.message);
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
                alert('已接受邀请！');
                this.loadData();
            } else {
                alert('操作失败: ' + data.message);
            }
        } catch (error) {
            console.error('Accept invitation error:', error);
            alert('操作失败: ' + error.message);
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
                alert('已拒绝邀请');
                this.loadData();
            } else {
                alert('操作失败: ' + data.message);
            }
        } catch (error) {
            console.error('Reject invitation error:', error);
            alert('操作失败: ' + error.message);
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
                alert('徒弟已出师！恭喜你培养了一位优秀的学习者！');
                this.loadData();
            } else {
                alert('操作失败: ' + data.message);
            }
        } catch (error) {
            console.error('Graduate error:', error);
            alert('操作失败: ' + error.message);
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
                alert('已解除师徒关系');
                this.loadData();
            } else {
                alert('操作失败: ' + data.message);
            }
        } catch (error) {
            console.error('Dissolve error:', error);
            alert('操作失败: ' + error.message);
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
                alert('加载失败: ' + data.message);
            }
        } catch (error) {
            console.error('Load detail error:', error);
            alert('加载失败: ' + error.message);
        }
    }

    hideDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
    }

    renderDetail(mentorship) {
        const content = document.getElementById('detailContent');
        content.innerHTML = `
            <div class="space-y-4">
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">关系ID</p>
                    <p class="font-semibold">${mentorship.id}</p>
                </div>
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">状态</p>
                    <span class="status-badge status-${mentorship.status.toLowerCase()}">
                        ${this.getStatusText(mentorship.status)}
                    </span>
                </div>
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">经验共享比例</p>
                    <p class="font-semibold">${mentorship.expShareRate}%</p>
                </div>
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">奖励分成比例</p>
                    <p class="font-semibold">${mentorship.rewardShareRate}%</p>
                </div>
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">累计共享经验</p>
                    <p class="font-semibold">${mentorship.totalSharedExp || 0}</p>
                </div>
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">徒弟当前等级</p>
                    <p class="font-semibold">Lv ${mentorship.apprenticeLevel || 1}</p>
                </div>
                <div class="border-b pb-3">
                    <p class="text-sm text-gray-500">结契时间</p>
                    <p class="font-semibold">${new Date(mentorship.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                ${mentorship.graduatedAt ? `
                    <div class="border-b pb-3">
                        <p class="text-sm text-gray-500">出师时间</p>
                        <p class="font-semibold">${new Date(mentorship.graduatedAt).toLocaleString('zh-CN')}</p>
                    </div>
                ` : ''}
                ${mentorship.dissolvedAt ? `
                    <div class="border-b pb-3">
                        <p class="text-sm text-gray-500">解除时间</p>
                        <p class="font-semibold">${new Date(mentorship.dissolvedAt).toLocaleString('zh-CN')}</p>
                    </div>
                    <div class="border-b pb-3">
                        <p class="text-sm text-gray-500">解除原因</p>
                        <p class="font-semibold">${mentorship.dissolveReason || '无'}</p>
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

    showError(message) {
        alert(message);
    }
}

// Initialize on page load
let mentorshipManager;
window.addEventListener('DOMContentLoaded', () => {
    mentorshipManager = new MentorshipManager();
    window.mentorshipManager = mentorshipManager; // Make it globally accessible for onclick handlers
});
