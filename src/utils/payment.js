// 支付数据和功能
let orderData = {};
let courseData = null;
let selectedMethod = 'alipay';
let selectedCoupon = null;
let originalAmount = 899.00;
let currentAmount = 899.00;
let isFreeMode = false;

// 显示通知函数（移植自main.js以避免依赖问题）
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">&times;</button>
        </div>
    `;
    
    // 添加样式（如果不存在）
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #e0e6ff;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                max-width: 300px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                border-left: 4px solid #4CAF50;
            }
            
            .notification-error {
                border-left: 4px solid #f44336;
            }
            
            .notification-warning {
                border-left: 4px solid #ff9800;
            }
            
            .notification-info {
                border-left: 4px solid #2196F3;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                margin-left: 10px;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePayment();
    loadCourseData();
    setupEventListeners();
    updatePaymentAmount();
});

// 初始化支付页面
function initializePayment() {
    // 检查用户登录状态
    checkAuthenticationStatus();
    
    // 禁用非支付宝支付方式
    disableNonAlipayMethods();
    
    // 从URL获取订单ID或课程ID
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const courseId = urlParams.get('courseId');
    
    if (orderId) {
        loadOrderById(orderId);
    } else if (courseId) {
        loadCourseAndCreateOrder(courseId);
    } else {
        // 使用默认订单数据
        initializeDefaultOrder();
    }
}

// 检查用户认证状态
function checkAuthenticationStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        showNotification('请先登录以继续支付', 'error');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return;
    }
}

// 初始化默认订单
function initializeDefaultOrder() {
    orderData = {
        orderId: generateOrderId(),
        courseName: '深度学习基础与实践',
        courseLevel: '中级',
        courseDuration: '40小时',
        instructor: 'Dr. AI',
        originalPrice: 1299.00,
        currentPrice: 899.00,
        discount: 400.00,
        createTime: new Date().toISOString()
    };
    
    updateOrderDisplay();
}

// 生成订单号
function generateOrderId() {
    const now = new Date();
    const timestamp = now.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${timestamp.toString().slice(-6)}${random}`;
}

// 根据订单ID加载订单
async function loadOrderById(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                orderData = {
                    orderId: data.data.id,
                    courseName: data.data.courseName,
                    courseId: data.data.courseId,
                    originalPrice: data.data.originalPrice,
                    currentPrice: data.data.totalAmount,
                    discount: data.data.originalPrice - data.data.totalAmount,
                    createTime: data.data.createTime,
                    status: data.data.status
                };
                updateOrderDisplay();
                return;
            }
        }
        
        // API调用失败，使用回退数据
        throw new Error('无法获取订单信息');
    } catch (error) {
        console.error('订单加载错误:', error);
        showNotification('订单加载失败，使用默认数据', 'warning');
        initializeDefaultOrder();
    }
}

// 加载课程数据
async function loadCourseData() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    
    if (courseId) {
        try {
            const response = await fetch(`/api/courses/${courseId}`);
            const data = await response.json();
            
            if (data.code === 200 && data.data) {
                courseData = data.data;
                console.log('课程数据:', courseData);
                
                // 检查是否为免费课程
                if (courseData.isFree) {
                    handleFreeCourse();
                } else {
                    // 创建订单数据
                    orderData = {
                        orderId: generateOrderId(),
                        courseId: courseData.id,
                        courseName: courseData.title,
                        courseLevel: getDifficultyText(courseData.difficulty),
                        courseDuration: `${courseData.durationHours || 10}小时`,
                        instructor: '专业讲师',
                        originalPrice: courseData.originalPrice || (courseData.price !== undefined ? courseData.price : 899),
                        currentPrice: courseData.price !== undefined ? courseData.price : 899,
                        discount: Math.max(0, (courseData.originalPrice || (courseData.price !== undefined ? courseData.price : 899)) - (courseData.price !== undefined ? courseData.price : 899))
                    };
                    
                    // 更新全局金额变量
                    originalAmount = orderData.currentPrice;
                    currentAmount = originalAmount;
                    
                    console.log('课程价格信息:', {
                        originalPrice: orderData.originalPrice,
                        currentPrice: orderData.currentPrice,
                        originalAmount: originalAmount,
                        currentAmount: currentAmount
                    });
                    
                    updateOrderDisplay();
                }
            }
        } catch (error) {
            console.error('加载课程数据失败:', error);
            initializeDefaultOrder();
        }
    } else {
        initializeDefaultOrder();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 支付方式选择
    document.querySelectorAll('.payment-method:not(.disabled)').forEach(method => {
        method.addEventListener('click', function() {
            selectPaymentMethod(this.dataset.method);
        });
    });
    
    // 优惠券选择
    const couponSelect = document.getElementById('couponSelect');
    if (couponSelect) {
        couponSelect.addEventListener('change', handleCouponChange);
    }
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(event) {
        const paymentModal = document.getElementById('paymentModal');
        const successModal = document.getElementById('successModal');
        
        if (event.target === paymentModal) {
            hidePaymentModal();
        }
        if (event.target === successModal) {
            hideSuccessModal();
        }
    });
}

// 禁用非支付宝支付方式
function disableNonAlipayMethods() {
    const nonAlipayMethods = document.querySelectorAll('.payment-method:not([data-method="alipay"])');
    nonAlipayMethods.forEach(method => {
        method.classList.add('disabled');
        method.style.pointerEvents = 'none';
    });
}

// 加载课程并创建订单
async function loadCourseAndCreateOrder(courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}`);
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            courseData = data.data;
            
            // 检查是否为免费课程
            if (courseData.isFree) {
                handleFreeCourse();
                return;
            }
            
            // 创建订单数据
            orderData = {
                orderId: generateOrderId(),
                courseId: courseData.id,
                courseName: courseData.title,
                courseLevel: getDifficultyText(courseData.difficulty),
                courseDuration: `${courseData.durationHours || 10}小时`,
                instructor: '专业讲师',
                originalPrice: courseData.originalPrice || (courseData.price !== undefined ? courseData.price : 299),
                currentPrice: courseData.price !== undefined ? courseData.price : 299,
                discount: Math.max(0, (courseData.originalPrice || (courseData.price !== undefined ? courseData.price : 299)) - (courseData.price !== undefined ? courseData.price : 299)),
                createTime: new Date().toISOString()
            };
            
            updateOrderDisplay();
        } else {
            throw new Error('课程不存在');
        }
    } catch (error) {
        console.error('加载课程失败:', error);
        showNotification('课程加载失败，请重试', 'error');
        initializeDefaultOrder();
    }
}

// 处理免费课程
function handleFreeCourse() {
    isFreeMode = true;
    
    // 显示免费课程提示
    showFreeCourseNotice();
    
    // 隐藏支付相关元素
    hidePaymentElements();
    
    // 更新订单显示
    orderData = {
        orderId: generateOrderId(),
        courseId: courseData.id,
        courseName: courseData.title,
        courseLevel: getDifficultyText(courseData.difficulty),
        courseDuration: `${courseData.durationHours || 10}小时`,
        instructor: '专业讲师',
        originalPrice: 0,
        currentPrice: 0,
        discount: 0,
        createTime: new Date().toISOString()
    };
    
    updateOrderDisplay();
}

// 显示免费课程提示
function showFreeCourseNotice() {
    const paymentMethods = document.querySelector('.payment-methods');
    if (paymentMethods) {
        const notice = document.createElement('div');
        notice.className = 'free-course-notice';
        notice.innerHTML = `
            <h3>🎉 恭喜您！这是一门免费课程</h3>
            <p>您可以免费学习此课程的所有内容，点击下方按钮立即开始学习！</p>
        `;
        paymentMethods.parentNode.insertBefore(notice, paymentMethods);
    }
}

// 隐藏支付相关元素
function hidePaymentElements() {
    const elementsToHide = [
        '.payment-methods',
        '.coupons-section',
        '.payment-security'
    ];
    
    elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('hide-for-free');
        }
    });
    
    // 更改支付按钮文案
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.innerHTML = `
            <span class="pay-text">免费学习</span>
            <span class="pay-amount">¥0.00</span>
        `;
        payButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    }
}

// 获取难度文本
function getDifficultyText(difficulty) {
    const levels = {
        'beginner': '入门',
        'intermediate': '进阶', 
        'advanced': '高级',
        'expert': '专家'
    };
    return levels[difficulty] || '入门';
}

// 选择支付方式
function selectPaymentMethod(method) {
    // 更新UI
    document.querySelectorAll('.payment-method').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    // 更新选中的支付方式
    selectedMethod = method;
    
    // 更新确认弹窗中的支付方式显示
    updateConfirmMethod(method);
    
    // 添加选择动画效果
    const selectedItem = document.querySelector(`[data-method="${method}"]`);
    selectedItem.style.transform = 'scale(1.02)';
    setTimeout(() => {
        selectedItem.style.transform = 'scale(1)';
    }, 200);
}

// 更新确认弹窗中的支付方式
function updateConfirmMethod(method) {
    const confirmMethod = document.getElementById('confirmMethod');
    if (!confirmMethod) return;
    
    const methodNames = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'card': '银行卡支付',
        'balance': '账户余额'
    };
    
    confirmMethod.textContent = methodNames[method] || '支付宝';
}

// 处理优惠券变化
function handleCouponChange(e) {
    const selectedOption = e.target.selectedOptions[0];
    const couponId = e.target.value;
    
    if (couponId) {
        const discount = parseFloat(selectedOption.dataset.discount) || 0;
        selectedCoupon = {
            id: couponId,
            name: selectedOption.text,
            discount: discount
        };
        
        // 显示优惠券优惠项
        const couponDiscountItem = document.getElementById('couponDiscount');
        if (couponDiscountItem) {
            couponDiscountItem.style.display = 'flex';
            couponDiscountItem.querySelector('.price-value').textContent = `-¥${discount.toFixed(2)}`;
        }
        
        showNotification(`优惠券已应用：减¥${discount}`, 'success');
    } else {
        selectedCoupon = null;
        
        // 隐藏优惠券优惠项
        const couponDiscountItem = document.getElementById('couponDiscount');
        if (couponDiscountItem) {
            couponDiscountItem.style.display = 'none';
        }
    }
    
    updatePaymentAmount();
}

// 更新支付金额
function updatePaymentAmount() {
    let finalAmount = originalAmount;
    
    // 减去优惠券优惠
    if (selectedCoupon) {
        finalAmount -= selectedCoupon.discount;
    }
    
    currentAmount = Math.max(finalAmount, 0); // 确保金额不为负数
    
    // 更新UI显示
    const totalAmountElement = document.getElementById('totalAmount');
    const payAmountElement = document.querySelector('.pay-amount');
    const confirmAmountElement = document.getElementById('confirmAmount');
    
    if (totalAmountElement) {
        totalAmountElement.textContent = `¥${currentAmount.toFixed(2)}`;
    }
    if (payAmountElement) {
        payAmountElement.textContent = `¥${currentAmount.toFixed(2)}`;
    }
    if (confirmAmountElement) {
        confirmAmountElement.textContent = `¥${currentAmount.toFixed(2)}`;
    }
}

// 更新订单显示
function updateOrderDisplay() {
    // 更新订单号
    const orderNumberElement = document.getElementById('orderNumber');
    if (orderNumberElement) {
        orderNumberElement.textContent = orderData.orderId || generateOrderId();
    }
    
    // 更新课程信息
    const courseNameElement = document.getElementById('courseName');
    if (courseNameElement) {
        courseNameElement.textContent = orderData.courseName || '深度学习基础与实践';
    }
    
    // 更新价格信息
    if (isFreeMode) {
        originalAmount = 0;
        currentAmount = 0;
        
        // 更新价格显示为免费
        const originalPriceElement = document.querySelector('.original-price');
        const currentPriceElement = document.querySelector('.current-price');
        const priceValueElements = document.querySelectorAll('.price-value');
        
        if (originalPriceElement) originalPriceElement.textContent = '免费';
        if (currentPriceElement) currentPriceElement.textContent = '免费';
        
        priceValueElements.forEach((element, index) => {
            if (index === 0) element.textContent = '免费'; // 课程原价
            if (index === 1) element.textContent = '免费'; // 平台优惠
            if (element.parentElement.classList.contains('total')) {
                element.textContent = '免费'; // 实付金额
            }
        });
    } else {
        originalAmount = (orderData.currentPrice !== undefined && orderData.currentPrice !== null) ? orderData.currentPrice : 899.00;
        
        // 更新价格显示
        const originalPriceElement = document.querySelector('.original-price');
        const currentPriceElement = document.querySelector('.current-price');
        const priceValueElements = document.querySelectorAll('.price-value');
        
        if (originalPriceElement && orderData.originalPrice) {
            originalPriceElement.textContent = `¥${orderData.originalPrice}`;
        }
        if (currentPriceElement) {
            currentPriceElement.textContent = `¥${orderData.currentPrice || originalAmount}`;
        }
        
        // 更新价格明细
        if (priceValueElements.length >= 3) {
            priceValueElements[0].textContent = `¥${orderData.originalPrice || originalAmount}`;
            if (orderData.discount > 0) {
                priceValueElements[1].textContent = `-¥${orderData.discount}`;
            } else {
                priceValueElements[1].textContent = `-¥0.00`;
            }
        }
        
        updatePaymentAmount();
    }
    
    // 更新确认弹窗中的课程名称
    const confirmCourseElement = document.getElementById('confirmCourse');
    if (confirmCourseElement) {
        confirmCourseElement.textContent = orderData.courseName || '深度学习基础与实践';
    }
}

// 开始支付流程
function processPay() {
    // 如果是免费模式，直接开始学习
    if (isFreeMode) {
        enrollFreeCourse();
        return;
    }
    
    // 验证支付方式
    if (!selectedMethod) {
        showNotification('请选择支付方式', 'error');
        return;
    }
    
    // 验证金额
    if (currentAmount <= 0) {
        showNotification('支付金额有误', 'error');
        return;
    }
    
    // 更新支付按钮文案
    const payButton = document.getElementById('payButton');
    const payText = payButton.querySelector('.pay-text');
    if (payText) {
        const methodNames = {
            'alipay': '支付宝支付',
            'wechat': '微信支付',
            'card': '银行卡支付',
            'balance': '余额支付'
        };
        payText.textContent = methodNames[selectedMethod] || '立即支付';
    }
    
    // 显示确认弹窗
    showPaymentModal();
}

// 注册免费课程
async function enrollFreeCourse() {
    const payButton = document.getElementById('payButton');
    payButton.classList.add('loading');
    
    try {
        // 模拟注册免费课程
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        payButton.classList.remove('loading');
        showNotification('注册成功！现在就开始学习吧！', 'success');
        
        setTimeout(() => {
            window.location.href = `/src/pages/study.html?courseId=${courseData.id}`;
        }, 1000);
        
    } catch (error) {
        payButton.classList.remove('loading');
        showNotification('注册失败，请重试', 'error');
    }
}

// 显示支付确认弹窗
function showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 添加弹窗显示动画
    const content = modal.querySelector('.modal-content');
    content.style.transform = 'scale(0.9)';
    content.style.opacity = '0';
    
    setTimeout(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
    }, 50);
}

// 隐藏支付确认弹窗
function hidePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 确认支付
async function confirmPayment() {
    hidePaymentModal();
    
    // 显示支付按钮加载状态
    const payButton = document.getElementById('payButton');
    payButton.classList.add('loading');
    
    try {
        // 准备支付数据
        const paymentData = {
            orderId: orderData.orderId,
            paymentMethod: selectedMethod,
            amount: currentAmount,
            couponId: selectedCoupon?.id || null
        };
        
        // 调用支付API
        const result = await processPaymentRequest(paymentData);
        
        if (result.success) {
            // 支付成功
            payButton.classList.remove('loading');
            showNotification('支付成功！', 'success');
            setTimeout(() => {
                showSuccessModal();
            }, 1000);
        } else {
            throw new Error(result.message || '支付失败');
        }
        
    } catch (error) {
        console.error('支付错误:', error);
        payButton.classList.remove('loading');
        showNotification(error.message || '支付失败，请重试', 'error');
    }
}

// 处理支付请求
async function processPaymentRequest(paymentData) {
    // 模拟不同支付方式的处理逻辑
    switch (paymentData.paymentMethod) {
        case 'alipay':
            return await processAlipayPayment(paymentData);
        case 'wechat':
            return await processWechatPayment(paymentData);
        case 'card':
            return await processCardPayment(paymentData);
        case 'balance':
            return await processBalancePayment(paymentData);
        default:
            throw new Error('不支持的支付方式');
    }
}

// 支付宝支付 - 调用真实支付宝接口
async function processAlipayPayment(paymentData) {
    try {
        // 1. 首先创建订阅订单
        const subscriptionResponse = await createSubscriptionOrder();
        if (!subscriptionResponse.success) {
            throw new Error(subscriptionResponse.message || '创建订单失败');
        }

        const orderNo = subscriptionResponse.data.subscription.orderNo;
        
        // 2. 创建支付宝支付
        const token = localStorage.getItem('token');
        const alipayResponse = await fetch('/api/payment/alipay/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: new URLSearchParams({
                orderNo: orderNo,
                amount: paymentData.amount.toString(),
                subject: courseData ? `课程购买-${courseData.title}` : '课程购买',
                body: courseData ? courseData.description : '在线课程购买'
            })
        });

        const alipayData = await alipayResponse.json();
        console.log('支付宝支付创建响应:', alipayData);
        
        if (alipayData.code === 200 && alipayData.data && alipayData.data.form) {
            // 3. 处理支付宝支付表单
            const paymentForm = alipayData.data.form;
            console.log('收到支付宝支付表单:', paymentForm);
            
            // 显示支付提示
            showNotification('正在跳转到支付宝支付页面...', 'info');
            
            // 返回Promise来处理支付结果
            return new Promise((resolve, reject) => {
                // 延迟跳转，让用户看到提示
                setTimeout(() => {
                    // 创建一个新窗口并提交支付表单
                    const payWindow = window.open('', 'alipay_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
                    if (payWindow) {
                        payWindow.document.write(paymentForm);
                        payWindow.document.close();
                    }
                    
                    // 监听支付结果
                    const checkPaymentStatus = setInterval(async () => {
                        try {
                            // 检查支付状态
                            const statusResponse = await fetch(`/api/payment/status/${orderNo}`);
                            const statusData = await statusResponse.json();
                            
                            if (statusData.code === 200 && statusData.data) {
                                const paymentStatus = statusData.data.status;
                                
                                if (paymentStatus === 'TRADE_SUCCESS' || paymentStatus === 'TRADE_FINISHED') {
                                    // 支付成功
                                    clearInterval(checkPaymentStatus);
                                    if (payWindow && !payWindow.closed) {
                                        payWindow.close();
                                    }
                                    
                                    // 显示支付成功通知
                                    showNotification('支付成功！正在处理订单...', 'success');
                                    
                                    // 激活订阅
                                    const activateResponse = await activateSubscription(orderNo);
                                    
                                    if (activateResponse.success) {
                                        showNotification('订单处理完成！课程已开通', 'success');
                                    } else {
                                        showNotification('订单激活中，请稍后查看课程', 'warning');
                                    }
                                    
                                    resolve({
                                        success: true,
                                        data: {
                                            transactionId: statusData.data.tradeNo || generateTransactionId(),
                                            paymentMethod: 'alipay',
                                            amount: paymentData.amount,
                                            orderNo: orderNo
                                        }
                                    });
                                } else if (paymentStatus === 'TRADE_CLOSED') {
                                    // 支付失败或取消
                                    clearInterval(checkPaymentStatus);
                                    if (payWindow && !payWindow.closed) {
                                        payWindow.close();
                                    }
                                    reject(new Error('支付已取消或失败'));
                                }
                            }
                            
                            // 检查窗口是否被用户关闭
                            if (payWindow && payWindow.closed) {
                                clearInterval(checkPaymentStatus);
                                reject(new Error('支付窗口已关闭，支付可能未完成'));
                            }
                        } catch (error) {
                            console.error('检查支付状态失败:', error);
                        }
                    }, 2000); // 每2秒检查一次
                    
                    // 15分钟后停止检查
                    setTimeout(() => {
                        clearInterval(checkPaymentStatus);
                        if (payWindow && !payWindow.closed) {
                            payWindow.close();
                        }
                        reject(new Error('支付超时，请重试'));
                    }, 15 * 60 * 1000);
                    
                }, 1000);
            });
            
        } else {
            throw new Error(alipayData.message || '创建支付宝支付失败');
        }
        
    } catch (error) {
        console.error('支付宝支付失败:', error);
        throw error;
    }
}

// 微信支付
async function processWechatPayment(paymentData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                data: {
                    transactionId: generateTransactionId(),
                    paymentMethod: 'wechat',
                    amount: paymentData.amount
                }
            });
        }, 2000);
    });
}

// 银行卡支付
async function processCardPayment(paymentData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                data: {
                    transactionId: generateTransactionId(),
                    paymentMethod: 'card',
                    amount: paymentData.amount
                }
            });
        }, 2000);
    });
}

// 余额支付
async function processBalancePayment(paymentData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 模拟余额检查
            const currentBalance = 1258.00;
            if (currentBalance >= paymentData.amount) {
                resolve({
                    success: true,
                    data: {
                        transactionId: generateTransactionId(),
                        paymentMethod: 'balance',
                        amount: paymentData.amount,
                        remainingBalance: currentBalance - paymentData.amount
                    }
                });
            } else {
                reject(new Error('余额不足'));
            }
        }, 1500);
    });
}

// 生成交易号
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
}

// 显示支付成功弹窗
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 播放成功音效（可选）
    // playSuccessSound();
    
    // 添加成功动画
    const successIcon = modal.querySelector('.success-icon');
    successIcon.style.animation = 'none';
    setTimeout(() => {
        successIcon.style.animation = 'success-bounce 1s ease-out';
    }, 100);
}

// 隐藏支付成功弹窗
function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 开始学习
function startLearning() {
    hideSuccessModal();
    showNotification('正在跳转到课程学习页面...', 'info');
    
    setTimeout(() => {
        const courseId = (courseData && courseData.id) || orderData.courseId || 1;
        window.location.href = `study.html?courseId=${courseId}`;
    }, 1000);
}

// 返回课程详情页面
function backToCourse() {
    hideSuccessModal();
    showNotification('正在返回课程页面...', 'info');
    
    setTimeout(() => {
        const courseId = (courseData && courseData.id) || orderData.courseId || 1;
        window.location.href = `course-detail.html?courseId=${courseId}`;
    }, 1000);
}

// 查看订单
function viewOrder() {
    hideSuccessModal();
    showNotification('正在跳转到订单详情页面...', 'info');
    
    setTimeout(() => {
        window.location.href = `profile.html#orders`;
    }, 1000);
}

// 查看全部优惠券
function showAllCoupons() {
    showNotification('查看全部优惠券功能', 'info');
    // 在真实环境中，这里可能会打开优惠券页面或弹窗
}

// 安全检查
function performSecurityCheck() {
    // 检查页面完整性
    if (!document.querySelector('.payment-methods') || 
        !document.querySelector('.order-summary')) {
        showNotification('页面异常，请刷新重试', 'error');
        return false;
    }
    
    // 检查支付金额
    if (currentAmount <= 0 || currentAmount > 99999) {
        showNotification('支付金额异常', 'error');
        return false;
    }
    
    return true;
}

// 页面卸载前的清理
window.addEventListener('beforeunload', function(e) {
    // 如果正在支付过程中，提醒用户
    const payButton = document.getElementById('payButton');
    if (payButton && payButton.classList.contains('loading')) {
        e.preventDefault();
        e.returnValue = '支付正在处理中，确定要离开吗？';
        return e.returnValue;
    }
});

// 键盘事件处理
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hidePaymentModal();
        hideSuccessModal();
    }
});

// 监听网络状态
window.addEventListener('online', function() {
    showNotification('网络连接已恢复', 'success');
});

window.addEventListener('offline', function() {
    showNotification('网络连接已断开，请检查网络后重试', 'error');
});

// 创建订阅订单
async function createSubscriptionOrder() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('请先登录');
        }

        const response = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({
                subscribableType: 'course',
                subscribableId: courseData?.id || orderData?.courseId || 1,
                paymentMethod: selectedMethod || 'alipay'
            })
        });

        const data = await response.json();
        return {
            success: data.code === 200,
            data: data.data,
            message: data.message
        };
    } catch (error) {
        console.error('创建订阅订单失败:', error);
        return {
            success: false,
            message: error.message || '创建订单失败'
        };
    }
}

// 激活订阅
async function activateSubscription(orderNo) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: new URLSearchParams({
                orderNo: orderNo
            })
        });

        const data = await response.json();
        return {
            success: data.code === 200,
            message: data.message
        };
    } catch (error) {
        console.error('激活订阅失败:', error);
        return {
            success: false,
            message: error.message || '激活失败'
        };
    }
}

// 检查用户订阅状态
async function checkSubscriptionStatus(courseId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return { hasAccess: false, needLogin: true };
        }

        const response = await fetch(`/api/subscriptions/access/course/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.code === 200) {
            return data.data;
        }
        return { hasAccess: false, needLogin: false };
    } catch (error) {
        console.error('检查订阅状态失败:', error);
        return { hasAccess: false, needLogin: false };
    }
}

// 导出函数供全局使用
window.processPay = processPay;
window.hidePaymentModal = hidePaymentModal;
window.confirmPayment = confirmPayment;
window.startLearning = startLearning;
window.backToCourse = backToCourse;
window.viewOrder = viewOrder;
window.showAllCoupons = showAllCoupons;
window.checkSubscriptionStatus = checkSubscriptionStatus;