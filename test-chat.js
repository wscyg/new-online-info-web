const puppeteer = require('puppeteer');

async function testChat() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    console.log('=== 1. 登录 ===');
    await page.goto('http://localhost:3000/src/pages/login.html');
    await page.waitForSelector('#username');
    await page.type('#username', 'cygws123');
    await page.type('#password', '123.00.aa');
    await page.click('#submitBtn');
    await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('登录成功');

    console.log('\n=== 2. 测试聊天页面 ===');
    await page.goto('http://localhost:3000/src/pages/chat.html');
    await new Promise(r => setTimeout(r, 3000));

    // 检查日期是否正常显示（不是 Invalid Date）
    const pageContent = await page.content();
    if (pageContent.includes('Invalid Date')) {
        console.log('✗ 还存在 Invalid Date 问题');
    } else {
        console.log('✓ 日期显示正常');
    }

    // 截图
    await page.screenshot({ path: '/tmp/chat-fixed.png', fullPage: true });
    console.log('截图: /tmp/chat-fixed.png');

    console.log('\n=== 3. 测试点击群聊 ===');
    // 点击一个群聊
    const groupItem = await page.$('.conversation-item');
    if (groupItem) {
        await groupItem.click();
        await new Promise(r => setTimeout(r, 2000));

        // 截图聊天界面
        await page.screenshot({ path: '/tmp/chat-messages.png', fullPage: true });
        console.log('群聊消息截图: /tmp/chat-messages.png');

        // 检查消息区域
        const messagesVisible = await page.$('#messagesArea[style*="block"]');
        console.log('消息区域:', messagesVisible ? '✓ 正常显示' : '✗ 未显示');
    }

    console.log('\n=== 4. 测试发送消息 ===');
    const inputArea = await page.$('#inputArea[style*="flex"]');
    if (inputArea) {
        await page.type('#messageInput', '测试消息 - 来自自动化测试');
        await page.click('#sendBtn');
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: '/tmp/chat-sent.png', fullPage: true });
        console.log('发送消息后截图: /tmp/chat-sent.png');
    }

    console.log('\n=== 5. 测试在线广场的聊天按钮 ===');
    await page.goto('http://localhost:3000/src/pages/online-plaza.html');
    await new Promise(r => setTimeout(r, 3000));

    // 检查聊天按钮
    const chatBtn = await page.$('.btn-chat');
    console.log('聊天按钮:', chatBtn ? '✓ 存在' : '✗ 不存在');

    // 截图
    await page.screenshot({ path: '/tmp/plaza-final.png', fullPage: true });
    console.log('广场最终截图: /tmp/plaza-final.png');

    console.log('\n=== 测试完成 ===');
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
}

testChat().catch(console.error);
