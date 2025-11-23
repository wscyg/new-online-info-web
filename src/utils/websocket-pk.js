/**
 * PK对战专用WebSocket客户端
 * 基于WebSocketClient扩展，专门处理PK对战消息
 */

// 根据环境动态设置WebSocket URL
const getWebSocketURL = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//localhost:8080/ws/pk`;
    } else {
        return `${protocol}//${window.location.host}/ws/pk`;
    }
};

class WebSocketPKClient {
    constructor(options = {}) {
        this.options = {
            reconnectInterval: 3000,
            heartbeatInterval: 30000,
            maxReconnectAttempts: 5,
            debug: true,
            ...options
        };

        this.ws = null;
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        this.messageHandlers = new Map();
        this.messageQueue = [];
        this.isConnected = false;
        this.currentBattleId = null;
    }

    /**
     * 连接WebSocket
     */
    connect(battleId = null) {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;

            if (!userId) {
                this.log('无法连接：用户未登录');
                throw new Error('用户未登录');
            }

            if (battleId) {
                this.currentBattleId = battleId;
            }

            const baseUrl = getWebSocketURL();
            const params = new URLSearchParams({
                userId: userId,
                token: encodeURIComponent(token)
            });

            if (this.currentBattleId) {
                params.append('battleId', this.currentBattleId);
            }

            const wsUrl = `${baseUrl}?${params.toString()}`;
            this.log('连接到:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => this.onOpen();
            this.ws.onclose = (event) => this.onClose(event);
            this.ws.onerror = (error) => this.onError(error);
            this.ws.onmessage = (event) => this.onMessage(event);

        } catch (error) {
            this.log('连接失败:', error);
            this.emit('error', error);
            this.scheduleReconnect();
        }
    }

    /**
     * 连接打开
     */
    onOpen() {
        this.log('PK WebSocket连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 开始心跳
        this.startHeartbeat();

        // 发送队列中的消息
        this.flushMessageQueue();

        // 触发连接成功回调
        this.emit('open');
        this.emit('connected');
    }

    /**
     * 连接关闭
     */
    onClose(event) {
        this.log('PK WebSocket连接关闭', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();

        // 触发关闭回调
        this.emit('close', event);
        this.emit('disconnected', event);

        // 自动重连
        if (event.code !== 1000) { // 1000 = 正常关闭
            this.scheduleReconnect();
        }
    }

    /**
     * 连接错误
     */
    onError(error) {
        this.log('PK WebSocket错误:', error);
        this.emit('error', error);
    }

    /**
     * 接收消息
     */
    onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.log('收到PK消息:', message);

            const type = message.type || message.messageType;

            // 处理特定消息类型
            switch (type) {
                case 'BATTLE_START':
                    this.emit('battle_start', message.data || message);
                    break;
                case 'QUESTION_ANSWER':
                    this.emit('question_answer', message.data || message);
                    break;
                case 'OPPONENT_PROGRESS':
                    this.emit('opponent_progress', message.data || message);
                    break;
                case 'BATTLE_END':
                    this.emit('battle_end', message.data || message);
                    break;
                case 'MATCH_FOUND':
                    this.emit('match_found', message.data || message);
                    break;
                case 'INVITE_RECEIVED':
                    this.emit('invite_received', message.data || message);
                    break;
                case 'HEARTBEAT':
                    // 心跳响应，不需要处理
                    break;
                default:
                    this.log('未知消息类型:', type);
            }

            // 触发通用消息处理器
            if (this.messageHandlers.has(type)) {
                const handlers = this.messageHandlers.get(type);
                handlers.forEach(handler => handler(message.data || message));
            }

            // 触发全局消息回调
            this.emit('message', message);

        } catch (error) {
            this.log('消息解析失败:', error);
            this.emit('parse_error', { error, data: event.data });
        }
    }

    /**
     * 发送消息
     */
    send(type, data = {}) {
        const message = {
            type,
            battleId: this.currentBattleId,
            ...data,
            timestamp: Date.now()
        };

        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            this.log('发送PK消息:', message);
        } else {
            // 连接未建立，加入队列
            this.messageQueue.push(message);
            this.log('PK消息加入队列:', message);
        }
    }

    /**
     * 发送队列中的消息
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
            this.log('发送队列PK消息:', message);
        }
    }

    /**
     * 注册消息处理器
     */
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);
        return this; // 支持链式调用
    }

    /**
     * 移除消息处理器
     */
    off(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
        return this;
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    this.log(`处理器执行失败 [${event}]:`, error);
                }
            });
        }
    }

    /**
     * 开始心跳
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send('HEARTBEAT', { battleId: this.currentBattleId });
            }
        }, this.options.heartbeatInterval);
    }

    /**
     * 停止心跳
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * 安排重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            this.log('达到最大重连次数，停止重连');
            this.emit('max_reconnect');
            return;
        }

        this.reconnectAttempts++;
        this.log(`${this.options.reconnectInterval/1000}秒后进行第${this.reconnectAttempts}次重连...`);

        this.reconnectTimer = setTimeout(() => {
            this.connect(this.currentBattleId);
        }, this.options.reconnectInterval);
    }

    /**
     * 断开连接
     */
    disconnect() {
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close(1000, '主动断开');
            this.ws = null;
        }

        this.isConnected = false;
        this.currentBattleId = null;
        this.messageQueue = [];
        this.messageHandlers.clear();
    }

    /**
     * 日志输出
     */
    log(...args) {
        if (this.options.debug) {
            console.log('[PK WebSocket]', ...args);
        }
    }

    // ========== PK专用方法 ==========

    /**
     * 加入对战房间
     */
    joinBattle(battleId) {
        this.currentBattleId = battleId;
        this.send('JOIN_BATTLE', { battleId });
    }

    /**
     * 提交答案
     */
    submitAnswer(questionId, answer, answerTime) {
        this.send('QUESTION_ANSWER', {
            questionId,
            answer,
            answerTime,
            timestamp: Date.now()
        });
    }

    /**
     * 更新进度
     */
    updateProgress(questionIndex, totalQuestions, correctCount) {
        this.send('OPPONENT_PROGRESS', {
            questionIndex,
            totalQuestions,
            correctCount
        });
    }

    /**
     * 结束对战
     */
    endBattle() {
        this.send('BATTLE_END', {
            timestamp: Date.now()
        });
    }

    /**
     * 认输
     */
    forfeit() {
        this.send('FORFEIT', {
            timestamp: Date.now()
        });
    }

    /**
     * 发送聊天消息
     */
    sendChatMessage(message) {
        this.send('CHAT_MESSAGE', {
            message,
            timestamp: Date.now()
        });
    }
}

// 创建全局单例
let pkWebSocketInstance = null;

/**
 * 获取PK WebSocket实例
 */
function getPKWebSocket(options = {}) {
    if (!pkWebSocketInstance) {
        pkWebSocketInstance = new WebSocketPKClient(options);
    }
    return pkWebSocketInstance;
}

/**
 * 销毁PK WebSocket实例
 */
function destroyPKWebSocket() {
    if (pkWebSocketInstance) {
        pkWebSocketInstance.disconnect();
        pkWebSocketInstance = null;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WebSocketPKClient,
        getPKWebSocket,
        destroyPKWebSocket
    };
}

// 暴露到全局
window.WebSocketPKClient = WebSocketPKClient;
window.getPKWebSocket = getPKWebSocket;
window.destroyPKWebSocket = destroyPKWebSocket;

export { WebSocketPKClient, getPKWebSocket, destroyPKWebSocket };
