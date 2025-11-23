# Quick Reference Guide - Frontend Utilities

## Import Scripts (Add to every page)

```html
<script src="../utils/loading.js"></script>
<script src="../utils/notification.js"></script>
<script src="../utils/ui-helpers.js"></script>
<script src="../utils/form-validation.js"></script> <!-- Only if using forms -->
```

## Loading States

### Show Skeleton Loading
```javascript
// Card skeleton (for course grids, etc.)
window.uiHelpers.showSkeleton('#container', { type: 'card', count: 6 });

// List skeleton (for activity lists, etc.)
window.uiHelpers.showSkeleton('#container', { type: 'list', count: 5 });

// Hide skeleton
window.uiHelpers.hideSkeleton('#container');
```

### Button Loading
```javascript
const button = document.querySelector('#submitBtn');

// Show loading
window.uiHelpers.showButtonLoading(button);

// Hide loading
window.uiHelpers.hideButtonLoading(button);
```

### Page Loading (Full Screen)
```javascript
// Show
window.uiHelpers.showPageLoading('正在加载...');

// Hide
window.uiHelpers.hidePageLoading();
```

## Notifications

```javascript
// Success
window.uiHelpers.showSuccess('操作成功！');

// Error
window.uiHelpers.showError('操作失败，请重试');

// Warning
window.uiHelpers.showWarning('请注意：....');

// Info
window.uiHelpers.showInfo('提示信息');

// Handle API errors automatically
window.uiHelpers.handleApiError(error, '默认错误消息');
```

## Form Validation

### HTML Setup
```html
<form id="myForm">
    <input type="text" name="username" data-validate="username" placeholder="用户名" required>
    <input type="email" name="email" data-validate="email" placeholder="邮箱" required>
    <input type="password" name="password" data-validate="password" placeholder="密码" required>
    <input type="password" name="confirmPassword" data-validate="password-confirm" placeholder="确认密码" required>
    <button type="submit">提交</button>
</form>
```

### JavaScript Setup
```javascript
window.formValidation.initFormValidation('#myForm', {
    onSubmit: async (e, formData) => {
        // Form is valid, handle submission
        const data = Object.fromEntries(formData);
        console.log('Submitting:', data);
    }
});
```

## Complete Pattern Examples

### Pattern 1: Load Data with Skeleton
```javascript
async function loadCourses() {
    const container = document.getElementById('coursesGrid');

    // Show skeleton
    window.uiHelpers.showSkeleton(container, { type: 'card', count: 6 });

    try {
        const response = await fetch('/api/courses');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load');
        }

        // Render data
        container.innerHTML = data.map(course => createCourseCard(course)).join('');
    } catch (error) {
        window.uiHelpers.handleApiError(error, '加载课程失败');
    } finally {
        window.uiHelpers.hideSkeleton(container);
    }
}
```

### Pattern 2: Button Action with Loading
```javascript
async function handleEnroll(courseId) {
    const button = document.querySelector(`[data-course="${courseId}"] .enroll-btn`);

    window.uiHelpers.showButtonLoading(button);

    try {
        const response = await fetch(`/api/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        window.uiHelpers.showSuccess('报名成功！');
    } catch (error) {
        window.uiHelpers.handleApiError(error, '报名失败');
    } finally {
        window.uiHelpers.hideButtonLoading(button);
    }
}
```

### Pattern 3: Form Submission with Validation
```javascript
// Initialize form with validation and loading
window.formValidation.initFormValidation('#loginForm', {
    onSubmit: async (e, formData) => {
        const button = document.querySelector('#loginForm button[type="submit"]');

        window.uiHelpers.showButtonLoading(button);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            window.uiHelpers.showSuccess('登录成功！');

            // Save token and redirect
            localStorage.setItem('token', data.data.token);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            window.uiHelpers.handleApiError(error, '登录失败');
        } finally {
            window.uiHelpers.hideButtonLoading(button);
        }
    }
});
```

### Pattern 4: Page Load with Multiple Data Sources
```javascript
async function initPage() {
    // Show page loading
    window.uiHelpers.showPageLoading('正在加载页面...');

    try {
        // Load multiple data sources in parallel
        const [userData, coursesData, statsData] = await Promise.all([
            fetch('/api/user/profile').then(r => r.json()),
            fetch('/api/user/courses').then(r => r.json()),
            fetch('/api/user/stats').then(r => r.json())
        ]);

        // Render data
        renderUserInfo(userData.data);
        renderCourses(coursesData.data);
        renderStats(statsData.data);

    } catch (error) {
        window.uiHelpers.handleApiError(error, '页面加载失败');
    } finally {
        window.uiHelpers.hidePageLoading();
    }
}

// Call when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
```

## Available Validation Types

Use with `data-validate` attribute:

- `username` - 3-20 characters, alphanumeric and underscore
- `email` - Valid email format
- `phone` - 11-digit Chinese phone number
- `password` - 6-32 characters
- `password-confirm` - Matches password field
- `nickname` - 2-20 characters

## Utility Functions

```javascript
// Debounce function calls
const debouncedSearch = window.uiHelpers.debounce((query) => {
    searchCourses(query);
}, 500);

// Throttle function calls
const throttledScroll = window.uiHelpers.throttle(() => {
    handleScroll();
}, 100);

// Format date
const formatted = window.uiHelpers.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
```

## Error Status Codes Handled

The `handleApiError` function automatically provides user-friendly messages for:

- **400** - Bad Request: "请求参数错误"
- **401** - Unauthorized: "登录已过期，请重新登录" (auto-redirects to login)
- **403** - Forbidden: "没有访问权限"
- **404** - Not Found: "请求的资源未找到"
- **429** - Too Many Requests: "请求过于频繁，请稍后再试"
- **500** - Internal Server Error: "服务器内部错误"
- **502** - Bad Gateway: "服务器暂时不可用"
- **503** - Service Unavailable: "服务器维护中"

## Dark Theme Support

All components automatically detect and support dark theme:

```javascript
// Check if dark theme is active
const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

// Components automatically use dark mode when data-theme="dark"
```

## Best Practices

1. **Always use try-catch-finally** for async operations
2. **Always hide loading states in finally blocks**
3. **Use handleApiError for consistent error messages**
4. **Show skeleton loaders for initial page loads**
5. **Use button loading for user actions**
6. **Validate forms before submission**
7. **Provide success feedback for all actions**

## Common Pitfalls

❌ **Don't do this:**
```javascript
// Missing finally block
async function loadData() {
    window.uiHelpers.showSkeleton('#container');
    const data = await fetch('/api/data');
    window.uiHelpers.hideSkeleton('#container'); // Won't run if error occurs!
}
```

✅ **Do this:**
```javascript
async function loadData() {
    window.uiHelpers.showSkeleton('#container');
    try {
        const data = await fetch('/api/data');
        renderData(data);
    } catch (error) {
        window.uiHelpers.handleApiError(error);
    } finally {
        window.uiHelpers.hideSkeleton('#container'); // Always runs
    }
}
```

## Testing Checklist

For each page you update:

- [ ] Loading states appear during data fetch
- [ ] Loading states disappear after completion
- [ ] Errors show notifications (not alerts or console.error)
- [ ] Buttons show loading spinner during actions
- [ ] Form validation works in real-time
- [ ] Success actions show confirmation
- [ ] Works in dark mode
- [ ] Works on mobile devices
- [ ] No console errors

## Need Help?

See the full documentation in `IMPLEMENTATION_SUMMARY.md` for detailed examples and integration patterns.