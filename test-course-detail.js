const puppeteer = require('puppeteer');

async function testCourseDetailPage() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // 访问课程详情页面
        await page.goto('http://localhost:3000/src/pages/course-detail.html?id=6');

        // 等待页面加载
        await page.waitForSelector('.course-title', { timeout: 5000 });

        // 获取课程标题
        const courseTitle = await page.$eval('.course-title', el => el.textContent);
        console.log('课程标题:', courseTitle);

        // 获取章节列表
        const chapters = await page.$$eval('.chapter-item', els => els.map(el => el.textContent.trim()));
        console.log('章节列表:', chapters);

        // 检查课程标题和章节是否显示
        if (courseTitle && chapters.length > 0) {
            console.log('✅ 课程详情页面加载成功');
        } else {
            console.log('❌ 课程详情页面加载失败');
        }

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await browser.close();
    }
}

testCourseDetailPage();