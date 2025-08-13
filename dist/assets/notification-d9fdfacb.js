class c{constructor(){this.container=null,this.init()}init(){document.getElementById("notification-container")?this.container=document.getElementById("notification-container"):(this.container=document.createElement("div"),this.container.id="notification-container",this.container.className="notification-container",document.body.appendChild(this.container),this.addStyles())}addStyles(){if(!document.getElementById("notification-styles")){const i=document.createElement("style");i.id="notification-styles",i.textContent=`
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                }

                .notification {
                    background: rgba(17, 24, 39, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px 20px;
                    min-width: 320px;
                    max-width: 420px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideIn 0.3s ease-out;
                    pointer-events: all;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }

                .notification:hover {
                    transform: translateX(-5px);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
                }

                .notification.removing {
                    animation: slideOut 0.3s ease-out;
                }

                .notification-icon {
                    font-size: 24px;
                    min-width: 24px;
                }

                .notification-content {
                    flex: 1;
                    color: #f3f4f6;
                }

                .notification-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                    font-size: 14px;
                    color: #ffffff;
                }

                .notification-message {
                    font-size: 13px;
                    line-height: 1.4;
                    color: #d1d5db;
                }

                .notification-close {
                    color: #9ca3af;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 4px;
                    transition: color 0.2s;
                }

                .notification-close:hover {
                    color: #ffffff;
                }

                .notification.success {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(17, 24, 39, 0.95));
                    border-color: rgba(16, 185, 129, 0.3);
                }

                .notification.success .notification-icon {
                    color: #10b981;
                }

                .notification.error {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(17, 24, 39, 0.95));
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .notification.error .notification-icon {
                    color: #ef4444;
                }

                .notification.warning {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(17, 24, 39, 0.95));
                    border-color: rgba(245, 158, 11, 0.3);
                }

                .notification.warning .notification-icon {
                    color: #f59e0b;
                }

                .notification.info {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(17, 24, 39, 0.95));
                    border-color: rgba(59, 130, 246, 0.3);
                }

                .notification.info .notification-icon {
                    color: #3b82f6;
                }

                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: currentColor;
                    border-radius: 0 0 12px 12px;
                    animation: progress linear;
                    transform-origin: left;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }

                @keyframes progress {
                    from {
                        transform: scaleX(1);
                    }
                    to {
                        transform: scaleX(0);
                    }
                }

                @media (max-width: 640px) {
                    .notification-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                    }

                    .notification {
                        min-width: auto;
                        max-width: none;
                    }
                }
            `,document.head.appendChild(i)}}show(i,o="info",t="",e=5e3){const n=document.createElement("div");n.className=`notification ${o}`;const r={success:"✓",error:"✕",warning:"⚠",info:"ℹ"},a=t||{success:"成功",error:"错误",warning:"警告",info:"提示"}[o];return n.innerHTML=`
            <span class="notification-icon">${r[o]}</span>
            <div class="notification-content">
                <div class="notification-title">${a}</div>
                <div class="notification-message">${i}</div>
            </div>
            <span class="notification-close">✕</span>
            ${e>0?`<div class="notification-progress" style="animation-duration: ${e}ms;"></div>`:""}
        `,this.container.appendChild(n),n.querySelector(".notification-close").addEventListener("click",s=>{s.stopPropagation(),this.remove(n)}),n.addEventListener("click",()=>{this.remove(n)}),e>0&&setTimeout(()=>{this.remove(n)},e),n}remove(i){!i||i.classList.contains("removing")||(i.classList.add("removing"),setTimeout(()=>{i.parentNode&&i.parentNode.removeChild(i)},300))}success(i,o="",t=5e3){return this.show(i,"success",o,t)}error(i,o="",t=5e3){return this.show(i,"error",o,t)}warning(i,o="",t=5e3){return this.show(i,"warning",o,t)}info(i,o="",t=5e3){return this.show(i,"info",o,t)}clear(){this.container.querySelectorAll(".notification").forEach(o=>this.remove(o))}}const f=new c;window.notification=f;
