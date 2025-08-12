// 学习页面脚本 - 加载和显示章节内容
(function() {
    const studyManager = {
        courseId: null,
        chapterId: null,
        chapters: [],
        currentChapter: null,
        currentContent: null,
        
        // 初始化
        async init() {
            // 从URL获取参数
            const urlParams = new URLSearchParams(window.location.search);
            this.courseId = urlParams.get('courseId') || 1;
            this.chapterId = urlParams.get('chapterId') || 101;
            
            await this.loadChapterContent();
            this.bindEvents();
        },
        
        // 加载章节内容
        async loadChapterContent() {
            try {
                // 首先检查用户订阅状态
                console.log(`准备检查订阅状态 - courseId: ${this.courseId}, chapterId: ${this.chapterId}`);
                
                if (typeof window.checkSubscriptionStatus === 'function') {
                    try {
                        const subscriptionStatus = await window.checkSubscriptionStatus(this.courseId);
                        console.log('订阅状态检查结果:', subscriptionStatus);
                        
                        if (!subscriptionStatus.hasAccess && subscriptionStatus.needLogin) {
                            console.log('用户未登录，显示登录页面');
                            this.showLoginRequired();
                            return;
                        } else if (!subscriptionStatus.hasAccess && !subscriptionStatus.needLogin) {
                            // 用户已登录但没有订阅，让后端决定是否允许访问
                            console.log('用户已登录但没有订阅，继续尝试访问（让后端检查章节是否免费）');
                            // 不在这里拦截，让后端的权限检查来决定
                        }
                        
                        console.log('订阅检查通过，继续加载内容');
                    } catch (error) {
                        console.error('订阅状态检查失败:', error);
                        // 如果检查失败，继续尝试加载内容（降级处理）
                    }
                } else {
                    console.log('checkSubscriptionStatus函数不可用，跳过订阅检查');
                }
                
                // 确保API服务已加载
                if (typeof window.API === 'undefined') {
                    console.error('API service not loaded, falling back to direct fetch');
                    const token = localStorage.getItem('token');
                    const headers = {
                        'Content-Type': 'application/json'
                    };
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const response = await fetch(`http://localhost:8080/api/content/chapters/${this.chapterId}`, {
                        headers: headers
                    });
                    const data = await response.json();
                    
                    if (data.code === 200 && data.data) {
                        this.currentContent = data.data;
                        this.displayContent();
                    } else if (data.code === 403) {
                        this.showSubscriptionRequired();
                    } else if (data.code === 401) {
                        this.showLoginRequired();
                    } else {
                        await this.loadDefaultChapter();
                    }
                    return;
                }
                
                // 使用API服务获取章节内容
                const response = await window.API.content.getChapterDetails(this.chapterId);
                
                if (response.code === 200 && response.data) {
                    this.currentContent = response.data;
                    this.displayContent();
                } else if (response.code === 403) {
                    this.showSubscriptionRequired();
                } else if (response.code === 401) {
                    this.showLoginRequired();
                } else {
                    console.error('Failed to load chapter content:', response.message);
                    await this.loadDefaultChapter();
                }
            } catch (error) {
                console.error('Error loading chapter content:', error);
                await this.loadDefaultChapter();
            }
        },
        
        // 加载默认章节（ID=101，免费章节）
        async loadDefaultChapter() {
            try {
                // 确保API服务已加载
                if (typeof window.API === 'undefined') {
                    console.error('API service not loaded, falling back to direct fetch');
                    const response = await fetch('http://localhost:8080/api/content/chapters/101');
                    const data = await response.json();
                    
                    if (data.code === 200 && data.data) {
                        this.currentContent = data.data;
                        this.displayContent();
                    } else {
                        this.showErrorState();
                    }
                    return;
                }
                
                // 使用API服务加载默认章节
                const response = await window.API.content.getChapterDetails(101);
                
                if (response.code === 200 && response.data) {
                    this.currentContent = response.data;
                    this.displayContent();
                } else {
                    console.error('Failed to load default chapter:', response.message);
                    this.showErrorState();
                }
            } catch (error) {
                console.error('Error loading default chapter:', error);
                this.showErrorState();
            }
        },
        
        // 显示内容
        displayContent() {
            const contentFrame = document.getElementById('contentFrame');
            if (!contentFrame) {
                console.error('Content frame not found');
                return;
            }
            
            // 如果有HTML内容，使用iframe显示
            if (this.currentContent && this.currentContent.contentHtml) {
                const iframeDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(this.currentContent.contentHtml);
                iframeDoc.close();
                
                // 更新页面标题和信息
                this.updatePageInfo();
            } else {
                this.showErrorState();
            }
        },
        
        // 更新页面信息
        updatePageInfo() {
            const chapterTitle = document.getElementById('chapterTitle');
            const readingTime = document.getElementById('readingTime');
            const wordCount = document.getElementById('wordCount');
            
            if (chapterTitle && this.currentContent) {
                chapterTitle.textContent = this.currentContent.chapterTitle || 'Transformer架构学习';
            }
            
            if (readingTime && this.currentContent) {
                readingTime.textContent = `预计阅读时间：${this.currentContent.readingTime || 30}分钟`;
            }
            
            if (wordCount && this.currentContent) {
                wordCount.textContent = `字数：${this.currentContent.wordCount || 2000}字`;
            }
        },
        
        // 显示错误状态
        showErrorState() {
            const contentFrame = document.getElementById('contentFrame');
            if (!contentFrame) return;
            
            const errorHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: Arial, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                        }
                        .error-container {
                            text-align: center;
                            padding: 40px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                        }
                        h1 { font-size: 48px; margin-bottom: 20px; }
                        p { font-size: 18px; margin-bottom: 30px; }
                        button {
                            padding: 12px 30px;
                            background: white;
                            color: #667eea;
                            border: none;
                            border-radius: 25px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: transform 0.3s;
                        }
                        button:hover { transform: scale(1.05); }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>📚</h1>
                        <h1>加载失败</h1>
                        <p>章节内容加载失败，请稍后重试</p>
                        <button onclick="window.location.reload()">重新加载</button>
                    </div>
                </body>
                </html>
            `;
            
            const iframeDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(errorHTML);
            iframeDoc.close();
        },
        
        // 显示需要登录
        showLoginRequired() {
            const contentFrame = document.getElementById('contentFrame');
            if (!contentFrame) return;
            
            const loginHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: Arial, sans-serif;
                            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                            color: white;
                        }
                        .login-container {
                            text-align: center;
                            padding: 40px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                        }
                        h1 { font-size: 48px; margin-bottom: 20px; }
                        p { font-size: 18px; margin-bottom: 30px; }
                        button {
                            padding: 12px 30px;
                            background: white;
                            color: #4CAF50;
                            border: none;
                            border-radius: 25px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: transform 0.3s;
                            margin: 0 10px;
                        }
                        button:hover { transform: scale(1.05); }
                    </style>
                </head>
                <body>
                    <div class="login-container">
                        <h1>🔐</h1>
                        <h1>需要登录</h1>
                        <p>请先登录以访问此章节内容</p>
                        <button onclick="parent.location.href='/src/pages/login.html?returnUrl=' + encodeURIComponent(parent.location.href)">立即登录</button>
                        <button onclick="parent.location.href='/src/pages/register.html'">注册账户</button>
                    </div>
                </body>
                </html>
            `;
            
            const iframeDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(loginHTML);
            iframeDoc.close();
        },
        
        // 显示需要订阅
        showSubscriptionRequired() {
            const contentFrame = document.getElementById('contentFrame');
            if (!contentFrame) return;
            
            const subscriptionHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: Arial, sans-serif;
                            background: linear-gradient(135deg, #FF6B6B 0%, #ee5a52 100%);
                            color: white;
                        }
                        .subscription-container {
                            text-align: center;
                            padding: 40px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                        }
                        h1 { font-size: 48px; margin-bottom: 20px; }
                        p { font-size: 18px; margin-bottom: 30px; }
                        button {
                            padding: 12px 30px;
                            background: white;
                            color: #FF6B6B;
                            border: none;
                            border-radius: 25px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: transform 0.3s;
                            margin: 0 10px;
                        }
                        button:hover { transform: scale(1.05); }
                    </style>
                </head>
                <body>
                    <div class="subscription-container">
                        <h1>💎</h1>
                        <h1>需要订阅</h1>
                        <p>此章节为付费内容，请购买课程后访问</p>
                        <button onclick="parent.location.href='/src/pages/payment.html?courseId=${this.courseId}'">立即购买</button>
                        <button onclick="parent.location.href='/src/pages/course-detail.html?id=${this.courseId}'">查看课程详情</button>
                    </div>
                </body>
                </html>
            `;
            
            const iframeDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(subscriptionHTML);
            iframeDoc.close();
        },
        
        // 切换全屏
        toggleFullscreen() {
            const container = document.getElementById('contentContainer');
            if (!container) return;
            
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => {
                    console.error('Error attempting to enable fullscreen:', err);
                });
            } else {
                document.exitFullscreen();
            }
        },
        
        // 切换章节
        async switchChapter(chapterId) {
            this.chapterId = chapterId;
            await this.loadChapterContent();
            
            // 更新URL
            const newUrl = `${window.location.pathname}?courseId=${this.courseId}&chapterId=${chapterId}`;
            window.history.pushState({}, '', newUrl);
        },
        
        // 下一章
        async nextChapter() {
            // 简单实现：章节ID+1
            const nextId = parseInt(this.chapterId) + 1;
            if (nextId <= 102) { // 假设最多3章
                await this.switchChapter(nextId);
            } else {
                alert('已经是最后一章了');
            }
        },
        
        // 上一章
        async prevChapter() {
            // 简单实现：章节ID-1
            const prevId = parseInt(this.chapterId) - 1;
            if (prevId >= 101) { // 假设从101开始
                await this.switchChapter(prevId);
            } else {
                alert('已经是第一章了');
            }
        },
        
        // 绑定事件
        bindEvents() {
            // 全屏按钮
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
            }
            
            // 导航按钮
            const nextBtn = document.getElementById('nextChapterBtn');
            const prevBtn = document.getElementById('prevChapterBtn');
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextChapter());
            }
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.prevChapter());
            }
            
            // 键盘快捷键
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') {
                    this.nextChapter();
                } else if (e.key === 'ArrowLeft') {
                    this.prevChapter();
                } else if (e.key === 'f' || e.key === 'F') {
                    this.toggleFullscreen();
                }
            });
        }
    };
    
    // 设置全局访问
    window.studyManager = studyManager;
    
    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => studyManager.init());
    } else {
        studyManager.init();
    }
})();