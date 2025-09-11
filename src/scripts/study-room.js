// ===== 学习室核心功能 =====

// 全局变量
let currentUser = null;
let currentRoom = null;
let websocket = null;
let isConnected = false;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectInterval = null;

// DOM 元素
const elements = {
    messagesContainer: document.getElementById('messagesContainer'),
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    membersList: document.getElementById('membersList'),
    roomTitle: document.getElementById('roomTitle'),
    roomMemberCount: document.getElementById('roomMemberCount'),
    membersSidebar: document.getElementById('membersSidebar'),
    toolsSidebar: document.getElementById('toolsSidebar'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    emojiPicker: document.getElementById('emojiPicker'),
    fileInput: document.getElementById('fileInput')
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeStudyRoom();
    } catch (error) {
        console.error('学习室初始化失败:', error);
        showNotification('学习室初始化失败', 'error');
    }
});

// 初始化学习室
async function initializeStudyRoom() {
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId') || '1';
    const chapterId = urlParams.get('chapterId');
    
    try {
        // 检查用户登录状态
        currentUser = await getCurrentUser();
        if (!currentUser) {
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const loginPath = isDev ? '/src/pages/login.html' : '/login.html';
            window.location.href = loginPath + '?returnUrl=' + encodeURIComponent(window.location.href);
            return;
        }

        // 获取或创建学习室
        currentRoom = await getOrCreateStudyRoom(courseId, chapterId);
        
        // 更新UI
        updateRoomInfo();
        
        // 连接WebSocket
        await connectWebSocket();
        
        // 绑定事件
        bindEvents();
        
        // 加载聊天历史
        await loadChatHistory();
        
        console.log('学习室初始化完成');
        
    } catch (error) {
        console.error('初始化失败:', error);
        throw error;
    }
}

// 获取当前用户信息
async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.code === 200 ? data.data : null;
        }
        return null;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return null;
    }
}

// 获取或创建学习室
async function getOrCreateStudyRoom(courseId, chapterId) {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            courseId,
            ...(chapterId && { chapterId })
        });
        
        const response = await fetch(`/api/study-rooms/join?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.code === 200 ? data.data : createMockRoom(courseId, chapterId);
        } else {
            return createMockRoom(courseId, chapterId);
        }
    } catch (error) {
        console.error('获取学习室失败:', error);
        return createMockRoom(courseId, chapterId);
    }
}

// 创建模拟学习室数据
function createMockRoom(courseId, chapterId) {
    return {
        id: `room_${courseId}_${chapterId || 'general'}`,
        courseId,
        chapterId,
        name: chapterId ? `第${chapterId}章 学习室` : '课程学习室',
        description: '与其他学习者一起讨论和学习',
        maxMembers: 50,
        currentMembers: 1,
        members: [
            {
                id: currentUser?.id || 'user_1',
                username: currentUser?.username || '我',
                nickname: currentUser?.nickname || '我',
                avatar: currentUser?.avatar,
                role: 'member',
                isOnline: true,
                joinedAt: new Date().toISOString()
            }
        ]
    };
}

// 连接WebSocket
async function connectWebSocket() {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        return;
    }
    
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/study-room/${currentRoom.id}`;
        
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = handleWebSocketOpen;
        websocket.onmessage = handleWebSocketMessage;
        websocket.onclose = handleWebSocketClose;
        websocket.onerror = handleWebSocketError;
        
    } catch (error) {
        console.error('WebSocket连接失败:', error);
        // 使用模拟模式
        setupMockWebSocket();
    }
}

// WebSocket事件处理
function handleWebSocketOpen(event) {
    console.log('WebSocket连接已建立');
    isConnected = true;
    reconnectAttempts = 0;
    
    // 发送加入房间消息
    sendWebSocketMessage({
        type: 'join',
        roomId: currentRoom.id,
        user: currentUser
    });
    
    showNotification('已连接到学习室', 'success');
}

function handleWebSocketMessage(event) {
    try {
        const message = JSON.parse(event.data);
        handleRoomMessage(message);
    } catch (error) {
        console.error('解析WebSocket消息失败:', error);
    }
}

function handleWebSocketClose(event) {
    console.log('WebSocket连接已关闭:', event.code, event.reason);
    isConnected = false;
    
    if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
        // 非正常关闭，尝试重连
        attemptReconnect();
    }
}

function handleWebSocketError(error) {
    console.error('WebSocket错误:', error);
    showNotification('连接出现问题，正在尝试重连...', 'warning');
}

// 重连机制
function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        showNotification('连接失败，请刷新页面重试', 'error');
        return;
    }
    
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    
    showNotification(`正在重连... (${reconnectAttempts}/${maxReconnectAttempts})`, 'info');
    
    reconnectInterval = setTimeout(() => {
        connectWebSocket();
    }, delay);
}

// 发送WebSocket消息
function sendWebSocketMessage(message) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
        return true;
    }
    return false;
}

// 设置模拟WebSocket
function setupMockWebSocket() {
    console.log('使用模拟WebSocket模式');
    isConnected = false;
    
    // 模拟其他用户
    setTimeout(() => {
        handleRoomMessage({
            type: 'userJoined',
            user: {
                id: 'user_demo',
                username: 'AI助手',
                nickname: 'AI助手',
                avatar: null,
                role: 'helper'
            }
        });
    }, 2000);
    
    // 模拟欢迎消息
    setTimeout(() => {
        handleRoomMessage({
            type: 'message',
            message: {
                id: 'welcome_1',
                userId: 'user_demo',
                username: 'AI助手',
                content: '欢迎来到学习室！有任何问题都可以在这里讨论。',
                type: 'text',
                timestamp: new Date().toISOString()
            }
        });
    }, 3000);
}

// 处理房间消息
function handleRoomMessage(data) {
    switch (data.type) {
        case 'message':
            addMessageToChat(data.message);
            break;
        case 'userJoined':
            handleUserJoined(data.user);
            break;
        case 'userLeft':
            handleUserLeft(data.user);
            break;
        case 'userList':
            updateMembersList(data.users);
            break;
        case 'typing':
            handleTypingIndicator(data);
            break;
        case 'error':
            showNotification(data.message, 'error');
            break;
        default:
            console.log('未知消息类型:', data.type);
    }
}

// 绑定事件
function bindEvents() {
    // 消息输入
    elements.messageInput.addEventListener('input', handleInputChange);
    elements.messageInput.addEventListener('keydown', handleInputKeydown);
    
    // 发送按钮
    elements.sendButton.addEventListener('click', sendMessage);
    
    // 文件上传
    elements.fileInput.addEventListener('change', handleFileUpload);
    
    // 点击外部关闭表情选择器
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.emoji-picker') && !event.target.closest('[onclick*="insertEmoji"]')) {
            elements.emojiPicker.classList.remove('active');
        }
    });
    
    // 页面离开时清理
    window.addEventListener('beforeunload', cleanup);
}

// 更新房间信息
function updateRoomInfo() {
    if (!currentRoom) return;
    
    elements.roomTitle.textContent = currentRoom.name;
    elements.roomMemberCount.textContent = `${currentRoom.currentMembers}人在线`;
    
    // 更新页面标题
    document.title = `${currentRoom.name} - 学习室`;
}

// 加载聊天历史
async function loadChatHistory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/study-rooms/${currentRoom.id}/messages?limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data.length > 0) {
                // 清除欢迎消息
                elements.messagesContainer.innerHTML = '';
                
                // 添加历史消息
                data.data.reverse().forEach(message => {
                    addMessageToChat(message, false);
                });
                
                scrollToBottom();
            }
        }
    } catch (error) {
        console.error('加载聊天历史失败:', error);
    }
}

// 发送消息
async function sendMessage() {
    const content = elements.messageInput.value.trim();
    if (!content) return;
    
    const message = {
        id: generateId(),
        userId: currentUser.id,
        username: currentUser.username,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        content,
        type: 'text',
        timestamp: new Date().toISOString()
    };
    
    // 立即显示消息（乐观更新）
    addMessageToChat(message, true);
    
    // 清空输入框
    elements.messageInput.value = '';
    elements.sendButton.disabled = true;
    
    // 发送到服务器
    const success = sendWebSocketMessage({
        type: 'message',
        roomId: currentRoom.id,
        message
    });
    
    if (!success) {
        // WebSocket不可用，尝试HTTP API
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/study-rooms/${currentRoom.id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });
        } catch (error) {
            console.error('发送消息失败:', error);
            showNotification('发送失败，请重试', 'error');
        }
    }
}

// 添加消息到聊天区
function addMessageToChat(message, isOwn = false) {
    // 移除欢迎消息
    const welcomeMessage = elements.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // 检查是否需要创建新的消息组
    const lastGroup = elements.messagesContainer.lastElementChild;
    const shouldCreateNewGroup = !lastGroup || 
        !lastGroup.classList.contains('message-group') ||
        lastGroup.dataset.userId !== message.userId ||
        shouldBreakMessageGroup(lastGroup.dataset.timestamp, message.timestamp);
    
    if (shouldCreateNewGroup) {
        createMessageGroup(message, isOwn || message.userId === currentUser.id);
    } else {
        addMessageToGroup(lastGroup, message, isOwn || message.userId === currentUser.id);
    }
    
    scrollToBottom();
}

// 判断是否应该断开消息组（超过5分钟）
function shouldBreakMessageGroup(lastTimestamp, currentTimestamp) {
    if (!lastTimestamp) return true;
    
    const last = new Date(lastTimestamp);
    const current = new Date(currentTimestamp);
    return (current - last) > 5 * 60 * 1000; // 5分钟
}

// 创建消息组
function createMessageGroup(message, isOwn) {
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';
    messageGroup.dataset.userId = message.userId;
    messageGroup.dataset.timestamp = message.timestamp;
    
    // 创建消息头部（头像、用户名、时间）
    if (!isOwn) {
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.innerHTML = `
            <div class="message-avatar">
                ${message.avatar ? `<img src="${message.avatar}" alt="${message.username}">` : 
                  message.username.charAt(0).toUpperCase()}
            </div>
            <span class="message-author">${message.nickname || message.username}</span>
            <span class="message-time">${formatMessageTime(message.timestamp)}</span>
        `;
        messageGroup.appendChild(messageHeader);
    }
    
    // 添加消息内容
    addMessageToGroup(messageGroup, message, isOwn);
    
    elements.messagesContainer.appendChild(messageGroup);
}

// 添加消息到现有组
function addMessageToGroup(group, message, isOwn) {
    const messageContent = document.createElement('div');
    messageContent.className = `message-content ${isOwn ? 'own' : ''}`;
    
    // 根据消息类型渲染内容
    switch (message.type) {
        case 'text':
            messageContent.innerHTML = `<p class="message-text">${escapeHtml(message.content)}</p>`;
            break;
        case 'image':
            messageContent.innerHTML = `
                <p class="message-text">${message.content || ''}</p>
                <img src="${message.imageUrl}" alt="图片" class="message-image" onclick="showImageModal('${message.imageUrl}')">
            `;
            break;
        case 'code':
            messageContent.innerHTML = `
                <p class="message-text">${message.content || ''}</p>
                <pre class="message-code"><code>${escapeHtml(message.code)}</code></pre>
            `;
            break;
        default:
            messageContent.innerHTML = `<p class="message-text">${escapeHtml(message.content)}</p>`;
    }
    
    // 添加时间戳（自己的消息显示在右上角）
    if (isOwn && !group.querySelector('.message-header')) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time-own';
        timeSpan.textContent = formatMessageTime(message.timestamp);
        timeSpan.style.cssText = 'position: absolute; top: -20px; right: 0; font-size: 0.75rem; color: var(--text-tertiary);';
        messageContent.style.position = 'relative';
        messageContent.appendChild(timeSpan);
    }
    
    group.appendChild(messageContent);
}

// 处理用户加入
function handleUserJoined(user) {
    // 更新成员列表
    if (!currentRoom.members.find(m => m.id === user.id)) {
        currentRoom.members.push(user);
        currentRoom.currentMembers++;
        updateRoomInfo();
        updateMembersList(currentRoom.members);
    }
    
    // 显示系统消息
    addSystemMessage(`${user.nickname || user.username} 加入了学习室`);
}

// 处理用户离开
function handleUserLeft(user) {
    // 更新成员列表
    currentRoom.members = currentRoom.members.filter(m => m.id !== user.id);
    currentRoom.currentMembers = Math.max(0, currentRoom.currentMembers - 1);
    updateRoomInfo();
    updateMembersList(currentRoom.members);
    
    // 显示系统消息
    addSystemMessage(`${user.nickname || user.username} 离开了学习室`);
}

// 添加系统消息
function addSystemMessage(content) {
    const systemMessage = document.createElement('div');
    systemMessage.className = 'system-message';
    systemMessage.innerHTML = `
        <div class="system-content">
            <i class="fas fa-info-circle"></i>
            <span>${content}</span>
        </div>
    `;
    systemMessage.style.cssText = `
        text-align: center;
        margin: var(--spacing-lg) 0;
        color: var(--text-tertiary);
        font-size: 0.85rem;
    `;
    
    elements.messagesContainer.appendChild(systemMessage);
    scrollToBottom();
}

// 更新成员列表
function updateMembersList(members) {
    elements.membersList.innerHTML = '';
    
    members.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
            <div class="member-avatar">
                ${member.avatar ? `<img src="${member.avatar}" alt="${member.username}">` : 
                  member.username.charAt(0).toUpperCase()}
                <div class="member-status ${member.isOnline ? 'online' : 'offline'}"></div>
            </div>
            <div class="member-info">
                <div class="member-name">${member.nickname || member.username}</div>
                <div class="member-role">${getRoleText(member.role)}</div>
            </div>
        `;
        
        // 点击成员可以@他
        memberItem.addEventListener('click', () => {
            if (member.id !== currentUser.id) {
                const input = elements.messageInput;
                const atText = `@${member.username} `;
                input.value = atText + input.value;
                input.focus();
                input.setSelectionRange(atText.length, atText.length);
            }
        });
        
        elements.membersList.appendChild(memberItem);
    });
}

// 获取角色文本
function getRoleText(role) {
    const roleMap = {
        'owner': '房主',
        'moderator': '管理员',
        'helper': '助教',
        'member': '成员'
    };
    return roleMap[role] || '成员';
}

// 输入变化处理
function handleInputChange() {
    const content = elements.messageInput.value.trim();
    elements.sendButton.disabled = !content;
    
    // 自动调整高度
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 120) + 'px';
    
    // 发送打字指示器
    if (isConnected && content) {
        sendWebSocketMessage({
            type: 'typing',
            roomId: currentRoom.id,
            userId: currentUser.id
        });
    }
}

// 键盘事件处理
function handleInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 侧边栏切换
function toggleMembersSidebar() {
    elements.membersSidebar.classList.toggle('active');
}

function toggleToolsSidebar() {
    elements.toolsSidebar.classList.toggle('active');
}

// 表情选择
function insertEmoji() {
    elements.emojiPicker.classList.toggle('active');
}

function insertEmojiToInput(emoji) {
    const input = elements.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
    
    elements.emojiPicker.classList.remove('active');
    handleInputChange();
}

// 图片上传
function uploadImage() {
    elements.fileInput.click();
}

// 文件上传处理
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('只能上传图片文件', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('图片大小不能超过5MB', 'error');
        return;
    }
    
    try {
        // 显示上传进度
        showNotification('正在上传图片...', 'info');
        
        // 上传到服务器
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200) {
                // 发送图片消息
                const message = {
                    id: generateId(),
                    userId: currentUser.id,
                    username: currentUser.username,
                    nickname: currentUser.nickname,
                    avatar: currentUser.avatar,
                    content: '',
                    type: 'image',
                    imageUrl: data.data.url,
                    timestamp: new Date().toISOString()
                };
                
                addMessageToChat(message, true);
                
                sendWebSocketMessage({
                    type: 'message',
                    roomId: currentRoom.id,
                    message
                });
                
                showNotification('图片上传成功', 'success');
            } else {
                throw new Error(data.message);
            }
        } else {
            throw new Error('上传失败');
        }
    } catch (error) {
        console.error('图片上传失败:', error);
        showNotification('图片上传失败: ' + error.message, 'error');
    } finally {
        // 清除文件选择
        event.target.value = '';
    }
}

// 插入代码
function insertCode() {
    const code = prompt('请输入代码:');
    if (code) {
        const message = {
            id: generateId(),
            userId: currentUser.id,
            username: currentUser.username,
            nickname: currentUser.nickname,
            avatar: currentUser.avatar,
            content: '分享了一段代码:',
            type: 'code',
            code: code,
            timestamp: new Date().toISOString()
        };
        
        addMessageToChat(message, true);
        
        sendWebSocketMessage({
            type: 'message',
            roomId: currentRoom.id,
            message
        });
    }
}

// 工具功能
function addSharedNote() {
    showModal('添加共享笔记', `
        <div class="note-form">
            <textarea id="noteContent" placeholder="输入笔记内容..." rows="6" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font-family: inherit; resize: vertical;"></textarea>
            <div style="margin-top: 16px; text-align: right;">
                <button onclick="closeModal()" style="margin-right: 12px; padding: 8px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 6px; color: var(--text-secondary); cursor: pointer;">取消</button>
                <button onclick="saveSharedNote()" style="padding: 8px 16px; background: var(--accent-primary); border: none; border-radius: 6px; color: white; cursor: pointer;">保存</button>
            </div>
        </div>
    `);
}

function saveSharedNote() {
    const content = document.getElementById('noteContent').value.trim();
    if (!content) {
        showNotification('请输入笔记内容', 'warning');
        return;
    }
    
    // TODO: 保存到服务器
    showNotification('笔记保存成功', 'success');
    closeModal();
}

function openWhiteboard() {
    showNotification('白板功能正在开发中', 'info');
}

function toggleScreenShare() {
    showNotification('屏幕共享功能正在开发中', 'info');
}

function createDocument() {
    showNotification('文档创建功能正在开发中', 'info');
}

function openDocument(docId) {
    showNotification('文档查看功能正在开发中', 'info');
}

function toggleVoiceChat() {
    showNotification('语音聊天功能正在开发中', 'info');
}

function toggleRoomSettings() {
    showModal('房间设置', `
        <div class="room-settings">
            <div class="setting-item">
                <label>房间名称:</label>
                <input type="text" id="roomName" value="${currentRoom.name}" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);">
            </div>
            <div class="setting-item" style="margin-top: 16px;">
                <label>最大成员数:</label>
                <input type="number" id="maxMembers" value="${currentRoom.maxMembers}" min="2" max="100" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid var(--border-primary); border-radius: 6px; background: var(--bg-primary); color: var(--text-primary);">
            </div>
            <div style="margin-top: 24px; text-align: right;">
                <button onclick="closeModal()" style="margin-right: 12px; padding: 8px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 6px; color: var(--text-secondary); cursor: pointer;">取消</button>
                <button onclick="saveRoomSettings()" style="padding: 8px 16px; background: var(--accent-primary); border: none; border-radius: 6px; color: white; cursor: pointer;">保存</button>
            </div>
        </div>
    `);
}

function saveRoomSettings() {
    const roomName = document.getElementById('roomName').value.trim();
    const maxMembers = parseInt(document.getElementById('maxMembers').value);
    
    if (!roomName) {
        showNotification('请输入房间名称', 'warning');
        return;
    }
    
    currentRoom.name = roomName;
    currentRoom.maxMembers = maxMembers;
    updateRoomInfo();
    
    showNotification('设置保存成功', 'success');
    closeModal();
}

// 模态框功能
function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = content;
    elements.modalOverlay.classList.add('active');
}

function closeModal() {
    elements.modalOverlay.classList.remove('active');
}

// 图片模态框
function showImageModal(imageUrl) {
    showModal('查看图片', `
        <div style="text-align: center;">
            <img src="${imageUrl}" alt="图片" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
        </div>
    `);
}

// 工具函数
function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleString('zh-CN', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 清理资源
function cleanup() {
    if (websocket) {
        websocket.close(1000, 'Page unloading');
    }
    
    if (reconnectInterval) {
        clearTimeout(reconnectInterval);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 导出全局函数供HTML调用
window.toggleMembersSidebar = toggleMembersSidebar;
window.toggleToolsSidebar = toggleToolsSidebar;
window.toggleRoomSettings = toggleRoomSettings;
window.sendMessage = sendMessage;
window.handleInputKeydown = handleInputKeydown;
window.handleInputChange = handleInputChange;
window.insertEmoji = insertEmoji;
window.insertEmojiToInput = insertEmojiToInput;
window.uploadImage = uploadImage;
window.handleFileUpload = handleFileUpload;
window.insertCode = insertCode;
window.addSharedNote = addSharedNote;
window.saveSharedNote = saveSharedNote;
window.openWhiteboard = openWhiteboard;
window.toggleScreenShare = toggleScreenShare;
window.createDocument = createDocument;
window.openDocument = openDocument;
window.toggleVoiceChat = toggleVoiceChat;
window.saveRoomSettings = saveRoomSettings;
window.showModal = showModal;
window.closeModal = closeModal;
window.showImageModal = showImageModal;