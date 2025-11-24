/**
 * PK竞技场Avatar辅助工具
 * 用于在PK匹配界面显示玩家的装备皮肤
 */

/**
 * 渲染玩家的Avatar到指定Canvas
 * @param {string} canvasId - Canvas元素ID
 * @param {number} userId - 用户ID
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 * @returns {Promise<AvatarRenderer>} Avatar渲染器实例
 */
export async function renderPlayerAvatar(canvasId, userId, width = 120, height = 160) {
    try {
        // 创建Avatar渲染器实例
        const renderer = new window.AvatarRenderer(canvasId, width, height);

        // 加载用户装备的皮肤
        await renderer.loadEquippedSkins(userId);

        // 渲染到Canvas
        renderer.render();

        console.log(`✅ 玩家 ${userId} 的Avatar已渲染到 #${canvasId}`);
        return renderer;

    } catch (error) {
        console.error(`❌ 渲染玩家 ${userId} 的Avatar失败:`, error);

        // 失败时显示占位符
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('加载失败', width / 2, height / 2);
        }

        return null;
    }
}

/**
 * 同时渲染两个玩家的Avatar（PK对战场景）
 * @param {number} player1Id - 玩家1的用户ID
 * @param {number} player2Id - 玩家2的用户ID
 * @returns {Promise<{player1: AvatarRenderer, player2: AvatarRenderer}>}
 */
export async function renderBattleAvatars(player1Id, player2Id) {
    console.log(`🎨 开始渲染PK对战Avatar: 玩家1=${player1Id}, 玩家2=${player2Id}`);

    try {
        // 并行加载两个玩家的Avatar
        const [renderer1, renderer2] = await Promise.all([
            renderPlayerAvatar('player1AvatarCanvas', player1Id, 120, 160),
            renderPlayerAvatar('player2AvatarCanvas', player2Id, 120, 160)
        ]);

        console.log('✅ 双方Avatar渲染完成');

        return {
            player1: renderer1,
            player2: renderer2
        };

    } catch (error) {
        console.error('❌ 渲染PK对战Avatar失败:', error);
        return {
            player1: null,
            player2: null
        };
    }
}

/**
 * 清除Canvas内容
 * @param {string} canvasId - Canvas元素ID
 */
export function clearAvatar(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * 在Avatar上显示加载动画
 * @param {string} canvasId - Canvas元素ID
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 */
export function showLoadingOnAvatar(canvasId, width = 120, height = 160) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, width, height);

    // 加载文字
    ctx.fillStyle = '#4f46e5';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', width / 2, height / 2);
}

/**
 * 为Avatar添加动画效果（可选）
 * @param {AvatarRenderer} renderer - Avatar渲染器实例
 * @param {string} animationType - 动画类型 ('glow', 'pulse', 'rotate')
 */
export function addAvatarAnimation(renderer, animationType = 'glow') {
    if (!renderer) return;

    switch (animationType) {
        case 'glow':
            // 光晕效果（渐变边框）
            // TODO: 实现光晕动画
            break;

        case 'pulse':
            // 脉冲缩放效果
            // TODO: 实现脉冲动画
            break;

        case 'rotate':
            // 旋转效果（如光环旋转）
            renderer.startAnimation();
            break;

        default:
            console.warn(`未知的动画类型: ${animationType}`);
    }
}
