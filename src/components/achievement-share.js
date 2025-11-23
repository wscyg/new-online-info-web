/**
 * 成就分享功能集成脚本
 * 用于在achievements.html中添加分享功能
 */

// 添加分享按钮到成就卡片
function addShareButtonToAchievements() {
    const achievementCards = document.querySelectorAll('.achievement-card, .badge-card');

    achievementCards.forEach(card => {
        // 检查是否已有分享按钮
        if (card.querySelector('.share-button')) return;

        // 创建分享按钮
        const shareButton = document.createElement('button');
        shareButton.className = 'share-button';
        shareButton.innerHTML = '📤 分享';
        shareButton.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
            z-index: 10;
        `;

        shareButton.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.5)';
        });

        shareButton.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.3)';
        });

        // 获取成就数据
        shareButton.addEventListener('click', function(e) {
            e.stopPropagation();

            const achievementData = extractAchievementData(card);
            openSharePage(achievementData);
        });

        card.style.position = 'relative';
        card.appendChild(shareButton);
    });
}

// 从卡片中提取成就数据
function extractAchievementData(card) {
    // 默认数据
    const data = {
        icon: '🏆',
        title: '学习成就',
        desc: '恭喜解锁新成就',
        stat1Value: '1',
        stat1Label: '成就',
        stat2Value: '100',
        stat2Label: '积分',
        stat3Value: '95',
        stat3Label: '超越%',
        date: new Date().toLocaleDateString('zh-CN')
    };

    // 尝试从卡片中提取实际数据
    try {
        // 查找图标
        const iconElement = card.querySelector('.badge-icon, .achievement-icon, [class*="icon"]');
        if (iconElement) {
            data.icon = iconElement.textContent.trim();
        }

        // 查找标题
        const titleElement = card.querySelector('.badge-name, .achievement-name, h3, h4, .title');
        if (titleElement) {
            data.title = titleElement.textContent.trim();
        }

        // 查找描述
        const descElement = card.querySelector('.badge-desc, .achievement-desc, .description, p');
        if (descElement) {
            data.desc = descElement.textContent.trim();
        }

        // 查找统计数据
        const stats = card.querySelectorAll('.stat, [class*="stat"]');
        if (stats.length >= 3) {
            data.stat1Value = stats[0].textContent.trim();
            data.stat2Value = stats[1].textContent.trim();
            data.stat3Value = stats[2].textContent.trim();
        }

        // 查找日期
        const dateElement = card.querySelector('.date, .time, [class*="date"]');
        if (dateElement) {
            data.date = dateElement.textContent.trim();
        }
    } catch (error) {
        console.error('提取成就数据失败:', error);
    }

    return data;
}

// 打开分享页面
function openSharePage(data) {
    // 构建URL参数
    const params = new URLSearchParams();
    params.append('icon', data.icon);
    params.append('title', data.title);
    params.append('desc', data.desc);
    params.append('stat1Value', data.stat1Value);
    params.append('stat1Label', data.stat1Label);
    params.append('stat2Value', data.stat2Value);
    params.append('stat2Label', data.stat2Label);
    params.append('stat3Value', data.stat3Value);
    params.append('stat3Label', data.stat3Label);
    params.append('date', data.date);

    // 打开新页面
    const url = `achievement-share.html?${params.toString()}`;
    window.open(url, '_blank');
}

// 快速分享功能（直接生成图片）
async function quickShareAchievement(achievementData) {
    // 显示加载提示
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    loadingDiv.innerHTML = `
        <div style="
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
        ">
            <div style="
                border: 4px solid #f3f4f6;
                border-top-color: #6366f1;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            "></div>
            <p style="color: #333; font-weight: bold;">正在生成分享图片...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);

    try {
        // 这里可以调用html2canvas生成图片
        // 或者直接跳转到分享页面
        openSharePage(achievementData);

        setTimeout(() => {
            document.body.removeChild(loadingDiv);
        }, 500);
    } catch (error) {
        console.error('快速分享失败:', error);
        alert('分享失败，请重试');
        document.body.removeChild(loadingDiv);
    }
}

// 使用示例
/*
// 在achievements.html的<script>标签中添加：

// 页面加载完成后初始化分享按钮
document.addEventListener('DOMContentLoaded', function() {
    // 等待成就卡片渲染完成
    setTimeout(() => {
        addShareButtonToAchievements();
    }, 1000);
});

// 如果成就是动态加载的，在加载完成后调用：
function loadAchievements() {
    // ... 加载成就的代码 ...

    // 加载完成后添加分享按钮
    addShareButtonToAchievements();
}
*/

// 导出函数供全局使用
window.addShareButtonToAchievements = addShareButtonToAchievements;
window.openSharePage = openSharePage;
window.quickShareAchievement = quickShareAchievement;
