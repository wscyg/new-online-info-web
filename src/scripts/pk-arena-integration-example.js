/**
 * PK竞技场前端集成示例
 * 展示如何将Avatar渲染和反作弊功能集成到现有代码中
 *
 * 使用方法：
 * 1. 将此文件中的代码片段复制到实际的 pk/arena.js 中
 * 2. 确保已引入 AvatarRenderer.js 和 pk-avatar-helper.js
 * 3. 根据实际API端点调整URL
 */

import { renderBattleAvatars, showLoadingOnAvatar, clearAvatar } from './pk-avatar-helper.js';

// ==================== 示例1: 匹配成功后渲染Avatar ====================

/**
 * 匹配成功回调函数（添加到现有的PKArena类中）
 */
async function onMatchFound(matchData) {
    const { player1, player2, battleId, battleMode } = matchData;

    console.log('🎯 匹配成功！', matchData);

    // 1. 显示匹配成功界面
    document.getElementById('matchingView').classList.add('pk-hidden');
    document.getElementById('matchFoundView').classList.remove('pk-hidden');

    // 2. 更新玩家信息
    document.getElementById('player1Name').textContent = player1.username;
    document.getElementById('player2Name').textContent = player2.username;
    document.getElementById('player1Tier').textContent = getTierBadge(player1.rankTier);
    document.getElementById('player2Tier').textContent = getTierBadge(player2.rankTier);

    // 3. 【新增】显示加载动画
    showLoadingOnAvatar('player1AvatarCanvas', 120, 160);
    showLoadingOnAvatar('player2AvatarCanvas', 120, 160);

    // 4. 【新增】渲染双方Avatar（异步加载）
    try {
        const avatars = await renderBattleAvatars(player1.userId, player2.userId);
        console.log('✅ Avatar渲染完成', avatars);

        // 可选：添加光环旋转动画
        // if (avatars.player1) {
        //     addAvatarAnimation(avatars.player1, 'rotate');
        // }
        // if (avatars.player2) {
        //     addAvatarAnimation(avatars.player2, 'rotate');
        // }
    } catch (error) {
        console.error('❌ Avatar渲染失败', error);
        // 失败不影响核心流程，继续
    }

    // 5. 启动倒计时
    startCountdown(5, () => {
        // 倒计时结束，跳转到对战页面
        window.location.href = `pk-battle.html?battleId=${battleId}`;
    });
}

/**
 * 段位徽章获取
 */
function getTierBadge(tier) {
    const badges = {
        'BRONZE': '🥉 青铜',
        'SILVER': '🥈 白银',
        'GOLD': '🥇 黄金',
        'PLATINUM': '💎 铂金',
        'DIAMOND': '💠 钻石',
        'MASTER': '👑 大师',
        'GRANDMASTER': '🏆 宗师',
        'CHALLENGER': '⚡ 王者'
    };
    return badges[tier] || '🎮 新手';
}

/**
 * 倒计时
 */
function startCountdown(seconds, callback) {
    let remaining = seconds;
    const timerElement = document.getElementById('countdownTimer');

    const interval = setInterval(() => {
        remaining--;
        timerElement.textContent = remaining;

        if (remaining <= 0) {
            clearInterval(interval);
            callback();
        }
    }, 1000);
}

// ==================== 示例2: 匹配中状态 ====================

/**
 * 开始匹配
 */
async function startMatching() {
    const courseId = document.getElementById('courseSelect').value;
    const battleMode = getSelectedBattleMode(); // QUICK, STANDARD, LONG

    if (!courseId) {
        alert('请先选择课程！');
        return;
    }

    // 显示匹配中界面
    document.getElementById('matchingIdleView').classList.add('pk-hidden');
    document.getElementById('matchingView').classList.remove('pk-hidden');

    // 启动匹配计时器
    let duration = 0;
    const matchingTimer = setInterval(() => {
        duration++;
        document.getElementById('matchingDuration').textContent = duration;
    }, 1000);

    try {
        // 调用匹配API
        const response = await fetch('/api/pk/matching/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({
                courseId: courseId,
                battleMode: battleMode
            })
        });

        const result = await response.json();

        if (result.code === 200) {
            // 匹配成功
            clearInterval(matchingTimer);
            await onMatchFound(result.data);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('匹配失败', error);
        clearInterval(matchingTimer);
        alert('匹配失败：' + error.message);

        // 恢复到初始状态
        document.getElementById('matchingView').classList.add('pk-hidden');
        document.getElementById('matchingIdleView').classList.remove('pk-hidden');
    }
}

/**
 * 取消匹配
 */
async function cancelMatching() {
    try {
        await fetch('/api/pk/matching/cancel', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });

        // 清除Avatar
        clearAvatar('player1AvatarCanvas');
        clearAvatar('player2AvatarCanvas');

        // 返回初始界面
        document.getElementById('matchingView').classList.add('pk-hidden');
        document.getElementById('matchFoundView').classList.add('pk-hidden');
        document.getElementById('matchingIdleView').classList.remove('pk-hidden');

    } catch (error) {
        console.error('取消匹配失败', error);
    }
}

// ==================== 示例3: 页面初始化 ====================

/**
 * 页面加载完成后的初始化
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 加载用户统计信息
    await loadUserStats();

    // 2. 加载课程列表
    await loadCourseList();

    // 3. 加载在线好友
    await loadOnlineFriends();

    // 4. 加载最近对战
    await loadRecentBattles();

    // 5. 绑定事件监听器
    bindEventListeners();
});

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 快速匹配按钮
    document.getElementById('quickMatchBtn').addEventListener('click', startMatching);

    // 取消匹配按钮
    document.getElementById('cancelMatchBtn').addEventListener('click', cancelMatching);

    // 立即开始按钮
    document.getElementById('startBattleBtn').addEventListener('click', () => {
        const battleId = getCurrentBattleId(); // 需要从匹配结果中获取
        window.location.href = `pk-battle.html?battleId=${battleId}`;
    });

    // 模式选择卡片
    document.querySelectorAll('.pk-mode-card').forEach(card => {
        card.addEventListener('click', () => {
            // 移除其他卡片的active状态
            document.querySelectorAll('.pk-mode-card').forEach(c => c.classList.remove('active'));
            // 添加当前卡片的active状态
            card.classList.add('active');
        });
    });
}

/**
 * 加载用户统计信息
 */
async function loadUserStats() {
    try {
        const response = await fetch('/api/pk/stats/my', {
            headers: {
                'Authorization': 'Bearer ' + getToken()
            }
        });

        const result = await response.json();

        if (result.code === 200) {
            const stats = result.data;

            document.getElementById('userElo').textContent = stats.eloRating;
            document.getElementById('userWins').textContent = stats.totalWins;
            document.getElementById('userLosses').textContent = stats.totalLosses;
            document.getElementById('userWinRate').textContent =
                (stats.totalWins / (stats.totalWins + stats.totalLosses) * 100).toFixed(1) + '%';
            document.getElementById('userTier').textContent = getTierBadge(stats.rankTier);
        }

    } catch (error) {
        console.error('加载用户统计失败', error);
    }
}

// ==================== 工具函数 ====================

/**
 * 获取当前选择的对战模式
 */
function getSelectedBattleMode() {
    const activeCard = document.querySelector('.pk-mode-card.active');
    return activeCard ? activeCard.dataset.mode : 'STANDARD';
}

/**
 * 获取JWT Token
 */
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * 获取当前对战ID（临时存储）
 */
let currentBattleId = null;

function getCurrentBattleId() {
    return currentBattleId;
}

function setCurrentBattleId(battleId) {
    currentBattleId = battleId;
}

// ==================== 导出 ====================

export {
    onMatchFound,
    startMatching,
    cancelMatching,
    loadUserStats,
    getTierBadge
};
