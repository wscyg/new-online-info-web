const puppeteer = require('puppeteer');

async function testCourse() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    // 监听控制台消息
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Console Error:', msg.text());
        }
    });

    console.log('=== 1. 测试免费课程页面加载 ===');
    await page.goto('http://localhost:3000/src/pages/free-course.html', {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    // 等待课程容器或错误出现
    await new Promise(r => setTimeout(r, 3000));

    // 检查加载是否成功
    const loadingHidden = await page.evaluate(() => {
        const loading = document.getElementById('loadingScreen');
        return loading?.classList.contains('hidden');
    });
    console.log('加载动画隐藏:', loadingHidden ? '✓' : '✗');

    // 检查课程容器是否存在
    const hasContainer = await page.$('.course-pages');
    console.log('课程容器:', hasContainer ? '✓ 存在' : '✗ 不存在');

    // 检查是否有页面
    const pageCount = await page.$$eval('.course-page', pages => pages.length);
    console.log('渲染页面数:', pageCount);

    // 截图
    await page.screenshot({ path: '/tmp/course-page1.png', fullPage: true });
    console.log('截图: /tmp/course-page1.png');

    console.log('\n=== 2. 测试页面导航 ===');
    // 测试右箭头翻页
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 800));

    const pageNumber = await page.$eval('.nav-current', el => el.textContent);
    console.log('当前页码:', pageNumber);

    await page.screenshot({ path: '/tmp/course-page2.png', fullPage: true });
    console.log('截图: /tmp/course-page2.png');

    console.log('\n=== 3. 测试多页翻页 ===');
    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowRight');
        await new Promise(r => setTimeout(r, 600));
    }

    const currentPage = await page.$eval('.nav-current', el => el.textContent);
    console.log('翻页后页码:', currentPage);

    await page.screenshot({ path: '/tmp/course-page5.png', fullPage: true });
    console.log('截图: /tmp/course-page5.png');

    console.log('\n=== 4. 测试主题切换 ===');
    // 点击主题切换器
    const themeSwitcher = await page.$('.theme-switcher-toggle');
    if (themeSwitcher) {
        await themeSwitcher.click();
        await new Promise(r => setTimeout(r, 500));

        // 选择海洋蓝主题
        const oceanBtn = await page.$('[data-theme="ocean"]');
        if (oceanBtn) {
            await oceanBtn.click();
            await new Promise(r => setTimeout(r, 500));
            console.log('✓ 主题已切换到海洋蓝');

            await page.screenshot({ path: '/tmp/course-ocean-theme.png', fullPage: true });
            console.log('截图: /tmp/course-ocean-theme.png');
        }
    }

    console.log('\n=== 5. 测试目录功能 ===');
    const tocToggle = await page.$('.toc-toggle');
    if (tocToggle) {
        await tocToggle.click();
        await new Promise(r => setTimeout(r, 500));
        console.log('✓ 目录已打开');

        await page.screenshot({ path: '/tmp/course-toc.png', fullPage: true });
        console.log('截图: /tmp/course-toc.png');

        // 点击目录项跳转
        const tocPage = await page.$('.toc-page[data-page="5"]');
        if (tocPage) {
            await tocPage.click();
            await new Promise(r => setTimeout(r, 600));
            const jumpedPage = await page.$eval('.nav-current', el => el.textContent);
            console.log('跳转后页码:', jumpedPage);
        }
    }

    console.log('\n=== 6. 测试进度条 ===');
    const progressWidth = await page.$eval('.course-progress-fill', el => el.style.width);
    console.log('进度条宽度:', progressWidth);

    console.log('\n=== 7. 测试组件渲染 ===');
    // 跳到有特殊组件的页面
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 600));

    // 检查各种组件是否存在
    const components = {
        'hero': await page.$('.component-hero'),
        'heading': await page.$('.component-heading'),
        'paragraph': await page.$('.component-paragraph'),
        'cards-grid': await page.$('.component-cards-grid'),
        'timeline': await page.$('.component-timeline'),
        'quiz': await page.$('.component-quiz'),
        'callout': await page.$('.component-callout'),
        'formula-box': await page.$('.component-formula-box'),
        'key-points': await page.$('.component-key-points'),
        'experiment': await page.$('.component-experiment'),
        'socratic': await page.$('.component-socratic')
    };

    console.log('组件渲染检查:');
    let foundComponents = [];
    for (const [name, el] of Object.entries(components)) {
        if (el) foundComponents.push(name);
    }
    console.log('  已渲染组件:', foundComponents.join(', ') || '无');

    console.log('\n=== 8. 测试Quiz交互 ===');
    // 跳到测验页
    for (let i = 0; i < 10; i++) {
        const hasQuiz = await page.$('.component-quiz');
        if (hasQuiz) break;
        await page.keyboard.press('ArrowRight');
        await new Promise(r => setTimeout(r, 400));
    }

    const quizEl = await page.$('.component-quiz');
    if (quizEl) {
        // 选择一个选项
        const option = await page.$('.quiz-option');
        if (option) {
            await option.click();
            await new Promise(r => setTimeout(r, 300));

            // 提交答案
            const submitBtn = await page.$('.quiz-submit');
            if (submitBtn) {
                await submitBtn.click();
                await new Promise(r => setTimeout(r, 500));
                console.log('✓ Quiz提交成功');

                await page.screenshot({ path: '/tmp/course-quiz.png', fullPage: true });
                console.log('截图: /tmp/course-quiz.png');
            }
        }
    }

    console.log('\n=== 9. 测试亮色主题 ===');
    // 切换到亮色主题
    const themeToggle2 = await page.$('.theme-switcher-toggle');
    if (themeToggle2) {
        await themeToggle2.click();
        await new Promise(r => setTimeout(r, 300));

        const lightBtn = await page.$('[data-theme="light"]');
        if (lightBtn) {
            await lightBtn.click();
            await new Promise(r => setTimeout(r, 500));
            console.log('✓ 已切换到亮色主题');

            await page.screenshot({ path: '/tmp/course-light-theme.png', fullPage: true });
            console.log('截图: /tmp/course-light-theme.png');
        }
    }

    console.log('\n=== 10. 测试赛博朋克主题 ===');
    const themeToggle3 = await page.$('.theme-switcher-toggle');
    if (themeToggle3) {
        await themeToggle3.click();
        await new Promise(r => setTimeout(r, 300));

        const cyberpunkBtn = await page.$('[data-theme="cyberpunk"]');
        if (cyberpunkBtn) {
            await cyberpunkBtn.click();
            await new Promise(r => setTimeout(r, 500));
            console.log('✓ 已切换到赛博朋克主题');

            await page.screenshot({ path: '/tmp/course-cyberpunk-theme.png', fullPage: true });
            console.log('截图: /tmp/course-cyberpunk-theme.png');
        }
    }

    console.log('\n=== 测试完成 ===');
    console.log('请查看 /tmp/course-*.png 确认页面效果');

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
}

testCourse().catch(console.error);
