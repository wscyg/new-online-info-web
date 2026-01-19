const puppeteer = require('puppeteer');

const TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOjcsImVtYWlsIjoiOTY0NDg3OTg0QHFxLmNvbSIsInVzZXJuYW1lIjoiY3lnd3MxMjMiLCJzdGF0dXMiOiJhY3RpdmUiLCJzdWIiOiJjeWd3czEyMyIsImlhdCI6MTc2NjM4ODM1NiwiZXhwIjoxNzY2NDc0NzU2fQ.IPFHLYmB2BT9JopWWcRcTmjoyUZKdo0UWaw6_KSERWhRHISVoQeMSp9_hK2ridFIQcFecXca6MU6Fsqnn51now";
const USER = '{"id":7,"username":"cygws123","email":"964487984@qq.com","nickname":"cygws123","status":"active"}';

const pages = [
    { name: '课程列表', url: 'http://localhost:3000/src/pages/courses.html' },
    { name: '社区', url: 'http://localhost:3000/src/pages/community.html' },
    { name: '仪表盘', url: 'http://localhost:3000/src/pages/dashboard.html' },
    { name: '个人资料', url: 'http://localhost:3000/src/pages/profile.html' },
    { name: '签到', url: 'http://localhost:3000/src/pages/checkin.html' },
    { name: '成就', url: 'http://localhost:3000/src/pages/achievements.html' },
    { name: '积分商城', url: 'http://localhost:3000/src/pages/points-shop.html' },
    { name: 'PK竞技场', url: 'http://localhost:3000/src/pages/pk-arena.html' }
];

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-web-security', '--no-sandbox']
    });
    const page = await browser.newPage();

    await page.evaluateOnNewDocument((token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', user);
    }, TOKEN, USER);

    let passed = 0;
    let failed = 0;

    for (const p of pages) {
        try {
            const response = await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 4000));

            const pageInfo = await page.evaluate(() => {
                return {
                    textLength: document.body.innerText.length,
                    url: window.location.href
                };
            });

            const status = response.status();
            const isRedirectedToLogin = pageInfo.url.includes('login');
            const isOk = status === 200 && pageInfo.textLength > 200 && !isRedirectedToLogin;

            if (isOk) {
                console.log('✅ ' + p.name + ' (' + pageInfo.textLength + '字)');
                passed++;
            } else {
                console.log('⚠️ ' + p.name + ' - 字数:' + pageInfo.textLength + (isRedirectedToLogin ? ' [登录]' : ''));
                failed++;
            }
        } catch (e) {
            console.log('❌ ' + p.name + ' - ' + e.message.slice(0, 50));
            failed++;
        }
    }

    await browser.close();
    console.log('\n=== 结果: ' + passed + '/' + pages.length + ' 通过 ===');
})();
