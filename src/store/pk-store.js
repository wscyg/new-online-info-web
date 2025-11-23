/**
 * PK对战系统状态管理
 * 使用Zustand进行状态管理
 */

// 简化版Zustand实现（如果项目未安装zustand）
const create = (createState) => {
    let state;
    const listeners = new Set();

    const setState = (partial) => {
        const nextState = typeof partial === 'function' ? partial(state) : partial;
        state = { ...state, ...nextState };
        listeners.forEach(listener => listener(state));
    };

    const getState = () => state;

    const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const api = { setState, getState, subscribe };
    state = createState(setState, getState, api);

    return api;
};

// 段位配置
const TIERS = {
    BRONZE: { name: '青铜', minElo: 0, maxElo: 1199, color: '#cd7f32', icon: '🥉' },
    SILVER: { name: '白银', minElo: 1200, maxElo: 1399, color: '#c0c0c0', icon: '🥈' },
    GOLD: { name: '黄金', minElo: 1400, maxElo: 1599, color: '#ffd700', icon: '🥇' },
    PLATINUM: { name: '铂金', minElo: 1600, maxElo: 1799, color: '#e5e4e2', icon: '💎' },
    DIAMOND: { name: '钻石', minElo: 1800, maxElo: 1999, color: '#b9f2ff', icon: '💠' },
    MASTER: { name: '大师', minElo: 2000, maxElo: 2199, color: '#9d00ff', icon: '👑' },
    GRANDMASTER: { name: '宗师', minElo: 2200, maxElo: 2399, color: '#ff1744', icon: '⭐' },
    CHALLENGER: { name: '王者', minElo: 2400, maxElo: 9999, color: '#ffd700', icon: '🏆' }
};

// 对战模式配置
const BATTLE_MODES = {
    QUICK: { name: '快速模式', duration: 300, questionCount: 5, description: '5题速战' },
    STANDARD: { name: '标准模式', duration: 600, questionCount: 10, description: '10题对决' },
    MARATHON: { name: '马拉松模式', duration: 1200, questionCount: 20, description: '20题长篇' }
};

/**
 * 创建PK Store
 */
const usePKStore = create((set, get) => ({
    // ========== 对战状态 ==========
    currentBattle: null,
    battleStatus: 'idle', // idle | matching | ready | inBattle | ended
    battleResult: null,
    opponentInfo: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    opponentProgress: {
        questionIndex: 0,
        correctCount: 0
    },

    // ========== 匹配状态 ==========
    matchingStatus: 'idle', // idle | searching | found
    matchingMode: 'QUICK',
    matchingStartTime: null,

    // ========== 用户统计 ==========
    userStats: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        elo: 1200,
        tier: 'SILVER',
        rank: 0,
        streak: 0,
        maxStreak: 0
    },

    // ========== 好友系统 ==========
    friends: [],
    onlineFriends: [],
    pendingRequests: [],
    friendsLoading: false,

    // ========== 排行榜 ==========
    rankings: {
        leaderboard: [],
        myRanking: null,
        tierDistribution: {},
        period: 'all',
        type: 'elo'
    },

    // ========== 在线用户 ==========
    onlineUsers: [],

    // ========== WebSocket连接 ==========
    wsConnected: false,

    // ========== Actions ==========

    /**
     * 设置对战信息
     */
    setBattle: (battle) => set({ currentBattle: battle }),

    /**
     * 设置对战状态
     */
    setBattleStatus: (status) => set({ battleStatus: status }),

    /**
     * 开始匹配
     */
    startMatching: (mode) => set({
        matchingStatus: 'searching',
        matchingMode: mode,
        matchingStartTime: Date.now(),
        battleStatus: 'matching'
    }),

    /**
     * 取消匹配
     */
    cancelMatching: () => set({
        matchingStatus: 'idle',
        matchingMode: null,
        matchingStartTime: null,
        battleStatus: 'idle'
    }),

    /**
     * 匹配成功
     */
    matchFound: (battleInfo) => set({
        matchingStatus: 'found',
        currentBattle: battleInfo,
        battleStatus: 'ready',
        opponentInfo: battleInfo.opponent
    }),

    /**
     * 开始对战
     */
    startBattle: (questions) => set({
        questions,
        currentQuestionIndex: 0,
        answers: [],
        battleStatus: 'inBattle',
        opponentProgress: {
            questionIndex: 0,
            correctCount: 0
        }
    }),

    /**
     * 提交答案
     */
    submitAnswer: (questionId, answer, answerTime, isCorrect) => {
        const state = get();
        const newAnswers = [...state.answers, {
            questionId,
            answer,
            answerTime,
            isCorrect,
            timestamp: Date.now()
        }];

        set({
            answers: newAnswers,
            currentQuestionIndex: state.currentQuestionIndex + 1
        });
    },

    /**
     * 更新对手进度
     */
    updateOpponentProgress: (progress) => set({
        opponentProgress: {
            questionIndex: progress.questionIndex || 0,
            correctCount: progress.correctCount || 0
        }
    }),

    /**
     * 结束对战
     */
    endBattle: (result) => {
        set({
            battleResult: result,
            battleStatus: 'ended'
        });

        // 更新用户统计
        const state = get();
        const newStats = { ...state.userStats };

        newStats.totalBattles += 1;

        if (result.winner === 'player') {
            newStats.wins += 1;
            newStats.streak = (newStats.streak >= 0 ? newStats.streak : 0) + 1;
        } else if (result.winner === 'opponent') {
            newStats.losses += 1;
            newStats.streak = (newStats.streak <= 0 ? newStats.streak : 0) - 1;
        } else {
            newStats.draws += 1;
            newStats.streak = 0;
        }

        newStats.winRate = (newStats.wins / newStats.totalBattles * 100).toFixed(1);
        newStats.maxStreak = Math.max(newStats.maxStreak, Math.abs(newStats.streak));

        if (result.eloChange) {
            newStats.elo += result.eloChange;
            newStats.tier = getTierByElo(newStats.elo);
        }

        set({ userStats: newStats });
    },

    /**
     * 重置对战
     */
    resetBattle: () => set({
        currentBattle: null,
        battleStatus: 'idle',
        battleResult: null,
        opponentInfo: null,
        questions: [],
        currentQuestionIndex: 0,
        answers: [],
        opponentProgress: {
            questionIndex: 0,
            correctCount: 0
        }
    }),

    /**
     * 设置用户统计
     */
    setUserStats: (stats) => set({ userStats: stats }),

    /**
     * 加载用户统计
     */
    loadUserStats: async () => {
        try {
            const response = await window.API.ranking.getMyStats();
            if (response.code === 200 && response.data) {
                const stats = response.data;
                stats.tier = getTierByElo(stats.elo || 1200);
                set({ userStats: stats });
            }
        } catch (error) {
            console.error('加载用户统计失败:', error);
        }
    },

    /**
     * 设置好友列表
     */
    setFriends: (friends) => set({ friends }),

    /**
     * 设置在线好友
     */
    setOnlineFriends: (onlineFriends) => set({ onlineFriends }),

    /**
     * 加载好友列表
     */
    loadFriends: async () => {
        set({ friendsLoading: true });
        try {
            const response = await window.API.friend.getFriendList();
            if (response.code === 200 && response.data) {
                set({ friends: response.data.items || response.data });
            }
        } catch (error) {
            console.error('加载好友列表失败:', error);
        } finally {
            set({ friendsLoading: false });
        }
    },

    /**
     * 加载待处理请求
     */
    loadPendingRequests: async () => {
        try {
            const response = await window.API.friend.getPendingRequests();
            if (response.code === 200 && response.data) {
                set({ pendingRequests: response.data });
            }
        } catch (error) {
            console.error('加载好友请求失败:', error);
        }
    },

    /**
     * 发送好友请求
     */
    sendFriendRequest: async (userId, message) => {
        try {
            const response = await window.API.friend.sendRequest(userId, message);
            if (response.code === 200) {
                return { success: true };
            }
            return { success: false, error: response.message };
        } catch (error) {
            console.error('发送好友请求失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 接受好友请求
     */
    acceptFriendRequest: async (requestId) => {
        try {
            const response = await window.API.friend.acceptRequest(requestId);
            if (response.code === 200) {
                // 刷新好友列表和待处理请求
                get().loadFriends();
                get().loadPendingRequests();
                return { success: true };
            }
            return { success: false, error: response.message };
        } catch (error) {
            console.error('接受好友请求失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 删除好友
     */
    deleteFriend: async (friendId) => {
        try {
            const response = await window.API.friend.deleteFriend(friendId);
            if (response.code === 200) {
                get().loadFriends();
                return { success: true };
            }
            return { success: false, error: response.message };
        } catch (error) {
            console.error('删除好友失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 设置排行榜数据
     */
    setRankings: (rankings) => set({ rankings: { ...get().rankings, ...rankings } }),

    /**
     * 加载排行榜
     */
    loadLeaderboard: async (type = 'elo', period = 'all', limit = 100) => {
        try {
            const response = await window.API.ranking.getLeaderboard(type, period, limit);
            if (response.code === 200 && response.data) {
                set({
                    rankings: {
                        ...get().rankings,
                        leaderboard: response.data.items || response.data,
                        type,
                        period
                    }
                });
            }
        } catch (error) {
            console.error('加载排行榜失败:', error);
        }
    },

    /**
     * 加载我的排名
     */
    loadMyRanking: async (type = 'elo', period = 'all') => {
        try {
            const response = await window.API.ranking.getMyRanking(type, period);
            if (response.code === 200 && response.data) {
                set({
                    rankings: {
                        ...get().rankings,
                        myRanking: response.data
                    }
                });
            }
        } catch (error) {
            console.error('加载我的排名失败:', error);
        }
    },

    /**
     * 加载在线用户
     */
    loadOnlineUsers: async (page = 1, size = 20) => {
        try {
            const response = await window.API.pk.getOnlineUsers(page, size);
            if (response.code === 200 && response.data) {
                set({ onlineUsers: response.data.items || response.data });
            }
        } catch (error) {
            console.error('加载在线用户失败:', error);
        }
    },

    /**
     * 设置WebSocket连接状态
     */
    setWSConnected: (connected) => set({ wsConnected: connected }),

    /**
     * 获取当前段位信息
     */
    getCurrentTier: () => {
        const { userStats } = get();
        return TIERS[userStats.tier] || TIERS.SILVER;
    },

    /**
     * 获取对战模式信息
     */
    getBattleMode: (mode) => {
        return BATTLE_MODES[mode] || BATTLE_MODES.QUICK;
    }
}));

/**
 * 根据ELO获取段位
 */
function getTierByElo(elo) {
    for (const [tierKey, tierInfo] of Object.entries(TIERS)) {
        if (elo >= tierInfo.minElo && elo <= tierInfo.maxElo) {
            return tierKey;
        }
    }
    return 'SILVER';
}

/**
 * 获取段位颜色
 */
function getTierColor(tier) {
    return TIERS[tier]?.color || '#c0c0c0';
}

/**
 * 获取段位图标
 */
function getTierIcon(tier) {
    return TIERS[tier]?.icon || '🥈';
}

/**
 * 获取段位名称
 */
function getTierName(tier) {
    return TIERS[tier]?.name || '白银';
}

// 暴露到全局
window.usePKStore = usePKStore;
window.pkStore = usePKStore;
window.TIERS = TIERS;
window.BATTLE_MODES = BATTLE_MODES;
window.getTierByElo = getTierByElo;
window.getTierColor = getTierColor;
window.getTierIcon = getTierIcon;
window.getTierName = getTierName;

export {
    usePKStore,
    TIERS,
    BATTLE_MODES,
    getTierByElo,
    getTierColor,
    getTierIcon,
    getTierName
};
