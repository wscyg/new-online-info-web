import"./modulepreload-polyfill-3cfb730f.js";/* empty css              */const B=new URLSearchParams(window.location.search);let u=B.get("courseId")||"1";const b=B.get("chapterId");let l=null,c=[],a=0,g={},x=!1,d=0;const r={courseTitle:document.getElementById("courseTitle"),courseProgressBar:document.getElementById("courseProgressBar"),courseProgressText:document.getElementById("courseProgressText"),chaptersList:document.getElementById("chaptersList"),chapterHeading:document.getElementById("chapterHeading"),readingTime:document.getElementById("readingTime"),viewCount:document.getElementById("viewCount"),htmlContent:document.getElementById("htmlContent"),contentBody:document.getElementById("contentBody"),contentFrame:document.getElementById("contentFrame"),prevChapterBtn:document.getElementById("prevChapterBtn"),nextChapterBtn:document.getElementById("nextChapterBtn"),completeBtn:document.getElementById("completeBtn"),noteTextarea:document.getElementById("noteTextarea"),saveNoteBtn:document.getElementById("saveNoteBtn"),fullscreenBtn:document.getElementById("fullscreenBtn"),fontSizeBtn:document.getElementById("fontSizeBtn"),themeBtn:document.getElementById("themeBtn"),studyContainer:document.getElementById("studyContainer")};async function F(){initTheme();try{if(!localStorage.getItem("token")){window.notification.warning("请先登录"),setTimeout(()=>{window.location.href="/src/pages/login.html?returnUrl="+encodeURIComponent(window.location.href)},1500);return}if(await L(),b){const t=c.findIndex(n=>n.id===parseInt(b));t!==-1&&(a=t)}await h(c[a]),N()}catch(e){console.error("初始化失败:",e),T("加载失败",e.message)}}async function L(){try{console.log("=== 开始加载真实数据 ===");const e=localStorage.getItem("token");console.log("Token存在:",!!e),console.log("课程ID:",u),console.log("章节ID:",b),u||(u="1"),console.log("正在获取课程信息...");const t=await fetch(`http://42.194.245.66:8070/api/courses/${u}`,{headers:{Authorization:e?`Bearer ${e}`:""}});if(!t.ok)throw new Error("无法获取课程信息");const n=await t.json();if(n.code===200&&n.data)l=n.data,console.log("课程信息加载成功:",l.title);else throw new Error(n.message||"课程信息加载失败");const o=await fetch(`http://42.194.245.66:8070/api/content/courses/${u}/chapters`,{headers:{Authorization:e?`Bearer ${e}`:""}});if(!o.ok)throw new Error("无法获取章节信息");const i=await o.json();if(i.code===200&&i.data)c=i.data.map(s=>({id:s.id,chapterNumber:s.chapterNumber,title:s.title,description:s.description,durationMinutes:s.durationMinutes||0,isFree:s.isFree})),console.log("章节信息加载成功:",c.length,"个章节");else throw new Error(i.message||"章节信息加载失败");document.title=`${l.title} - 学习中心`,z(),v()}catch(e){console.error("数据加载失败:",e),await I()}}function z(){const e=document.querySelector(".course-title");e&&(e.textContent=l.title)}async function I(){l={id:parseInt(u)||1,title:"Transformer架构深度解析",description:"从零开始理解改变AI世界的Transformer"},c=[{id:100,chapterNumber:"1",title:"第1章：为什么需要Transformer？",durationMinutes:45,isFree:!0},{id:101,chapterNumber:"2",title:"第2章：注意力机制的数学原理",durationMinutes:60,isFree:!1},{id:102,chapterNumber:"3",title:"第3章：多头注意力的设计智慧",durationMinutes:55,isFree:!1},{id:103,chapterNumber:"4",title:"第4章：位置编码的巧妙设计",durationMinutes:50,isFree:!1},{id:104,chapterNumber:"5",title:"第5章：编码器与解码器架构",durationMinutes:70,isFree:!1}],g={100:{status:"completed",progress:100},101:{status:"in_progress",progress:30},102:{status:"not_started",progress:0},103:{status:"not_started",progress:0},104:{status:"not_started",progress:0}},r.courseTitle.textContent=l.title,v(),C()}function v(){r.chaptersList.innerHTML=c.map((e,t)=>{const n=g[e.id],o=(n==null?void 0:n.status)==="completed",i=(n==null?void 0:n.status)==="in_progress",s=!e.isFree&&!o&&!i;let m="",p="";return o?(m="✓",p="completed"):i?(m="•",p="in-progress"):s&&(m="🔒",p="locked"),`
                    <li class="chapter-item">
                        <div class="chapter-link ${t===a?"active":""}" 
                             data-index="${t}" data-id="${e.id}">
                            <span class="chapter-status ${p}">${m}</span>
                            <div class="chapter-info">
                                <div class="chapter-number">第${e.chapterNumber}章</div>
                                <div class="chapter-title">${e.title}</div>
                                <div class="chapter-duration">
                                    <i class="fas fa-clock"></i>
                                    ${e.durationMinutes}分钟
                                </div>
                            </div>
                        </div>
                    </li>
                `}).join(""),document.querySelectorAll(".chapter-link").forEach(e=>{e.addEventListener("click",async t=>{const n=parseInt(t.currentTarget.dataset.index);n!==a&&(a=n,await h(c[n]),y())})})}async function h(e){if(e)try{r.chapterHeading.textContent=e.title,r.readingTime.textContent=`${e.durationMinutes}分钟`,r.viewCount.textContent="2,456次学习";const t=await M(e.id),n=r.contentFrame,o=n.contentDocument||n.contentWindow.document;try{n.src="about:blank",setTimeout(()=>{const i=n.contentDocument||n.contentWindow.document;i.open(),i.write(t),i.close()},100)}catch{o.open(),o.write(t),o.close()}n.onload=function(){try{const i=o.body,s=o.documentElement,m=Math.max(i.scrollHeight,i.offsetHeight,s.clientHeight,s.scrollHeight,s.offsetHeight);n.style.height=m+"px"}catch{n.style.height="800px"}},r.contentBody.scrollTop=0,D(),E(e)}catch(t){console.error("加载章节内容失败:",t),T("加载失败",t.message)}}async function M(e){try{const t=localStorage.getItem("token"),o=await(await fetch(`http://42.194.245.66:8070/api/content/chapters/${e}`,{headers:{Authorization:t?`Bearer ${t}`:""}})).json();if(console.log("API响应数据:",o),o.code===200&&o.data){const{chapter:i,content:s}=o.data;return s&&s.contentHtml?(console.log("找到HTML内容，直接返回"),s.contentHtml):i.content&&i.contentType==="html"?(console.log("从章节对象中找到HTML内容"),i.content):(console.log("未找到HTML内容，生成默认页面"),$(i))}else return o.code===403?H(e,o.message):o.code===401?S(e):(console.warn("无法获取章节内容:",o.message),w(e))}catch(t){return console.error("获取章节内容失败:",t),w(e)}}function $(e){return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${e.title}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #e0e6ff;
            background: #0a0e27;
            margin: 0;
            padding: 2rem;
        }
        h1 {
            color: #4a9eff;
            border-bottom: 2px solid #4a9eff;
            padding-bottom: 1rem;
        }
        h2 {
            color: #64b5f6;
            margin-top: 2rem;
        }
        p {
            margin-bottom: 1.2rem;
        }
        .chapter-meta {
            background: rgba(74, 158, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .coming-soon {
            text-align: center;
            padding: 3rem;
            color: #8892b0;
            font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <h1>${e.title}</h1>
    <div class="chapter-meta">
        <p><strong>章节描述：</strong>${e.description||"暂无描述"}</p>
        ${e.durationMinutes?`<p><strong>预计学习时长：</strong>${e.durationMinutes} 分钟</p>`:""}
        <p><strong>章节编号：</strong>第 ${e.chapterNumber} 章</p>
    </div>
    
    ${e.content?`<div class="chapter-content">${e.content}</div>`:'<div class="coming-soon"><h2>📚 内容制作中</h2><p>该章节的详细内容正在制作中，敬请期待！</p></div>'}
</body>
</html>`}function H(e,t){return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>需要购买课程</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #e0e6ff;
            background: #0a0e27;
            margin: 0;
            padding: 2rem;
            text-align: center;
        }
        .permission-denied {
            padding: 3rem;
            max-width: 500px;
            margin: 0 auto;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 2rem;
        }
        h1 {
            color: #ff9800;
            margin-bottom: 1rem;
        }
        p {
            margin-bottom: 2rem;
            color: #8892b0;
            font-size: 1.1rem;
        }
        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            border: none;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #4a9eff;
            color: white;
        }
        .btn-primary:hover {
            background: #3b82f6;
        }
        .btn-secondary {
            background: transparent;
            color: #4a9eff;
            border: 1px solid #4a9eff;
        }
        .btn-secondary:hover {
            background: rgba(74, 158, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="permission-denied">
        <div class="icon">🔒</div>
        <h1>需要购买课程</h1>
        <p>${t||"该章节需要购买课程后才能观看"}</p>
        <div class="action-buttons">
            <button class="btn btn-primary" onclick="window.parent.location.href='/src/pages/course-detail.html?id=${l?l.id:1}'">
                购买课程
            </button>
            <button class="btn btn-secondary" onclick="window.parent.location.href='/src/pages/courses.html'">
                浏览其他课程
            </button>
        </div>
    </div>
</body>
</html>`}function S(e){return`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>请先登录</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #e0e6ff;
            background: #0a0e27;
            margin: 0;
            padding: 2rem;
            text-align: center;
        }
        .login-required {
            padding: 3rem;
            max-width: 500px;
            margin: 0 auto;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 2rem;
        }
        h1 {
            color: #4a9eff;
            margin-bottom: 1rem;
        }
        p {
            margin-bottom: 2rem;
            color: #8892b0;
            font-size: 1.1rem;
        }
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
            border: none;
            font-size: 14px;
            background: #4a9eff;
            color: white;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #3b82f6;
        }
    </style>
</head>
<body>
    <div class="login-required">
        <div class="icon">👤</div>
        <h1>请先登录</h1>
        <p>需要登录后才能观看课程内容</p>
        <button class="btn" onclick="window.parent.location.href='/src/pages/login.html?returnUrl=' + encodeURIComponent(window.parent.location.href)">
            立即登录
        </button>
    </div>
</body>
</html>`}function w(e){return e===100?`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>第 1 章：为什么需要 Transformer？</title>
    <style>
        :root{
            --clr-primary:#4f46e5;
            --clr-primary-light:#8b5cf6;
            --clr-secondary:#06b6d4;
            --clr-danger:#ef4444;
            --clr-warning:#f59e0b;
            --clr-success:#22c55e;
            --clr-bg:#0f172a;
            --clr-surface:#1e293b;
            --clr-card:rgba(255,255,255,.08);
            --clr-border:rgba(255,255,255,.12);
            --txt-main:#e2e8f0;
            --txt-muted:#cbd5e1;
            --radius-xl:24px;
            --radius-lg:20px;
            --radius-md:16px;
            --shadow-md:0 8px 25px rgba(0,0,0,.25);
            --dur-rotate:20s;
        }
        *,::before,::after{box-sizing:border-box;margin:0;padding:0;}
        body{
            font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
            background:var(--clr-bg);
            color:var(--txt-main);
            line-height:1.7;
            -webkit-font-smoothing:antialiased;
            word-break:break-word;
        }
        img{max-width:100%;display:block}
        a{color:inherit;text-decoration:none}
        h1,h2,h3,h4,h5{line-height:1.3;font-weight:700}
        h1{font-size:clamp(1.8rem,4vw,2.8rem)}
        h2{font-size:clamp(1.4rem,3vw,1.8rem)}
        h3{font-size:clamp(1.25rem,2.5vw,1.6rem)}
        p{margin:.8rem 0}
        .container{max-width:960px;margin-inline:auto;padding-inline:1rem}
        .section{border-radius:var(--radius-xl);padding:3rem;margin-bottom:3rem;position:relative;border:2px solid var(--clr-border);overflow:hidden}
        .section--grad-primary{background:linear-gradient(135deg,rgba(79,70,229,.15),rgba(139,92,246,.1))}
        .section--grad-danger{background:linear-gradient(135deg,rgba(239,68,68,.15),rgba(220,38,38,.1))}
        .section--grad-info{background:linear-gradient(135deg,rgba(6,182,212,.15),rgba(14,165,233,.1))}
        .section--grad-success{background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(16,185,129,.1))}
        .section--grad-purple{background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(124,58,237,.1))}
        .card{background:var(--clr-card);padding:2.5rem;border-radius:var(--radius-lg);border:1px solid var(--clr-border)}
        .badge{display:inline-flex;gap:.5rem;align-items:center;font-weight:700;padding:.8rem 1.5rem;border-radius:25px;font-size:.9rem}
        .badge--primary{background:rgba(79,70,229,.2);color:var(--clr-primary)}
        .badge--time{background:rgba(34,197,94,.2);color:var(--clr-success)}
        .badge--story{background:rgba(251,191,36,.2);color:var(--clr-warning)}
        .icon-big{font-size:6rem;opacity:.08;position:absolute}
        .grid-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
        @keyframes rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes matrix{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.1)}}
        @keyframes bounce{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-20px)}60%{transform:translateY(-10px)}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important}}
        @media(max-width:480px){.container{padding-inline:.5rem}.section{padding:2rem;margin-bottom:2rem}}
    </style>
</head>
<body>
<header class="container section section--grad-primary">
    <div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(79,70,229,.1) 0%,transparent 70%);animation:rotate var(--dur-rotate) linear infinite"></div>
    <div class="icon-big" style="top:-30px;right:-30px;transform:rotate(15deg)">🤖</div>
    <div style="position:relative;z-index:1;text-align:center">
        <h1 style="background:linear-gradient(45deg,var(--clr-primary),var(--clr-primary-light),var(--clr-secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1.5rem">
            第 1 章：为什么需要 Transformer？
        </h1>
        <p style="color:var(--txt-muted);font-size:1.1rem;margin-bottom:2rem">
            一个 AI 研究员的困惑之旅 —— 从挫折到突破
        </p>
        <div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap">
            <span class="badge badge--primary">🎯 <span>问题导向</span></span>
            <span class="badge badge--time">⏱️ <span>30 分钟</span></span>
            <span class="badge badge--story">📖 <span>故事化学习</span></span>
        </div>
    </div>
</header>

<main class="container">
    <section class="section" style="background:linear-gradient(135deg,rgba(15,23,42,.9),rgba(30,41,59,.8))">
        <div style="position:absolute;inset:0;opacity:.05;background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,0,.03) 2px,rgba(0,255,0,.03) 4px);animation:matrix 10s linear infinite"></div>
        <header style="text-align:center;margin-bottom:3rem;position:relative;z-index:1">
            <div class="badge badge--primary" style="padding:1.5rem 3rem;font-size:1.1rem">
                🎬 <span>2017 年春 · Google</span>
            </div>
        </header>
        <article style="position:relative;z-index:1">
            <p style="text-align:center;font-size:1.1rem;color:var(--txt-main);margin-bottom:2rem">
                "博士，我们的翻译模型又卡住了……"
            </p>
            <div class="grid-two" style="gap:2rem;align-items:center">
                <figure style="text-align:center">
                    <div style="width:80px;height:80px;margin-inline:auto 1rem;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:var(--shadow-md)">😤</div>
                    <figcaption style="font-size:.95rem;color:var(--txt-muted)">
                        <strong style="color:var(--clr-danger)">沮丧的研究生</strong><br>"为什么训练这么慢？"
                    </figcaption>
                </figure>
                <div style="font-size:2rem;color:var(--clr-primary)">💭</div>
                <figure style="text-align:center">
                    <div style="width:80px;height:80px;margin-inline:auto;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:var(--shadow-md)">🤔</div>
                    <figcaption style="font-size:.95rem;color:var(--txt-muted)">
                        <strong style="color:var(--clr-secondary)">深思的导师</strong><br>"让我看看问题在哪……"
                    </figcaption>
                </figure>
            </div>
            <div class="card" style="margin-top:3rem">
                <p style="text-align:center;font-size:1rem">
                    这是一个真实故事。在 Transformer 论文发表之前，全球 AI 研究者都在为同一件事头疼……
                </p>
            </div>
        </article>
    </section>

    <!-- 继续其他章节内容... -->
    
</main>
</body>
</html>`:`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>章节内容</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #e0e6ff;
            background: #0a0e27;
            margin: 0;
            padding: 2rem;
            text-align: center;
        }
        h1 {
            color: #4a9eff;
            margin-bottom: 2rem;
        }
        .coming-soon {
            padding: 3rem;
            color: #8892b0;
            font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <div class="coming-soon">
        <h1>📚 章节内容制作中</h1>
        <p>该章节的详细内容正在制作中，敬请期待！</p>
        <p>请稍后返回查看更新内容。</p>
    </div>
</body>
</html>`}function y(){document.querySelectorAll(".chapter-link").forEach((e,t)=>{t===a?e.classList.add("active"):e.classList.remove("active")})}function D(){r.prevChapterBtn.disabled=a===0,r.nextChapterBtn.disabled=a===c.length-1}function E(e){const t=g[e.id];(t==null?void 0:t.status)==="completed"?(r.completeBtn.classList.add("completed"),r.completeBtn.innerHTML='<i class="fas fa-check-circle"></i> 已完成'):(r.completeBtn.classList.remove("completed"),r.completeBtn.innerHTML='<i class="fas fa-check-circle"></i> 完成本章学习')}function C(){const e=Object.values(g).filter(o=>o.status==="completed").length,t=c.length,n=t>0?Math.round(e/t*100):0;r.courseProgressBar.style.width=`${n}%`,r.courseProgressText.textContent=`${n}%`,document.getElementById("completedChapters").textContent=`${e}/${t}`}function N(){r.prevChapterBtn.addEventListener("click",async()=>{a>0&&(a--,await h(c[a]),y())}),r.nextChapterBtn.addEventListener("click",async()=>{a<c.length-1&&(a++,await h(c[a]),y())}),r.completeBtn.addEventListener("click",async()=>{const t=c[a];t&&(g[t.id]={status:"completed",progress:100},C(),E(t),v(),window.notification.success("恭喜完成本章学习！"),a<c.length-1&&setTimeout(()=>{r.nextChapterBtn.click()},1500))}),r.fullscreenBtn.addEventListener("click",k),r.themeBtn.addEventListener("click",toggleTheme),document.addEventListener("keydown",t=>{t.key==="F11"?(t.preventDefault(),k()):t.key==="Escape"&&d===1&&(t.preventDefault(),d=0,document.body.classList.remove("browser-fullscreen"),r.fullscreenBtn.innerHTML='<i class="fas fa-expand"></i> 全屏',r.fullscreenBtn.classList.remove("active"))}),document.addEventListener("fullscreenchange",f),document.addEventListener("webkitfullscreenchange",f),document.addEventListener("mozfullscreenchange",f),document.addEventListener("MSFullscreenChange",f);let e=100;r.fontSizeBtn.addEventListener("click",()=>{e=e>=120?80:e+10;const t=r.contentFrame,n=t.contentDocument||t.contentWindow.document;n.body&&(n.body.style.zoom=`${e}%`,window.notification.info(`字体大小：${e}%`))}),r.saveNoteBtn.addEventListener("click",()=>{const t=r.noteTextarea.value.trim();if(!t){window.notification.warning("请输入笔记内容");return}const n=JSON.parse(localStorage.getItem("chapterNotes")||"{}");n[c[a].id]=t,localStorage.setItem("chapterNotes",JSON.stringify(n)),window.notification.success("笔记保存成功")})}function k(){switch(d=(d+1)%3,document.body.classList.remove("browser-fullscreen","system-fullscreen"),d){case 0:(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement)&&(document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen?document.webkitExitFullscreen():document.mozCancelFullScreen?document.mozCancelFullScreen():document.msExitFullscreen&&document.msExitFullscreen()),r.fullscreenBtn.innerHTML='<i class="fas fa-expand"></i> 全屏',r.fullscreenBtn.classList.remove("active");break;case 1:document.body.classList.add("browser-fullscreen"),r.fullscreenBtn.innerHTML='<i class="fas fa-expand"></i> 全屏',r.fullscreenBtn.classList.add("active");break;case 2:document.body.classList.remove("browser-fullscreen"),document.body.classList.add("system-fullscreen"),r.fullscreenBtn.innerHTML='<i class="fas fa-compress"></i> 退出',r.fullscreenBtn.classList.add("active");const e=document.documentElement;e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.mozRequestFullScreen?e.mozRequestFullScreen():e.msRequestFullscreen&&e.msRequestFullscreen();break}setTimeout(()=>{const e=r.contentFrame;if(e&&e.contentDocument&&e.contentDocument.body){const t=Math.max(e.contentDocument.body.scrollHeight,800);e.style.height=t+"px"}},300)}function f(){x=!!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement),!x&&d===2&&(d=0,document.body.classList.remove("browser-fullscreen","system-fullscreen"),r.fullscreenBtn.innerHTML='<i class="fas fa-expand"></i> 全屏',r.fullscreenBtn.classList.remove("active")),setTimeout(()=>{const e=r.contentFrame,t=e.contentDocument||e.contentWindow.document;if(t.body){const n=Math.max(t.body.scrollHeight,t.body.offsetHeight,t.documentElement.clientHeight,t.documentElement.scrollHeight,t.documentElement.offsetHeight);e.style.height=n+"px"}},100)}function T(e,t){const n=r.contentFrame,o=n.contentDocument||n.contentWindow.document;o.open(),o.write(`
                <div style="text-align:center;padding:60px 20px;font-family:sans-serif;">
                    <div style="font-size:4rem;color:#ef4444;margin-bottom:24px;">❌</div>
                    <div style="color:#333;font-size:1.2rem;margin-bottom:16px;">${e}</div>
                    <div style="color:#666;margin-bottom:32px;">${t}</div>
                    <button onclick="location.reload()" style="padding:12px 24px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer;">
                        重新加载
                    </button>
                </div>
            `),o.close()}F();
