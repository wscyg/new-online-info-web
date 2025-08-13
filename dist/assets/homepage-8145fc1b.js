import"./api-28a76582.js";class s{constructor(){console.log("HomePage constructor called"),this.init()}async init(){console.log("HomePage init called"),this.checkAuthStatus(),this.setupEventListeners(),this.initializeAnimations()}checkAuthStatus(){console.log("=== 首页登录状态检查 ==="),console.log("当前页面URL:",window.location.href),console.log("当前端口:",window.location.port);const e=localStorage.getItem("token"),t=localStorage.getItem("user");console.log("Token:",e?`存在 (长度: ${e.length})`:"不存在"),console.log("User:",t?`存在 (长度: ${t.length})`:"不存在"),console.log("=== localStorage所有项目 ===");for(let r=0;r<localStorage.length;r++){const a=localStorage.key(r),n=localStorage.getItem(a);console.log(`${a}:`,n?`${n.substring(0,50)}...`:"null")}const i=document.getElementById("authContainer"),o=document.getElementById("userProfile");if(e&&t)try{const r=JSON.parse(t);this.showUserProfile(r),i&&(i.style.display="none"),o&&(o.style.display="block")}catch(r){console.error("Error parsing user data:",r),this.showAuthButtons()}else this.showAuthButtons()}showUserProfile(e){const t=document.getElementById("userName"),i=document.getElementById("userPoints");t&&(t.textContent=e.username||e.nickname||"用户"),i&&(i.textContent=e.points||"0"),this.setUserAvatar(e.avatar),this.setUserAvatarSmall(e.avatar),this.loadOrderBadge()}showAuthButtons(){const e=document.getElementById("authContainer"),t=document.getElementById("userProfile");e&&(e.style.display="block"),t&&(t.style.display="none")}setUserAvatar(e="default"){const t=document.getElementById("userAvatar"),i={default:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%234a9eff'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/></svg>",tech:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23ff6b6b'/><rect x='15' y='12' width='10' height='8' fill='white' rx='2'/><rect x='12' y='22' width='16' height='10' fill='white' rx='3'/><circle cx='16' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='20' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='24' cy='26' r='1.5' fill='%23ff6b6b'/></svg>",ai:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%2310b981'/><circle cx='20' cy='20' r='12' fill='none' stroke='white' stroke-width='2'/><circle cx='20' cy='20' r='6' fill='white'/><circle cx='20' cy='20' r='2' fill='%2310b981'/><path d='M20 8 L22 14 L20 20 L18 14 Z' fill='white'/><path d='M32 20 L26 22 L20 20 L26 18 Z' fill='white'/><path d='M20 32 L18 26 L20 20 L22 26 Z' fill='white'/><path d='M8 20 L14 18 L20 20 L14 22 Z' fill='white'/></svg>",robot:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23f59e0b'/><rect x='12' y='14' width='16' height='12' fill='white' rx='2'/><circle cx='16' cy='18' r='2' fill='%23f59e0b'/><circle cx='24' cy='18' r='2' fill='%23f59e0b'/><rect x='18' y='22' width='4' height='2' fill='%23f59e0b' rx='1'/><circle cx='20' cy='10' r='2' fill='white'/></svg>",student:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%237c3aed'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='15' y='8' width='10' height='4' fill='%237c3aed' rx='2'/><rect x='18' y='6' width='4' height='2' fill='white' rx='1'/></svg>",expert:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23dc2626'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='14' y='10' width='12' height='6' fill='%23dc2626' rx='3'/><circle cx='17' cy='13' r='1' fill='white'/><circle cx='20' cy='13' r='1' fill='white'/><circle cx='23' cy='13' r='1' fill='white'/></svg>"};t&&(t.src=i[e]||i.default)}setUserAvatarSmall(e="default"){const t=document.getElementById("userAvatarSmall"),i={default:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%234a9eff'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/></svg>",tech:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23ff6b6b'/><rect x='15' y='12' width='10' height='8' fill='white' rx='2'/><rect x='12' y='22' width='16' height='10' fill='white' rx='3'/><circle cx='16' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='20' cy='26' r='1.5' fill='%23ff6b6b'/><circle cx='24' cy='26' r='1.5' fill='%23ff6b6b'/></svg>",ai:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%2310b981'/><circle cx='20' cy='20' r='12' fill='none' stroke='white' stroke-width='2'/><circle cx='20' cy='20' r='6' fill='white'/><circle cx='20' cy='20' r='2' fill='%2310b981'/><path d='M20 8 L22 14 L20 20 L18 14 Z' fill='white'/><path d='M32 20 L26 22 L20 20 L26 18 Z' fill='white'/><path d='M20 32 L18 26 L20 20 L22 26 Z' fill='white'/><path d='M8 20 L14 18 L20 20 L14 22 Z' fill='white'/></svg>",robot:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23f59e0b'/><rect x='12' y='14' width='16' height='12' fill='white' rx='2'/><circle cx='16' cy='18' r='2' fill='%23f59e0b'/><circle cx='24' cy='18' r='2' fill='%23f59e0b'/><rect x='18' y='22' width='4' height='2' fill='%23f59e0b' rx='1'/><circle cx='20' cy='10' r='2' fill='white'/></svg>",student:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%237c3aed'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='15' y='8' width='10' height='4' fill='%237c3aed' rx='2'/><rect x='18' y='6' width='4' height='2' fill='white' rx='1'/></svg>",expert:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='%23dc2626'/><circle cx='20' cy='16' r='6' fill='white'/><path d='M8 32c0-6.6 5.4-12 12-12s12 5.4 12 12' fill='white'/><rect x='14' y='10' width='12' height='6' fill='%23dc2626' rx='3'/><circle cx='17' cy='13' r='1' fill='white'/><circle cx='20' cy='13' r='1' fill='white'/><circle cx='23' cy='13' r='1' fill='white'/></svg>"};t&&(t.src=i[e]||i.default)}async loadOrderBadge(){try{const e=localStorage.getItem("token");if(!e)return;const t=await fetch("http://42.194.245.66/api/orders/count",{headers:{Authorization:`Bearer ${e}`}});let i=0;if(t.ok){const r=await t.json();r.code===200&&r.data&&(i=r.data.pending||0)}else console.log("订单API不可用，跳过徽章显示");const o=document.getElementById("orderBadge");o&&i>0?(o.textContent=i,o.style.display="flex"):o&&(o.style.display="none")}catch(e){console.error("Failed to load order badge:",e);const t=document.getElementById("orderBadge");t&&(t.style.display="none")}}setupEventListeners(){window.toggleUserMenu=()=>{const e=document.getElementById("userMenu");e&&(e.style.display=e.style.display==="block"?"none":"block")},window.showAvatarSelector=()=>{const e=document.getElementById("avatarSelector");e&&(e.style.display="block")},window.hideAvatarSelector=()=>{const e=document.getElementById("avatarSelector");e&&(e.style.display="none")},window.selectAvatar=e=>{this.setUserAvatar(e),this.setUserAvatarSmall(e);const t=JSON.parse(localStorage.getItem("user")||"{}");t.avatar=e,localStorage.setItem("user",JSON.stringify(t)),this.hideAvatarSelector()},window.logout=()=>{var e;localStorage.removeItem("token"),localStorage.removeItem("user"),this.checkAuthStatus(),(e=window.notification)==null||e.success("已退出登录"),setTimeout(()=>{window.location.reload()},1e3)},document.addEventListener("click",e=>{const t=document.getElementById("userProfile"),i=document.getElementById("userMenu");t&&i&&!t.contains(e.target)&&(i.style.display="none")}),window.addEventListener("storage",e=>{(e.key==="token"||e.key==="user")&&this.checkAuthStatus()})}initializeAnimations(){let e=window.scrollY;window.addEventListener("scroll",()=>{const t=document.getElementById("navbar"),i=window.scrollY;t&&(i>100?t.classList.add("scrolled"):t.classList.remove("scrolled"),i>e&&i>200?t.style.transform="translateY(-100%)":t.style.transform="translateY(0)"),e=i}),this.createFloatingStars(),this.createFlowLines()}createFloatingStars(){const e=document.getElementById("stars");if(e)for(let t=0;t<50;t++){const i=document.createElement("div");i.className="star",i.style.cssText=`
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 255, 255, ${Math.random()*.8+.2});
                border-radius: 50%;
                left: ${Math.random()*100}%;
                top: ${Math.random()*100}%;
                animation: twinkle ${Math.random()*3+2}s infinite;
            `,e.appendChild(i)}}createFlowLines(){const e=document.getElementById("flowLines");if(e)for(let t=0;t<5;t++){const i=document.createElement("div");i.className="flow-line",i.style.cssText=`
                position: absolute;
                width: 1px;
                height: 100px;
                background: linear-gradient(to bottom, transparent, rgba(74, 158, 255, 0.6), transparent);
                left: ${Math.random()*100}%;
                top: -100px;
                animation: flowDown ${Math.random()*3+4}s infinite linear;
                animation-delay: ${Math.random()*2}s;
            `,e.appendChild(i)}}}const c=document.createElement("style");c.textContent=`
    @keyframes twinkle {
        0%, 100% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.5); }
    }
    
    @keyframes flowDown {
        0% { transform: translateY(-100px) scaleY(0); opacity: 0; }
        10% { transform: translateY(-50px) scaleY(1); opacity: 1; }
        90% { transform: translateY(calc(100vh + 50px)) scaleY(1); opacity: 1; }
        100% { transform: translateY(calc(100vh + 100px)) scaleY(0); opacity: 0; }
    }
    
    .navbar {
        transition: transform 0.3s ease, background-color 0.3s ease;
    }
    
    .navbar.scrolled {
        background-color: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(20px);
    }
    
    .user-menu {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background: rgba(17, 24, 39, 0.98);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        min-width: 280px;
        max-width: 320px;
        padding: 0;
        z-index: 1000;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: menuSlideDown 0.2s ease-out;
        margin-top: 8px;
    }
    
    @keyframes menuSlideDown {
        from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .user-info-card {
        padding: 20px 16px;
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        border-radius: 16px 16px 0 0;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
    }
    
    .user-info-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        border-radius: 16px 16px 0 0;
        pointer-events: none;
    }
    
    .user-avatar-small {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(74, 158, 255, 0.3);
        flex-shrink: 0;
        position: relative;
        z-index: 1;
    }
    
    .user-avatar-small img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .user-details {
        flex: 1;
        position: relative;
        z-index: 1;
    }
    
    .user-name {
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 4px;
        line-height: 1.2;
    }
    
    .user-level {
        color: #a5b4fc;
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        background: rgba(74, 158, 255, 0.2);
        border-radius: 12px;
        display: inline-block;
    }
    
    .user-points {
        text-align: center;
        position: relative;
        z-index: 1;
    }
    
    .points-count {
        display: block;
        color: #fbbf24;
        font-weight: 700;
        font-size: 18px;
        line-height: 1;
    }
    
    .points-label {
        color: #9ca3af;
        font-size: 11px;
        margin-top: 2px;
        display: block;
    }
    
    .menu-section {
        padding: 8px 0;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #d1d5db;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        cursor: pointer;
        position: relative;
        gap: 12px;
    }
    
    .menu-item:hover {
        background: rgba(74, 158, 255, 0.08);
        color: #ffffff;
        padding-left: 24px;
    }
    
    .menu-item.logout-item {
        color: #f87171;
    }
    
    .menu-item.logout-item:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #fca5a5;
    }
    
    .menu-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
        flex-shrink: 0;
    }
    
    .menu-badge {
        background: #ef4444;
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: auto;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .menu-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 0 16px;
    }
    
    .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: border-color 0.3s;
    }
    
    .user-avatar:hover {
        border-color: rgba(74, 158, 255, 0.6);
    }
    
    .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .user-profile {
        position: relative;
    }
    
    .avatar-selector-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .avatar-selector-content {
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
    }
    
    .avatar-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }
    
    .avatar-selector-header h3 {
        color: #ffffff;
        margin: 0;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .avatar-options {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }
    
    .avatar-option {
        width: 60px;
        height: 60px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        transition: border-color 0.3s;
        margin: 0 auto;
    }
    
    .avatar-option:hover {
        border-color: rgba(74, 158, 255, 0.6);
    }
    
    .avatar-option img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;document.head.appendChild(c);document.addEventListener("DOMContentLoaded",()=>{console.log("HomePage initializing...");try{new s,console.log("HomePage initialized successfully")}catch(l){console.error("Error initializing HomePage:",l)}});
