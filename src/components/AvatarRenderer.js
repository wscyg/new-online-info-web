/**
 * Avatar 渲染器 - DNF纸娃娃系统
 * 功能：将多层皮肤PNG叠加成一个完整的用户形象
 *
 * 使用示例：
 * const avatar = new AvatarRenderer('canvas-id', 300, 400);
 * await avatar.loadEquippedSkins(userId);
 * avatar.render();
 */

class AvatarRenderer {
    /**
     * 构造函数
     * @param {string} canvasId - Canvas元素ID
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    constructor(canvasId, width = 300, height = 400) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas元素 #${canvasId} 不存在`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;

        this.layers = []; // 皮肤图层列表 [{image, zIndex, partType}]
        this.isLoading = false;

        // API配置
        this.apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8070/api'
            : 'http://42.194.245.66:8070/api';
    }

    /**
     * 从后端加载用户当前装备的皮肤
     * @param {number} userId - 用户ID
     */
    async loadEquippedSkins(userId) {
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(`${this.apiBaseUrl}/skins/equipped?userId=${userId}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message);
            }

            const equipped = result.data;
            console.log(`✅ 加载用户 ${userId} 的装备:`, equipped);

            // 清空现有图层
            this.layers = [];

            // 加载每个皮肤图片
            const loadPromises = equipped.map(item => this.loadSkinImage(item));
            await Promise.all(loadPromises);

            // 按Z轴排序（从小到大，底层先画）
            this.layers.sort((a, b) => a.zIndex - b.zIndex);

            console.log(`✅ ${this.layers.length} 个图层已加载`);

        } catch (error) {
            console.error('❌ 加载装备失败:', error);
            this.showError('加载失败');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 加载单个皮肤图片
     * @param {object} skinData - 皮肤数据 {skinItem: {imageUrl, zIndex, partType}}
     */
    async loadSkinImage(skinData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // 允许跨域

            img.onload = () => {
                this.layers.push({
                    image: img,
                    zIndex: skinData.skinItem.zIndex || 0,
                    partType: skinData.skinItem.partType,
                    name: skinData.skinItem.name
                });
                resolve();
            };

            img.onerror = () => {
                console.warn(`⚠️ 图片加载失败: ${skinData.skinItem.imageUrl}`);
                resolve(); // 即使失败也继续
            };

            // 如果是相对路径，补全完整URL
            const imageUrl = skinData.skinItem.imageUrl.startsWith('http')
                ? skinData.skinItem.imageUrl
                : `${window.location.origin}${skinData.skinItem.imageUrl}`;

            img.src = imageUrl;
        });
    }

    /**
     * 渲染Avatar到Canvas
     */
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 如果正在加载，显示加载动画
        if (this.isLoading) {
            return;
        }

        // 如果没有图层，显示默认占位图
        if (this.layers.length === 0) {
            this.showPlaceholder();
            return;
        }

        // 绘制所有图层（按Z轴顺序）
        this.layers.forEach(layer => {
            this.ctx.drawImage(
                layer.image,
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );
        });

        console.log(`🎨 Avatar渲染完成，共 ${this.layers.length} 层`);
    }

    /**
     * 显示加载动画
     */
    showLoading() {
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#4f46e5';
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 显示占位图
     */
    showPlaceholder() {
        // 绘制背景
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制默认人形轮廓
        this.ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        // 头部
        this.ctx.arc(this.canvas.width / 2, 80, 40, 0, Math.PI * 2);
        this.ctx.stroke();

        // 身体
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 120);
        this.ctx.lineTo(this.canvas.width / 2, 280);
        this.ctx.stroke();

        // 手臂
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 150);
        this.ctx.lineTo(this.canvas.width / 2 - 50, 200);
        this.ctx.moveTo(this.canvas.width / 2, 150);
        this.ctx.lineTo(this.canvas.width / 2 + 50, 200);
        this.ctx.stroke();

        // 腿部
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 280);
        this.ctx.lineTo(this.canvas.width / 2 - 30, 360);
        this.ctx.moveTo(this.canvas.width / 2, 280);
        this.ctx.lineTo(this.canvas.width / 2 + 30, 360);
        this.ctx.stroke();

        // 文字提示
        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('未装备皮肤', this.canvas.width / 2, this.canvas.height - 20);
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 导出为图片
     * @returns {string} Base64图片数据
     */
    exportAsImage() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * 下载为PNG文件
     * @param {string} filename - 文件名
     */
    downloadAsPNG(filename = 'avatar.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.exportAsImage();
        link.click();
    }

    /**
     * 添加动画效果（可选）
     * 例如：光环旋转、武器挥舞等
     */
    startAnimation() {
        let angle = 0;

        const animate = () => {
            this.render();

            // 示例：让光环图层旋转
            const auraLayer = this.layers.find(l => l.partType === 'AURA');
            if (auraLayer) {
                this.ctx.save();
                this.ctx.translate(this.canvas.width / 2, 80); // 头部中心
                this.ctx.rotate(angle);
                this.ctx.translate(-this.canvas.width / 2, -80);
                this.ctx.globalAlpha = 0.8;
                this.ctx.drawImage(auraLayer.image, 0, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();

                angle += 0.02;
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * 停止动画
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * 清除Canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layers = [];
    }
}

// 导出供全局使用
window.AvatarRenderer = AvatarRenderer;
