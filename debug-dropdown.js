// 下拉菜单调试脚本
// 在浏览器控制台运行此脚本来测试下拉菜单

console.log('=== 开始下拉菜单调试 ===');

// 1. 检查必要的元素
const elements = {
    container: document.querySelector('.user-menu-container'),
    userInfo: document.querySelector('.user-info'),
    dropdown: document.getElementById('userDropdown'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar')
};

console.log('元素检查:');
Object.entries(elements).forEach(([name, el]) => {
    console.log(`  ${name}: ${el ? '✅ 找到' : '❌ 未找到'}`);
});

// 2. 检查CSS样式
if (elements.dropdown) {
    const styles = window.getComputedStyle(elements.dropdown);
    console.log('\n下拉菜单CSS样式:');
    console.log('  opacity:', styles.opacity);
    console.log('  visibility:', styles.visibility);
    console.log('  z-index:', styles.zIndex);
    console.log('  position:', styles.position);
    console.log('  display:', styles.display);
}

// 3. 检查toggleUserMenu函数
console.log('\ntoggleUserMenu函数:', typeof window.toggleUserMenu);

// 4. 手动触发下拉菜单
if (elements.dropdown) {
    console.log('\n尝试手动显示下拉菜单...');
    elements.dropdown.classList.add('show');
    
    setTimeout(() => {
        const isVisible = elements.dropdown.classList.contains('show');
        const computedStyle = window.getComputedStyle(elements.dropdown);
        console.log('下拉菜单状态:');
        console.log('  has "show" class:', isVisible);
        console.log('  computed opacity:', computedStyle.opacity);
        console.log('  computed visibility:', computedStyle.visibility);
        
        if (isVisible && computedStyle.opacity === '1' && computedStyle.visibility === 'visible') {
            console.log('✅ 下拉菜单应该是可见的！');
        } else {
            console.log('❌ 下拉菜单仍然不可见，可能有CSS冲突');
        }
    }, 100);
}

// 5. 添加临时修复
console.log('\n应用临时修复...');
if (elements.dropdown) {
    // 强制显示下拉菜单用于测试
    elements.dropdown.style.cssText = `
        opacity: 1 !important;
        visibility: visible !important;
        transform: translateY(0) !important;
        display: block !important;
    `;
    console.log('✅ 已强制显示下拉菜单（仅用于测试）');
    
    // 3秒后恢复
    setTimeout(() => {
        elements.dropdown.style.cssText = '';
        elements.dropdown.classList.remove('show');
        console.log('已恢复原始状态');
    }, 3000);
}

console.log('\n=== 调试完成 ===');
console.log('如果下拉菜单在强制显示后出现，说明CSS正常，问题在于toggleUserMenu函数');
console.log('如果下拉菜单仍然不出现，说明有其他CSS规则覆盖了样式');