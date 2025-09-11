/**
 * 实时数据同步客户端
 * 使用WebSocket替代所有轮询机制
 */
class RealTimeSync {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.subscribers = new Map();
        this.isConnected = false;
        this.userId = null;
        
        this.init();
    }
    
    init() {
        this.connect();
        this.setupEventListeners();
    }
    
    connect() {
        try {
            const wsUrl = `ws://42.194.245.66:8070/ws/realtime`;
            console.log('Connecting to WebSocket:', wsUrl);
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = (event) => {
                console.log('WebSocket connected:', event);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // 注册用户ID（如果已登录）
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        this.userId = payload.userId || payload.sub;
                        this.register(this.userId);
                    } catch (e) {
                        console.warn('Failed to parse JWT token:', e);
                    }
                }
                
                this.notifySubscribers('connection', { status: 'connected' });
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            this.socket.onclose = (event) => {
                console.log('WebSocket closed:', event);
                this.isConnected = false;
                this.notifySubscribers('connection', { status: 'disconnected' });
                
                // 自动重连
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                        this.connect();
                    }, this.reconnectDelay);
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifySubscribers('connection', { status: 'error', error });
            };
            
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }
    
    setupEventListeners() {
        // 页面卸载时关闭连接
        window.addEventListener('beforeunload', () => {
            if (this.socket) {
                this.socket.close();
            }
        });
        
        // 页面可见性变化时处理连接
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时暂停
            } else {
                // 页面可见时确保连接
                if (!this.isConnected) {
                    this.connect();
                }
            }
        });
    }
    
    register(userId) {
        this.userId = userId;
        this.sendMessage({
            type: 'register',
            userId: userId
        });
    }
    
    subscribe(dataType, callback) {
        if (!this.subscribers.has(dataType)) {
            this.subscribers.set(dataType, new Set());
        }
        this.subscribers.get(dataType).add(callback);
        
        // 向服务器发送订��消息
        this.sendMessage({
            type: 'subscribe',
            dataType: dataType
        });
        
        console.log(`Subscribed to data type: ${dataType}`);
    }
    
    unsubscribe(dataType, callback) {
        if (this.subscribers.has(dataType)) {
            this.subscribers.get(dataType).delete(callback);
            if (this.subscribers.get(dataType).size === 0) {
                this.subscribers.delete(dataType);
            }
        }
    }
    
    sendMessage(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected, message not sent:', message);
        }
    }
    
    handleMessage(data) {
        const { type } = data;
        
        switch (type) {
            case 'connected':
                console.log('Connection established:', data.message);
                break;
                
            case 'new_question':
                this.notifySubscribers('questions', data);
                this.notifySubscribers('new_question', data);
                break;
                
            case 'question_likes_updated':
                this.notifySubscribers('questions', data);
                this.notifySubscribers('question_likes', data);
                break;
                
            case 'user_points_updated':
                this.notifySubscribers('user_points', data);
                this.notifySubscribers('leaderboard', data);
                break;
                
            case 'leaderboard_updated':
                this.notifySubscribers('leaderboard', data);
                break;
                
            case 'manual_trigger':
                this.notifySubscribers(data.table, data);
                break;
                
            default:
                console.log('Unknown message type:', type, data);
        }
    }
    
    notifySubscribers(dataType, data) {
        if (this.subscribers.has(dataType)) {
            this.subscribers.get(dataType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in subscriber callback for ${dataType}:`, error);
                }
            });
        }
    }
    
    // 公共API方法
    isConnected() {
        return this.isConnected;
    }
    
    getConnectionStatus() {
        if (!this.socket) return 'not_initialized';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'closed';
            default: return 'unknown';
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// 创建全局实例
window.realTimeSync = new RealTimeSync();

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeSync;
}