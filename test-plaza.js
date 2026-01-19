const puppeteer = require('puppeteer');

async function testPlaza() {
    const browser = await puppeteer.launch({
        headless: false,  // 显示浏览器
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    console.log('=== 1. 测试登录页面 ===');
    await page.goto('http://localhost:3000/src/pages/login.html');
    await page.waitForSelector('#username');

    // 输入用户名密码
    await page.type('#username', 'cygws123');
    await page.type('#password', '123.00.aa');

    // 点击登录
    await page.click('#submitBtn');

    // 等待跳转
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    console.log('登录后页面:', page.url());

    console.log('\n=== 2. 测试在线广场页面 ===');
    await page.goto('http://localhost:3000/src/pages/online-plaza.html');
    await new Promise(r => setTimeout(r, 3000));

    // 检查页面元素
    const onlineCount = await page.$eval('#onlineCount', el => el.textContent).catch(() => '获取失败');
    console.log('在线用户数:', onlineCount);

    // 检查用户列表
    const usersGrid = await page.$eval('#usersGrid', el => el.innerHTML).catch(() => '');
    if (usersGrid.includes('user-card')) {
        console.log('✓ 用户卡片正常显示');
    } else if (usersGrid.includes('请先登录')) {
        console.log('✗ 未登录状态');
    } else if (usersGrid.includes('登录已过期')) {
        console.log('✗ Token已过期');
    } else if (usersGrid.includes('暂无在线用户')) {
        console.log('✓ 页面正常，但暂无在线用户');
    } else {
        console.log('页面内容:', usersGrid.substring(0, 200));
    }

    // 检查创建群聊按钮
    const createGroupBtn = await page.$('.btn-group-create');
    console.log('创建群聊按钮:', createGroupBtn ? '✓ 存在' : '✗ 不存在');

    // 检查我的聊天链接
    const chatLink = await page.$('a[href="chat.html"]');
    console.log('我的聊天入口:', chatLink ? '✓ 存在' : '✗ 不存在');

    // 截图保存
    await page.screenshot({ path: '/tmp/plaza-test.png', fullPage: true });
    console.log('截图保存到: /tmp/plaza-test.png');

    console.log('\n=== 3. 测试创建群聊功能 ===');
    // 点击创建群聊按钮
    await page.click('.btn-group-create');
    await new Promise(r => setTimeout(r, 1000));

    // 检查模态框
    const modal = await page.$('#createGroupModal.show');
    console.log('创建群聊弹窗:', modal ? '✓ 正常弹出' : '✗ 未弹出');

    if (modal) {
        await page.screenshot({ path: '/tmp/create-group-modal.png' });
        console.log('弹窗截图: /tmp/create-group-modal.png');

        // 关闭弹窗
        await page.click('.close-modal');
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n=== 4. 测试聊天页面 ===');
    await page.goto('http://localhost:3000/src/pages/chat.html');
    await new Promise(r => setTimeout(r, 3000));

    // 截图
    await page.screenshot({ path: '/tmp/chat-test.png', fullPage: true });
    console.log('聊天页面截图: /tmp/chat-test.png');

    // 检查页面元素
    const chatTitle = await page.$eval('h1', el => el.textContent).catch(() => '未找到');
    console.log('页面标题:', chatTitle);

    console.log('\n=== 测试完成 ===');
    console.log('请查看截图确认页面显示效果');

    // 保持浏览器打开5秒让用户查看
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();
}

testPlaza().catch(console.error);
