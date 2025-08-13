import"./modulepreload-polyfill-3cfb730f.js";/* empty css             *//* empty css              */import"./api-28a76582.js";class d{constructor(){this.currentUser=null,this.editMode=!1,this.originalData={},this.init()}async init(){initTheme(),await this.checkAuth(),this.setupEventListeners(),await this.loadUserProfile(),await this.loadOrders(),this.setupTabSwitching(),this.handleUrlParameters()}async checkAuth(){const e=localStorage.getItem("token"),t=localStorage.getItem("user");console.log("=== 个人中心登录状态检查 ==="),console.log("当前页面URL:",window.location.href),console.log("当前端口:",window.location.port),console.log("Token:",e?`存在 (长度: ${e.length})`:"不存在"),console.log("UserData:",t?`存在 (长度: ${t.length})`:"不存在"),console.log("=== localStorage所有项目 ===");for(let r=0;r<localStorage.length;r++){const o=localStorage.key(r),n=localStorage.getItem(o);console.log(`${o}:`,n?`${n.substring(0,50)}...`:"null")}if(!e||!t){console.log("登录信息缺失，跳转到登录页"),alert("检测到登录状态异常，请重新登录"),window.location.href="/src/pages/login.html";return}try{this.currentUser=JSON.parse(t),console.log("用户信息解析成功:",this.currentUser.username),this.showUserProfileNav()}catch(r){console.error("Error parsing user data:",r),alert("用户信息解析失败，请重新登录"),window.location.href="/src/pages/login.html"}}showUserProfileNav(){const e=document.getElementById("authContainer"),t=document.getElementById("userProfile");if(e&&(e.style.display="none"),t&&(t.style.display="block"),this.currentUser){const r=document.getElementById("userName"),o=document.getElementById("userPoints");r&&(r.textContent=this.currentUser.username||this.currentUser.nickname||"用户"),o&&(o.textContent=this.currentUser.points||"0"),this.setUserAvatar(this.currentUser.avatar)}}setUserAvatar(e){const t=document.querySelectorAll("#userAvatar, #userAvatarSmall"),r="/assets/avatar-default.svg";t.forEach(o=>{o&&(o.src=e||r,o.onerror=()=>{o.src=r})})}setupEventListeners(){window.toggleEditMode=()=>this.toggleEditMode(),window.savePersonalInfo=()=>this.savePersonalInfo(),window.cancelEdit=()=>this.cancelEdit(),window.toggleUserMenu=()=>this.toggleUserMenu(),window.handleLogout=()=>this.handleLogout(),document.querySelectorAll(".filter-btn").forEach(e=>{e.addEventListener("click",t=>{this.filterOrders(t.target.dataset.status),document.querySelectorAll(".filter-btn").forEach(r=>r.classList.remove("active")),t.target.classList.add("active")})})}setupTabSwitching(){document.querySelectorAll(".tab-btn").forEach(e=>{e.addEventListener("click",t=>{const r=t.currentTarget.dataset.tab;this.switchTab(r),document.querySelectorAll(".tab-btn").forEach(o=>o.classList.remove("active")),t.currentTarget.classList.add("active")})})}switchTab(e){document.querySelectorAll(".content-panel").forEach(o=>{o.classList.remove("active")});const t=this.getPanelId(e),r=document.getElementById(t);r&&r.classList.add("active")}getPanelId(e){return{overview:"overviewPanel","personal-info":"personalInfoPanel",orders:"ordersPanel",achievements:"achievementsPanel",certificates:"certificatesPanel",skills:"skillsPanel",settings:"settingsPanel"}[e]||"overviewPanel"}handleUrlParameters(){const t=new URLSearchParams(window.location.search).get("tab");t&&(this.switchTab(t),document.querySelectorAll(".tab-btn").forEach(r=>{r.classList.remove("active"),r.dataset.tab===t&&r.classList.add("active")}))}async loadUserProfile(){if(this.currentUser)try{const e={displayName:this.currentUser.nickname||this.currentUser.username,username:this.currentUser.username,email:this.currentUser.email,phone:this.currentUser.phone||"",city:this.currentUser.city||"",birthday:this.currentUser.birthday||"",bio:this.currentUser.bio||""};Object.keys(e).forEach(t=>{const r=document.getElementById(t);r&&(r.value=e[t])}),this.updateAccountStats(),this.updateProfileHeader()}catch(e){console.error("Error loading user profile:",e)}}updateAccountStats(){const e=document.getElementById("registrationDate"),t=document.getElementById("lastLoginDate"),r=document.getElementById("studyDays");if(e&&this.currentUser.createdAt&&(e.textContent=this.formatDate(this.currentUser.createdAt)),t&&(t.textContent="今天"),r){const o=new Date(this.currentUser.createdAt),i=Math.ceil((new Date-o)/(1e3*60*60*24));r.textContent=`${i} 天`}}updateProfileHeader(){const e=document.querySelector(".profile-name");e&&(e.textContent=this.currentUser.nickname||this.currentUser.username)}formatDate(e){return new Date(e).toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"})}toggleEditMode(){this.editMode=!this.editMode;const e=document.querySelectorAll("#personalInfoPanel input, #personalInfoPanel textarea"),t=document.getElementById("editToggleText"),r=document.getElementById("formActions");this.editMode?(this.originalData={},e.forEach(o=>{o.removeAttribute("readonly"),o.classList.add("editable"),this.originalData[o.id]=o.value}),t.textContent="取消",r.style.display="flex"):this.cancelEdit()}async savePersonalInfo(){try{const e={nickname:document.getElementById("displayName").value,email:document.getElementById("email").value,phone:document.getElementById("phone").value,city:document.getElementById("city").value,birthday:document.getElementById("birthday").value,bio:document.getElementById("bio").value},t={...this.currentUser,...e};localStorage.setItem("user",JSON.stringify(t)),this.currentUser=t,this.exitEditMode(),this.showMessage("个人信息已保存","success")}catch(e){console.error("Error saving profile:",e),this.showMessage("保存失败，请稍后重试","error")}}cancelEdit(){Object.keys(this.originalData).forEach(e=>{const t=document.getElementById(e);t&&(t.value=this.originalData[e])}),this.exitEditMode()}exitEditMode(){this.editMode=!1;const e=document.querySelectorAll("#personalInfoPanel input, #personalInfoPanel textarea"),t=document.getElementById("editToggleText"),r=document.getElementById("formActions");e.forEach(o=>{o.setAttribute("readonly",!0),o.classList.remove("editable")}),t.textContent="编辑",r.style.display="none"}async loadOrders(e="all"){const t=document.getElementById("ordersList");document.getElementById("noOrders");try{const r=[{id:"ORD001",courseTitle:"Transformer架构深度解析",amount:299,status:"paid",createdAt:"2025-01-10T10:00:00",paymentMethod:"支付宝"},{id:"ORD002",courseTitle:"深度学习实战项目",amount:399,status:"completed",createdAt:"2025-01-08T14:30:00",paymentMethod:"微信支付"}];this.renderOrders(r)}catch(r){console.error("Error loading orders:",r),t.innerHTML='<div class="error-state">加载订单失败，请刷新重试</div>'}}renderOrders(e){const t=document.getElementById("ordersList"),r=document.getElementById("noOrders");if(e.length===0){t.style.display="none",r.style.display="block";return}t.style.display="block",r.style.display="none";const o=e.map(n=>`
            <div class="order-item">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-id">#${n.id}</span>
                        <span class="order-date">${this.formatDate(n.createdAt)}</span>
                    </div>
                    <div class="order-status ${n.status}">
                        ${this.getStatusText(n.status)}
                    </div>
                </div>
                <div class="order-content">
                    <div class="course-info">
                        <h4 class="course-title">${n.courseTitle}</h4>
                        <p class="payment-method">支付方式：${n.paymentMethod}</p>
                    </div>
                    <div class="order-amount">
                        <span class="amount">￥${n.amount.toFixed(2)}</span>
                    </div>
                </div>
                <div class="order-actions">
                    ${this.getOrderActions(n)}
                </div>
            </div>
        `).join("");t.innerHTML=o}getStatusText(e){return{pending:"待支付",paid:"已支付",completed:"已完成",refunded:"已退款",cancelled:"已取消"}[e]||e}getOrderActions(e){switch(e.status){case"pending":return`
                    <button class="btn-action primary" onclick="payOrder('${e.id}')">立即支付</button>
                    <button class="btn-action secondary" onclick="cancelOrder('${e.id}')">取消订单</button>
                `;case"paid":case"completed":return`
                    <button class="btn-action secondary" onclick="viewCourse('${e.id}')">查看课程</button>
                    <button class="btn-action secondary" onclick="requestRefund('${e.id}')">申请退款</button>
                `;default:return""}}async filterOrders(e){await this.loadOrders(e)}showMessage(e,t="info"){const r=document.createElement("div");r.className=`message ${t}`,r.textContent=e,r.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${t==="success"?"#10b981":t==="error"?"#ef4444":"#3b82f6"};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `,document.body.appendChild(r),setTimeout(()=>{r.style.transform="translateX(0)"},100),setTimeout(()=>{r.style.transform="translateX(100%)",setTimeout(()=>{r.parentNode&&r.parentNode.removeChild(r)},300)},3e3)}toggleUserMenu(){const e=document.getElementById("userDropdown");e&&e.classList.toggle("show")}handleLogout(){confirm("确定要退出登录吗？")&&(localStorage.removeItem("token"),localStorage.removeItem("user"),window.location.href="/src/pages/login.html")}}window.payOrder=async a=>{alert(`支付订单 ${a} - 功能开发中`)};window.cancelOrder=async a=>{confirm("确认取消这个订单吗？")&&alert(`取消订单 ${a} - 功能开发中`)};window.viewCourse=a=>{window.open("/src/pages/courses.html","_blank")};window.requestRefund=async a=>{confirm("确认申请退款吗？")&&alert(`申请退款 ${a} - 功能开发中`)};document.addEventListener("DOMContentLoaded",()=>{window.profileManager=new d});const s=document.createElement("style");s.textContent=`
    /* 个人信息面板样式 */
    .personal-info-section {
        padding: 24px;
    }
    
    .info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    
    .info-header h3 {
        margin: 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
    }
    
    .btn-edit {
        background: rgba(74, 158, 255, 0.1);
        border: 1px solid rgba(74, 158, 255, 0.3);
        color: #4a9eff;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .btn-edit:hover {
        background: rgba(74, 158, 255, 0.2);
    }
    
    .info-form {
        margin-bottom: 32px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
    }
    
    .form-group.full-width {
        grid-column: 1 / -1;
    }
    
    .form-group label {
        color: #d1d5db;
        font-size: 14px;
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .form-group input,
    .form-group textarea {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #4a9eff;
        background: rgba(255, 255, 255, 0.08);
    }
    
    .form-group input.editable,
    .form-group textarea.editable {
        border-color: rgba(74, 158, 255, 0.5);
        background: rgba(255, 255, 255, 0.08);
    }
    
    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
    }
    
    .btn-save,
    .btn-cancel {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }
    
    .btn-save {
        background: #10b981;
        color: white;
    }
    
    .btn-save:hover {
        background: #059669;
    }
    
    .btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
    }
    
    .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .account-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }
    
    .stat-item {
        text-align: center;
    }
    
    .stat-label {
        display: block;
        color: #9ca3af;
        font-size: 12px;
        margin-bottom: 4px;
    }
    
    .stat-value {
        display: block;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
    }
    
    /* 订单面板样式 */
    .orders-section {
        padding: 24px;
    }
    
    .orders-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    
    .orders-header h3 {
        margin: 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 600;
    }
    
    .orders-filter {
        display: flex;
        gap: 8px;
    }
    
    .filter-btn {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #d1d5db;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .filter-btn.active,
    .filter-btn:hover {
        background: rgba(74, 158, 255, 0.1);
        border-color: rgba(74, 158, 255, 0.3);
        color: #4a9eff;
    }
    
    .order-item {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        margin-bottom: 16px;
        overflow: hidden;
    }
    
    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .order-info {
        display: flex;
        gap: 16px;
        align-items: center;
    }
    
    .order-id {
        color: #4a9eff;
        font-weight: 600;
        font-size: 14px;
    }
    
    .order-date {
        color: #9ca3af;
        font-size: 14px;
    }
    
    .order-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    .order-status.pending {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
    }
    
    .order-status.paid {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
    }
    
    .order-status.completed {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
    }
    
    .order-status.refunded {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
    }
    
    .order-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
    }
    
    .course-title {
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
    }
    
    .payment-method {
        color: #9ca3af;
        font-size: 14px;
        margin: 0;
    }
    
    .amount {
        color: #4a9eff;
        font-size: 18px;
        font-weight: 700;
    }
    
    .order-actions {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        justify-content: flex-end;
    }
    
    .btn-action {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }
    
    .btn-action.primary {
        background: #4a9eff;
        color: white;
    }
    
    .btn-action.primary:hover {
        background: #3b82f6;
    }
    
    .btn-action.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #d1d5db;
    }
    
    .btn-action.secondary:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .loading-state,
    .error-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #9ca3af;
        flex-direction: column;
        gap: 12px;
    }
    
    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top: 3px solid #4a9eff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    .no-orders {
        text-align: center;
        padding: 60px 20px;
        color: #9ca3af;
    }
    
    .no-data-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
    }
    
    .no-orders p {
        margin: 0 0 20px 0;
        font-size: 16px;
    }
    
    .btn-browse {
        display: inline-block;
        padding: 10px 20px;
        background: #4a9eff;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: background 0.2s;
    }
    
    .btn-browse:hover {
        background: #3b82f6;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* 响应式设计 */
    @media (max-width: 768px) {
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .account-stats {
            grid-template-columns: 1fr;
        }
        
        .orders-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
        }
        
        .orders-filter {
            flex-wrap: wrap;
        }
        
        .order-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }
        
        .order-actions {
            flex-wrap: wrap;
        }
    }
`;document.head.appendChild(s);
