// 支付数据和功能
let orderData = {};
let courseData = null;
let selectedMethod = 'alipay';
let selectedCoupon = null;
let originalAmount = 0;
let currentAmount = 0;
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Payment page initialized');
    
    // 添加调试功能到window对象
    window.manualCheckPayment = async function(orderNo) {
        if (!orderNo) {
            console.error('请提供订单号');
            return;
        }
        
        console.log('手动检查支付状态，订单号:', orderNo);
        
        try {
            // 检查支付状态
            const statusResponse = await fetch(`/api/payment/status/${orderNo}`);
            const statusData = await statusResponse.json();
            console.log('支付状态:', statusData);
            
            if (statusData.code === 200 && statusData.data) {
                const paymentStatus = statusData.data.status;
                
                if (paymentStatus === 'TRADE_SUCCESS' || paymentStatus === 'TRADE_FINISHED') {
                    console.log('支付已成功，尝试激活订阅...');
                    
                    // 激活订阅
                    const activateResponse = await activateSubscription(orderNo);
                    console.log('激活结果:', activateResponse);
                    
                    if (activateResponse.success) {
                        showNotification('课程已成功解锁！', 'success');
                        showSuccessModal();
                    } else {
                        showNotification('激活失败：' + activateResponse.message, 'error');
                    }
                } else {
                    console.log('支付状态:', paymentStatus);
                    showNotification('订单未支付或支付失败', 'warning');
                }
            }
        } catch (error) {
            console.error('手动检查失败:', error);
            showNotification('检查失败：' + error.message, 'error');
        }
    };
    
    // 添加价格调试功能
    window.debugPaymentAmount = function() {
        console.log('支付金额调试信息:', {
            currentAmount: currentAmount,
            originalAmount: originalAmount,
            orderData: orderData,
            courseData: courseData,
            isFreeMode: isFreeMode
        });
        
        // 强制更新价格显示
        updatePaymentAmount();
    };
    
    // 先初始化，再设置事件监听器
    initializePayment();
    setupEventListeners();
    
    // 延迟更新以确保数据加载完成
    setTimeout(() => {
        // 数据加载完成后更新金额显示
        updatePaymentAmount();
        console.log('延迟更新完成，当前金额:', currentAmount);
        
        // 如果金额仍然是0但不是免费课程，再次尝试更新
        if (currentAmount === 0 && courseData && !courseData.isFree) {
            console.warn('金额为0但不是免费课程，尝试从orderData获取价格');
            if (orderData && orderData.currentPrice) {
                currentAmount = orderData.currentPrice;
                updatePaymentAmount();
            }
        }
    }, 1000); // 增加延迟到1秒
});

// 初始化支付页面
function initializePayment() {
    // 检查用户登录状态
    checkAuthenticationStatus();
    
    // 禁用非支付宝支付方式
    disableNonAlipayMethods();
    
    // 从URL获取type和id参数
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    const courseId = urlParams.get('courseId');  // 也支持courseId参数
    const bundleId = urlParams.get('bundleId');  // 也支持bundleId参数
    const orderId = urlParams.get('orderId');
    
    // 根据不同类型加载数据
    if (type === 'bundle' && (id || bundleId)) {
        // 加载课程包数据
        loadBundlePayment(id || bundleId);
    } else if (type === 'course' && (id || courseId)) {
        // 加载课程数据
        loadCourseAndCreateOrder(id || courseId);
    } else if (orderId) {
        // 直接通过订单ID加载
        loadOrderById(orderId);
    } else {
        // 检查sessionStorage中的支付数据
        const paymentDataStr = sessionStorage.getItem('paymentData');
        if (paymentDataStr) {
            try {
                const paymentData = JSON.parse(paymentDataStr);
                if (paymentData.type === 'bundle') {
                    loadBundlePayment(paymentData.bundleId || paymentData.id);
                } else if (paymentData.type === 'course') {
                    loadCourseAndCreateOrder(paymentData.courseId || paymentData.id);
                }
            } catch (e) {
                console.error('解析支付数据失败:', e);
                showNotification('支付数据解析失败，请重新选择课程', 'error');
            }
        } else {
            // 没有支付数据，直接加载课程数据
            loadCourseData();
        }
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

// 初始化默认订单 - 已废弃，必须从API获取真实数据
function initializeDefaultOrder() {
    console.error('不应该使用默认订单数据！');
    showNotification('无法加载课程信息，请刷新页面重试', 'error');
    // 不设置任何默认数据
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
        showNotification('订单加载失败，请刷新页面重试', 'error');
    }
}

// 加载课程数据
async function loadCourseData() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const type = urlParams.get('type') || 'course';
    const price = urlParams.get('price');
    const continuePayment = urlParams.get('continuePayment') === 'true';
    const existingOrderNo = urlParams.get('orderNo');
    const courseName = urlParams.get('courseName');
    
    // 如果是继续支付，使用传递的订单信息
    if (continuePayment && existingOrderNo) {
        orderData.orderNo = existingOrderNo;
        orderData.continuePayment = true;
        console.log('继续支付模式，使用现有订单号:', existingOrderNo);
    }
    
    if (type === 'bundle') {
        // 课程包 - 需要从API获取真实价格
        try {
            // 尝试获取课程包信息
            const bundleId = urlParams.get('bundleId') || 1;
            const token = localStorage.getItem('token');
            
            const bundleResponse = await fetch(`/api/courses/bundles/${bundleId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!bundleResponse.ok) {
                console.error('无法获取课程包信息');
                showNotification('获取课程包信息失败，请刷新页面重试', 'error');
                return;
            }
            
            const bundleData = await bundleResponse.json();
            if (!bundleData.success || !bundleData.data) {
                console.error('课程包数据格式错误', bundleData);
                showNotification('获取课程包信息失败，请刷新页面重试', 'error');
                return;
            }
            
            const bundlePrice = parseFloat(bundleData.data.price);
            const bundleName = bundleData.data.name || '课程包';
            const bundleOriginalPrice = bundleData.data.originalPrice ? parseFloat(bundleData.data.originalPrice) : bundlePrice;
            
            console.log('获取到课程包价格:', bundlePrice);
            
            courseData = {
                id: bundleId,
                title: bundleName,
                description: bundleData.data.description || '包含多门课程的套餐',
                price: bundlePrice,
                originalPrice: bundleOriginalPrice,
                isFree: false
            };
            
            orderData = {
                orderId: existingOrderNo || generateOrderId(),
                orderNo: existingOrderNo,
                courseId: bundleId,
                courseName: bundleName,
                courseLevel: '全部级别',
                courseDuration: '永久有效',
                instructor: '全部讲师',
                originalPrice: bundleOriginalPrice,
                currentPrice: bundlePrice,
                discount: Math.max(0, bundleOriginalPrice - bundlePrice),
                continuePayment: continuePayment
            };
            
            originalAmount = bundlePrice;
            currentAmount = bundlePrice;
            
        } catch (error) {
            console.error('获取课程包信息失败:', error);
            showNotification('获取课程包信息失败，请刷新页面重试', 'error');
            return;
        }
        
        displayOrderInfo();
        updatePriceDisplay();
        showNotification('正在加载课程包信息...', 'info');
        
    } else if (courseId) {
        try {
            const response = await fetch(`/api/courses/${courseId}`);
            const data = await response.json();
            
            if (data.code === 200 && data.data) {
                // API返回的课程信息可能在 data.data.course 中
                if (data.data.course) {
                    courseData = data.data.course;
                } else {
                    courseData = data.data;
                }
                console.log('课程数据:', courseData);
                
                // 检查是否为免费课程
                if (courseData.isFree) {
                    handleFreeCourse();
                } else {
                    // 创建订单数据
                    // 使用API返回的真实价格，不使用任何默认值
                    if (courseData.price === undefined || courseData.price === null) {
                        console.error('课程价格未定义！', courseData);
                        showNotification('获取课程价格失败，请刷新页面重试', 'error');
                        return;
                    }
                    
                    const realPrice = parseFloat(courseData.price);
                    const originalPrice = courseData.originalPrice ? parseFloat(courseData.originalPrice) : realPrice;
                    
                    orderData = {
                        orderId: existingOrderNo || generateOrderId(),
                        orderNo: existingOrderNo,
                        courseId: courseData.id,
                        courseName: courseName || courseData.title,
                        courseLevel: getDifficultyText(courseData.difficulty),
                        courseDuration: `${courseData.durationHours || 10}小时`,
                        instructor: '专业讲师',
                        originalPrice: originalPrice,
                        currentPrice: realPrice,  // 使用真实价格
                        discount: Math.max(0, originalPrice - realPrice),
                        continuePayment: continuePayment
                    };
                    
                    // 更新全局金额变量 - 使用真实价格
                    originalAmount = realPrice;
                    currentAmount = realPrice;
                    
                    console.log('课程价格信息:', {
                        apiPrice: courseData.price,
                        realPrice: realPrice,
                        originalPrice: originalPrice,
                        currentPrice: orderData.currentPrice,
                        originalAmount: originalAmount,
                        currentAmount: currentAmount
                    });
                    
                    if (price && Math.abs(parseFloat(price) - realPrice) > 0.01) {
                        console.warn('警告：URL传递的价格与真实价格不一致！使用真实价格:', realPrice);
                    }
                    
                    updateOrderDisplay();
                    updatePaymentAmount(); // 确保价格显示更新
                }
            }
        } catch (error) {
            console.error('加载课程数据失败:', error);
            showNotification('加载课程数据失败，请刷新页面重试', 'error');
        }
    } else {
        console.error('没有提供课程ID');
        showNotification('缺少课程信息，请返回重新选择', 'error');
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
    // 优惠券功能已暂时禁用
    // const couponSelect = document.getElementById('couponSelect');
    // if (couponSelect) {
    //     couponSelect.addEventListener('change', handleCouponChange);
    // }
    
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
            // API返回的课程信息在 data.data.course 中
            if (data.data.course) {
                courseData = data.data.course;
            } else {
                courseData = data.data;
            }
            console.log('课程数据:', courseData);
            
            // 检查是否为免费课程 - 使用isFree字段判断
            if (courseData.isFree === true) {
                handleFreeCourse();
                return;
            }
            
            // 获取课程价格
            const coursePrice = parseFloat(courseData.price);
            const originalPrice = courseData.originalPrice ? parseFloat(courseData.originalPrice) : coursePrice;
            
            // 价格为0但不是免费课程的情况（可能是数据错误）
            if (coursePrice === 0 && !courseData.isFree) {
                console.error('课程价格为0但不是免费课程:', courseData);
                showNotification('课程价格数据异常，请联系客服', 'error');
                return;
            }
            
            // 创建订单数据，使用实际的课程价格
            orderData = {
                orderId: generateOrderId(),
                courseId: courseData.id,
                courseName: courseData.title,
                courseDescription: courseData.description || '',
                courseLevel: getDifficultyText(courseData.difficulty),
                courseDuration: `${courseData.durationHours || 10}小时`,
                instructor: courseData.instructor || '专业讲师',
                originalPrice: originalPrice,
                currentPrice: coursePrice,
                discount: Math.max(0, originalPrice - coursePrice),
                createTime: new Date().toISOString(),
                type: 'course'
            };
            
            // 更新金额
            originalAmount = originalPrice;
            currentAmount = coursePrice;
            
            updateOrderDisplay();
            updatePaymentAmount();
        } else {
            throw new Error(data.message || '课程不存在');
        }
    } catch (error) {
        console.error('加载课程失败:', error);
        showNotification('课程加载失败: ' + error.message, 'error');
        
        // 跳转回课程页面
        setTimeout(() => {
            window.location.href = 'courses.html';
        }, 2000);
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

// 处理免费课程包
function handleFreeBundle() {
    isFreeMode = true;
    
    // 显示免费课程包提示
    const paymentMethods = document.querySelector('.payment-methods');
    if (paymentMethods) {
        const freeNotice = document.createElement('div');
        freeNotice.className = 'free-course-notice';
        freeNotice.innerHTML = `
            <h3>🎉 免费课程包</h3>
            <p>此课程包免费开放，点击下方按钮即可立即激活</p>
        `;
        paymentMethods.parentNode.insertBefore(freeNotice, paymentMethods);
        paymentMethods.style.display = 'none';
    }
    
    // 更新支付按钮
    const payBtn = document.querySelector('.btn-pay');
    if (payBtn) {
        payBtn.textContent = '立即激活';
        payBtn.onclick = async function() {
            await activateFreeBundle();
        };
    }
}

// 激活免费课程包
async function activateFreeBundle() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('请先登录', 'warning');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch('/api/orders/bundle', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bundleId: orderData.bundleId,
                paymentMethod: 'free'
            })
        });
        
        const result = await response.json();
        if (result.success) {
            showNotification('课程包激活成功！', 'success');
            setTimeout(() => {
                window.location.href = 'courses.html';
            }, 1500);
        } else {
            throw new Error(result.message || '激活失败');
        }
    } catch (error) {
        console.error('激活课程包失败:', error);
        showNotification('激活失败: ' + error.message, 'error');
    }
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
    let finalAmount = currentAmount; // 使用currentAmount而不是originalAmount
    
    // 不再处理优惠券
    // if (selectedCoupon) {
    //     finalAmount -= selectedCoupon.discount;
    // }
    
    finalAmount = Math.max(finalAmount, 0); // 确保金额不为负数
    
    console.log('更新支付金额:', {
        currentAmount: currentAmount,
        finalAmount: finalAmount,
        isFreeMode: isFreeMode
    });
    
    // 更新UI显示
    const totalAmountElement = document.getElementById('totalAmount');
    const payAmountElement = document.querySelector('.pay-amount');
    const confirmAmountElement = document.getElementById('confirmAmount');
    
    if (totalAmountElement) {
        totalAmountElement.textContent = `¥${finalAmount.toFixed(2)}`;
    }
    if (payAmountElement) {
        payAmountElement.textContent = `¥${finalAmount.toFixed(2)}`;
    }
    if (confirmAmountElement) {
        confirmAmountElement.textContent = `¥${finalAmount.toFixed(2)}`;
    }
    
    // 更新订单汇总中的总金额
    const summaryTotal = document.querySelector('.summary-total .total-amount');
    if (summaryTotal) {
        summaryTotal.textContent = `¥${finalAmount.toFixed(2)}`;
    }
    
    // 更新支付按钮文本 - 只有在明确是免费模式时才显示特殊文本
    const payButton = document.querySelector('.btn-pay');
    if (payButton) {
        if (isFreeMode || (courseData && courseData.isFree === true)) {
            // 免费课程
            payButton.innerHTML = `
                <span class="pay-text">免费学习</span>
                <span class="pay-amount">¥0.00</span>
            `;
        } else if (finalAmount > 0) {
            // 付费课程
            payButton.innerHTML = `
                <span class="pay-text">立即支付</span>
                <span class="pay-amount">¥${finalAmount.toFixed(2)}</span>
                <div class="pay-loading">
                    <div class="loading-spinner"></div>
                    <span>处理中...</span>
                </div>
            `;
        } else if (finalAmount === 0 && !isFreeMode) {
            // 价格为0但不是免费课程（可能是数据错误）
            console.warn('价格为0但不是免费模式，可能存在数据问题');
            payButton.innerHTML = `
                <span class="pay-text">立即支付</span>
                <span class="pay-amount">¥0.00</span>
                <div class="pay-loading">
                    <div class="loading-spinner"></div>
                    <span>处理中...</span>
                </div>
            `;
        }
    }
}

// 更新订单显示
function updateOrderDisplay() {
    // 检查是否有订单数据
    if (!orderData || !orderData.courseId) {
        console.error('没有订单数据，无法更新显示');
        return;
    }
    
    // 更新订单号
    const orderNumberElement = document.getElementById('orderNumber');
    if (orderNumberElement) {
        orderNumberElement.textContent = orderData.orderId || generateOrderId();
    }
    
    // 更新课程信息
    const courseNameElement = document.getElementById('courseName');
    if (courseNameElement && orderData.courseName) {
        courseNameElement.textContent = orderData.courseName;
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
        // 必须有真实价格
        if (orderData.currentPrice === undefined || orderData.currentPrice === null) {
            console.error('订单价格未定义');
            return;
        }
        
        originalAmount = orderData.currentPrice;
        
        // 更新价格显示
        const originalPriceElement = document.querySelector('.original-price');
        const currentPriceElement = document.querySelector('.current-price');
        const priceValueElements = document.querySelectorAll('.price-value');
        
        if (originalPriceElement && orderData.originalPrice) {
            originalPriceElement.textContent = `¥${orderData.originalPrice}`;
        }
        if (currentPriceElement) {
            currentPriceElement.textContent = `¥${orderData.currentPrice}`;
        }
        
        // 更新价格明细
        if (priceValueElements.length >= 3) {
            priceValueElements[0].textContent = `¥${orderData.originalPrice || orderData.currentPrice}`;
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
    if (confirmCourseElement && orderData.courseName) {
        confirmCourseElement.textContent = orderData.courseName;
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
            payButton.classList.remove('loading');
            
            // 检查是否已订阅
            if (result.alreadySubscribed) {
                // 已订阅，不需要显示支付成功弹窗
                return;
            }
            
            // 支付成功
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
        let orderNo;
        
        // 检查是否是继续支付
        if (orderData.continuePayment && orderData.orderNo) {
            // 继续支付，使用现有订单号
            orderNo = orderData.orderNo;
            console.log('继续支付，使用现有订单号:', orderNo);
        } else {
            // 1. 首先创建订阅订单
            const subscriptionResponse = await createSubscriptionOrder();
            
            // 处理不同的响应
            if (!subscriptionResponse.success) {
                throw new Error(subscriptionResponse.message || '创建订单失败');
            }
            
            // 检查是否已订阅
            if (subscriptionResponse.data.alreadySubscribed) {
                showNotification('您已订阅此课程，无需重复购买', 'warning');
                // 3秒后跳转到学习页面
                setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const courseId = urlParams.get('courseId') || courseData?.id || 1;
                    window.location.href = `study.html?courseId=${courseId}`;
                }, 3000);
                return {
                    success: true,
                    alreadySubscribed: true,
                    message: '已订阅'
                };
            }
            
            // 检查是否有未完成的订单
            if (subscriptionResponse.data.needPayment && subscriptionResponse.data.subscription) {
                orderNo = subscriptionResponse.data.subscription.orderNo;
                console.log('使用已有的待支付订单:', orderNo);
            } else {
                orderNo = subscriptionResponse.data.subscription.orderNo;
            }
        }
        
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
                    let checkCount = 0;
                    const maxChecks = 300; // 最多检查300次（10分钟）
                    const checkPaymentStatus = setInterval(async () => {
                        checkCount++;
                        try {
                            console.log(`检查支付状态 (${checkCount}/${maxChecks})...`);
                            
                            // 检查支付状态
                            const statusResponse = await fetch(`/api/payment/status/${orderNo}`);
                            const statusData = await statusResponse.json();
                            
                            console.log('支付状态响应:', statusData);
                            
                            if (statusData.code === 200 && statusData.data) {
                                const paymentStatus = statusData.data.status;
                                
                                if (paymentStatus === 'TRADE_SUCCESS' || paymentStatus === 'TRADE_FINISHED') {
                                    // 支付成功
                                    clearInterval(checkPaymentStatus);
                                    if (payWindow && !payWindow.closed) {
                                        payWindow.close();
                                    }
                                    
                                    // 显示支付成功通知
                                    showNotification('支付成功！正在激活课程...', 'success');
                                    
                                    // 激活订阅 - 重试机制
                                    let activateSuccess = false;
                                    let retryCount = 0;
                                    const maxRetries = 3;
                                    
                                    while (!activateSuccess && retryCount < maxRetries) {
                                        const activateResponse = await activateSubscription(orderNo);
                                        
                                        if (activateResponse.success) {
                                            activateSuccess = true;
                                            showNotification('课程已成功解锁！', 'success');
                                            
                                            // 立即显示成功弹窗
                                            showSuccessModal();
                                            
                                            // 返回成功结果
                                            resolve({
                                                success: true,
                                                data: {
                                                    transactionId: statusData.data.tradeNo || generateTransactionId(),
                                                    paymentMethod: 'alipay',
                                                    amount: paymentData.amount,
                                                    orderNo: orderNo
                                                }
                                            });
                                            return; // 确保退出循环
                                        } else {
                                            retryCount++;
                                            if (retryCount < maxRetries) {
                                                showNotification(`激活中...（第${retryCount}次尝试）`, 'info');
                                                // 等待2秒后重试
                                                await new Promise(resolve => setTimeout(resolve, 2000));
                                            }
                                        }
                                    }
                                    
                                    if (!activateSuccess) {
                                        // 即使激活失败，也显示支付成功（因为支付确实成功了）
                                        showNotification('支付成功！课程激活中，请稍后刷新页面', 'warning');
                                        showSuccessModal();
                                        
                                        resolve({
                                            success: true,
                                            data: {
                                                transactionId: statusData.data.tradeNo || generateTransactionId(),
                                                paymentMethod: 'alipay',
                                                amount: paymentData.amount,
                                                orderNo: orderNo
                                            }
                                        });
                                    }
                                } else if (paymentStatus === 'TRADE_CLOSED') {
                                    // 支付失败或取消
                                    clearInterval(checkPaymentStatus);
                                    if (payWindow && !payWindow.closed) {
                                        payWindow.close();
                                    }
                                    reject(new Error('支付已取消或失败'));
                                }
                            }
                            
                            // 检查是否超过最大检查次数
                            if (checkCount >= maxChecks) {
                                clearInterval(checkPaymentStatus);
                                if (payWindow && !payWindow.closed) {
                                    payWindow.close();
                                }
                                reject(new Error('支付超时，请检查订单状态'));
                            }
                            
                            // 检查窗口是否被用户关闭
                            if (payWindow && payWindow.closed) {
                                clearInterval(checkPaymentStatus);
                                console.log('支付窗口已关闭，继续检查支付状态...');
                                // 继续检查几次，因为用户可能已经完成支付
                                setTimeout(() => {
                                    clearInterval(checkPaymentStatus);
                                    reject(new Error('支付窗口已关闭'));
                                }, 10000); // 再检查10秒
                            }
                        } catch (error) {
                            console.error('检查支付状态失败:', error);
                        }
                    }, 2000); // 每2秒检查一次
                    
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
        // 获取URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'course';
        let courseId = urlParams.get('courseId') || 1;
        
        // 如果是课程包，需要获取实际的课程ID（不是包ID）
        // 从payment页面传来的courseId，如果type=bundle，courseId可能是1（包ID）
        // 但用户是从具体课程页面过来的，所以需要原始课程ID
        if (type === 'bundle' && courseId === '1') {
            // 尝试从其他地方获取原始课程ID
            courseId = (courseData && courseData.id) || orderData.courseId || 1;
        }
        
        window.location.href = `study.html?courseId=${courseId}`;
    }, 1000);
}

// 返回课程详情页面
function backToCourse() {
    hideSuccessModal();
    showNotification('正在返回课程页面...', 'info');
    
    setTimeout(() => {
        // 获取URL参数以判断订阅类型
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'course';
        const originalCourseId = urlParams.get('courseId') || 1;
        
        // 如果是课程包，跳转到原始课程页面（已解锁）
        // 如果是单个课程，也跳转到该课程页面
        window.location.href = `course-detail.html?id=${type === 'bundle' ? originalCourseId : originalCourseId}`;
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

        // 从URL参数获取类型
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'course';
        
        // 根据类型决定订阅类型
        let subscribableType = 'course';
        let subscribableId;
        
        if (type === 'bundle') {
            subscribableType = 'bundle';
            // 使用bundleId参数，优先使用URL参数，其次使用orderData中的bundleId
            subscribableId = urlParams.get('bundleId') || urlParams.get('id') || orderData?.bundleId || 1;
        } else {
            // 课程订阅，优先使用courseData.id，其次URL参数，最后orderData
            subscribableId = courseData?.id || urlParams.get('courseId') || urlParams.get('id') || orderData?.courseId || 1;
        }

        console.log('创建订阅订单:', { subscribableType, subscribableId, type });

        const response = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: new URLSearchParams({
                subscribableType: subscribableType,
                subscribableId: subscribableId,
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
        console.log('开始激活订阅，订单号:', orderNo);
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
        console.log('激活订阅响应:', data);
        
        return {
            success: data.code === 200 || data.success === true,
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

// 处理课程包支付
// 加载课程包支付
async function loadBundlePayment(bundleId) {
    console.log('加载课程包支付:', bundleId);
    
    try {
        // 从API获取课程包详情
        const response = await fetch(`/api/courses/bundles/${bundleId}`);
        if (!response.ok) {
            throw new Error('获取课程包信息失败');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '获取课程包信息失败');
        }
        
        const bundleData = result.data;
        console.log('课程包数据:', bundleData);
        
        // 设置订单数据，使用实际的价格
        orderData = {
            orderId: generateOrderId(),
            bundleId: bundleId,
            bundleName: bundleData.title || '课程包',
            bundleDescription: bundleData.description || '包含多门精品课程',
            type: 'bundle',
            price: parseFloat(bundleData.price) || 0,
            originalPrice: parseFloat(bundleData.originalPrice || bundleData.price) || 0,
            courseCount: bundleData.courseCount || 0
        };
        
        // 更新页面显示
        updateBundleDisplay();
        
        // 更新金额
        originalAmount = orderData.originalPrice;
        currentAmount = orderData.price;
        updatePaymentAmount();
        
        // 如果是免费课程包
        if (orderData.price === 0) {
            handleFreeBundle();
        }
        
    } catch (error) {
        console.error('加载课程包失败:', error);
        showNotification('加载课程包信息失败: ' + error.message, 'error');
        
        // 使用备用数据或跳转
        setTimeout(() => {
            window.location.href = 'courses.html';
        }, 2000);
    }
}

// 更新课程包显示
function updateBundleDisplay() {
    // 更新订单详情
    const orderDetails = document.querySelector('.order-details');
    if (orderDetails) {
        const discount = orderData.originalPrice - orderData.price;
        const discountPercent = orderData.originalPrice > 0 ? 
            Math.round((discount / orderData.originalPrice) * 100) : 0;
        
        orderDetails.innerHTML = `
            <div class="order-item">
                <div class="item-info">
                    <h3 class="item-name">🎁 ${orderData.bundleName}</h3>
                    <p class="item-desc">${orderData.bundleDescription}</p>
                    <div class="item-meta">
                        <span class="meta-tag">包含${orderData.courseCount}门课程</span>
                        <span class="meta-tag">超值套餐</span>
                        ${discountPercent > 0 ? `<span class="meta-tag discount">省${discountPercent}%</span>` : ''}
                    </div>
                </div>
                <div class="item-price">
                    ${orderData.originalPrice > orderData.price ? 
                        `<span class="price-original">¥${orderData.originalPrice.toFixed(2)}</span>` : ''}
                    <span class="price-current">¥${orderData.price.toFixed(2)}</span>
                </div>
            </div>
        `;
    }
    
    // 更新订单汇总
    const orderSummary = document.querySelector('.order-summary');
    if (orderSummary) {
        const summaryItems = orderSummary.querySelector('.summary-items');
        if (summaryItems) {
            const discount = orderData.originalPrice - orderData.price;
            summaryItems.innerHTML = `
                <div class="summary-item">
                    <span>课程包原价</span>
                    <span>¥${orderData.originalPrice.toFixed(2)}</span>
                </div>
                ${discount > 0 ? `
                <div class="summary-item">
                    <span>限时优惠</span>
                    <span class="text-danger">-¥${discount.toFixed(2)}</span>
                </div>
                ` : ''}
            `;
        }
        
        // 更新总金额
        const summaryTotal = orderSummary.querySelector('.summary-total');
        if (summaryTotal) {
            const totalAmount = summaryTotal.querySelector('.total-amount');
            if (totalAmount) {
                totalAmount.textContent = `¥${orderData.price.toFixed(2)}`;
            }
        }
    }
    
    // 更新支付按钮金额
    const payAmountElement = document.querySelector('.pay-amount');
    if (payAmountElement) {
        payAmountElement.textContent = `¥${orderData.price.toFixed(2)}`;
    }
    
    // 更新顶部总金额显示
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
        totalAmountElement.textContent = `¥${orderData.price.toFixed(2)}`;
    }
}

// 修改支付处理以支持课程包
const originalProcessPay = window.processPay;
window.processPay = async function() {
    // 如果是课程包支付
    if (orderData.type === 'bundle') {
        return processBundlePayment();
    }
    // 否则使用原有的支付流程
    return originalProcessPay();
};

// 处理课程包支付
async function processBundlePayment() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('请先登录', 'error');
            window.location.href = 'login.html';
            return;
        }
        
        // 显示加载状态
        const payButton = document.querySelector('.btn-pay');
        if (payButton) {
            payButton.classList.add('loading');
            payButton.disabled = true;
        }
        
        // 构建API基础URL
        const apiBase = '/api';
        
        // 创建课程包订单
        const orderResponse = await fetch(`${apiBase}/orders/bundle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bundleId: orderData.bundleId,
                paymentMethod: selectedMethod || 'alipay'
            })
        });
        
        const orderResult = await orderResponse.json();
        
        if (!orderResult.success) {
            throw new Error(orderResult.message || '创建订单失败');
        }
        
        // 如果需要支付
        if (orderResult.data && orderResult.data.needPayment) {
            const order = orderResult.data.order;
            
            // 调用支付接口
            const paymentParams = new URLSearchParams({
                orderNo: order.orderNo,
                amount: order.finalAmount.toString(),
                subject: `课程包订阅 - ${orderData.bundleName}`,
                body: orderData.bundleDescription || '课程包订阅'
            });
            
            const paymentResponse = await fetch(`${apiBase}/payment/alipay/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: paymentParams.toString()
            });
            
            const paymentResult = await paymentResponse.json();
            
            if (paymentResult.success && paymentResult.data && paymentResult.data.form) {
                // 创建支付表单并提交
                const div = document.createElement('div');
                div.innerHTML = paymentResult.data.form;
                document.body.appendChild(div);
                const form = div.querySelector('form');
                if (form) {
                    form.submit();
                }
            } else {
                throw new Error(paymentResult.message || '创建支付失败');
            }
        } else {
            // 免费课程包，直接激活成功
            showNotification('课程包激活成功！', 'success');
            setTimeout(() => {
                window.location.href = 'courses.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('支付失败:', error);
        showNotification(error.message || '支付失败，请重试', 'error');
        
        // 恢复按钮状态
        const payButton = document.querySelector('.btn-pay');
        if (payButton) {
            payButton.classList.remove('loading');
            payButton.disabled = false;
        }
    }
}

// 显示所有优惠券（已禁用）
function showAllCoupons() {
    showNotification('优惠券功能暂时关闭', 'info');
}
