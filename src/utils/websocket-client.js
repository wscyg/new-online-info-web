/**
 * WebSocket客户端工具类
 * 支持自动重连、心跳检测、消息队列
 */
class WebSocketClient {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectInterval: 3000,    // 重连间隔
            heartbeatInterval: 30000,   // 心跳间隔
            maxReconnectAttempts: 5,    // 最大重连次数
            debug: false,
            ...options
        };

        this.ws = null;
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        this.messageHandlers = new Map();
        this.messageQueue = [];
        this.isConnected = false;
    }

    /**
     * 连接WebSocket
     */
    connect() {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

            if (!userId) {
                this.log('无法连接：用户未登录');
                return;
            }

            const wsUrl = `${this.url}?userId=${userId}&token=${encodeURIComponent(token)}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => this.onOpen();
            this.ws.onclose = (event) => this.onClose(event);
            this.ws.onerror = (error) => this.onError(error);
            this.ws.onmessage = (event) => this.onMessage(event);

        } catch (error) {
            this.log('连接失败:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * 连接打开
     */
    onOpen() {
        this.log('WebSocket连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 开始心跳
        this.startHeartbeat();

        // 发送队列中的消息
        this.flushMessageQueue();

        // 触发连接成功回调
        this.emit('open');
    }

    /**
     * 连接关闭
     */
    onClose(event) {
        this.log('WebSocket连接关闭', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();

        // 触发关闭回调
        this.emit('close', event);

        // 自动重连
        if (event.code !== 1000) { // 1000 = 正常关闭
            this.scheduleReconnect();
        }
    }

    /**
     * 连接错误
     */
    onError(error) {
        this.log('WebSocket错误:', error);
        this.emit('error', error);
    }

    /**
     * 接收消息
     */
    onMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.log('收到消息:', message);

            const type = message.type;
            if (this.messageHandlers.has(type)) {
                const handlers = this.messageHandlers.get(type);
                handlers.forEach(handler => handler(message));
            }

            // 触发通用消息回调
            this.emit('message', message);

        } catch (error) {
            this.log('消息解析失败:', error);
        }
    }

    /**
     * 发送消息
     */
    send(type, data = {}) {
        const message = {
            type,
            ...data,
            timestamp: Date.now()
        };

        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            this.log('发送消息:', message);
        } else {
            // 连接未建立，加入队列
            this.messageQueue.push(message);
            this.log('消息加入队列:', message);
        }
    }

    /**
     * 发送队列中的消息
     */
    flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
            this.log('发送队列消息:', message);
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
    }

    /**
     * 触发事件（用于内部事件如open, close, error）
     */
    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            handlers.forEach(handler => handler(data));
        }
    }

    /**
     * 开始心跳
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send('heartbeat', {});
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
            this.connect();
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
        this.messageQueue = [];
    }

    /**
     * 日志输出
     */
    log(...args) {
        if (this.options.debug) {
            console.log('[WebSocket]', ...args);
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
}
