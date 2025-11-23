/**
 * UI Helpers - Common UI utilities for all pages
 * Provides easy-to-use wrappers for loading and notifications
 * Last updated: 2025-09-30
 */

// Ensure dependencies are loaded
if (typeof window.loading === 'undefined') {
    console.warn('[UI-Helpers] Loading utility not found. Loading states disabled.');
}

if (typeof window.notification === 'undefined') {
    console.warn('[UI-Helpers] Notification utility not found. Notifications disabled.');
}

/**
 * Show loading overlay on element
 * @param {HTMLElement|string} target - Element or selector
 * @param {string} text - Optional loading text
 * @returns {string} Loader ID
 */
export function showLoading(target, text = '') {
    if (window.loading) {
        return window.loading.show(target, { text, dark: isDarkTheme() });
    }
    return null;
}

/**
 * Hide loading overlay
 * @param {string|HTMLElement} targetOrId - Loader ID or element
 */
export function hideLoading(targetOrId) {
    if (window.loading) {
        window.loading.hide(targetOrId);
    }
}

/**
 * Show loading skeleton
 * @param {HTMLElement|string} target - Element or selector
 * @param {Object} options - Options {type, count}
 */
export function showSkeleton(target, options = {}) {
    if (window.loading) {
        window.loading.showSkeleton(target, {
            ...options,
            dark: isDarkTheme()
        });
    }
}

/**
 * Hide loading skeleton
 * @param {HTMLElement|string} target - Element or selector
 */
export function hideSkeleton(target) {
    if (window.loading) {
        window.loading.hideSkeleton(target);
    }
}

/**
 * Show button loading state
 * @param {HTMLElement|string} button - Button element or selector
 */
export function showButtonLoading(button) {
    if (window.loading) {
        window.loading.showButton(button);
    }
}

/**
 * Hide button loading state
 * @param {HTMLElement|string} button - Button element or selector
 */
export function hideButtonLoading(button) {
    if (window.loading) {
        window.loading.hideButton(button);
    }
}

/**
 * Show full page loading
 * @param {string} text - Optional loading text
 */
export function showPageLoading(text = '加载中') {
    if (window.loading) {
        window.loading.showPage({ text, dark: isDarkTheme() });
    }
}

/**
 * Hide full page loading
 */
export function hidePageLoading() {
    if (window.loading) {
        window.loading.hidePage();
    }
}

/**
 * Wrap async function with loading state
 * @param {Function} fn - Async function to wrap
 * @param {HTMLElement|string} target - Loading target
 * @param {Object} options - Loading options
 * @returns {Promise<any>}
 */
export async function withLoading(fn, target, options = {}) {
    if (window.loading) {
        return window.loading.wrap(fn, target, options);
    }
    return fn();
}

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {string} title - Optional title
 */
export function showSuccess(message, title = '成功') {
    if (window.notification) {
        window.notification.success(message, title);
    }
}

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {string} title - Optional title
 */
export function showError(message, title = '错误') {
    if (window.notification) {
        window.notification.error(message, title);
    }
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {string} title - Optional title
 */
export function showWarning(message, title = '警告') {
    if (window.notification) {
        window.notification.warning(message, title);
    }
}

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {string} title - Optional title
 */
export function showInfo(message, title = '提示') {
    if (window.notification) {
        window.notification.info(message, title);
    }
}

/**
 * Handle API error with user-friendly message
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default error message
 */
export function handleApiError(error, defaultMessage = '操作失败，请重试') {
    console.error('[API Error]', error);

    let message = defaultMessage;

    if (error.response) {
        // Error with response from server
        const status = error.status || error.response?.status;

        switch (status) {
            case 400:
                message = error.message || '请求参数错误';
                break;
            case 401:
                message = '登录已过期，请重新登录';
                setTimeout(() => {
                    window.location.href = '/src/pages/login.html';
                }, 1500);
                break;
            case 403:
                message = '没有访问权限';
                break;
            case 404:
                message = '请求的资源未找到';
                break;
            case 429:
                message = '请求过于频繁，请稍后再试';
                break;
            case 500:
                message = '服务器内部错误';
                break;
            case 502:
                message = '服务器暂时不可用';
                break;
            case 503:
                message = '服务器维护中';
                break;
            default:
                message = error.message || defaultMessage;
        }
    } else if (error.message) {
        // Error with message but no response
        message = error.message;
    }

    showError(message);
}

/**
 * Handle form submission with loading state
 * @param {HTMLFormElement|string} form - Form element or selector
 * @param {Function} submitFn - Async submit function
 * @param {Object} options - Options
 * @returns {Promise<any>}
 */
export async function handleFormSubmit(form, submitFn, options = {}) {
    const formElement = typeof form === 'string' ? document.querySelector(form) : form;
    if (!formElement) {
        console.error('[UI-Helpers] Form not found');
        return;
    }

    const submitButton = options.submitButton || formElement.querySelector('[type="submit"]');

    try {
        if (submitButton) {
            showButtonLoading(submitButton);
        }

        const result = await submitFn();

        if (options.successMessage) {
            showSuccess(options.successMessage);
        }

        return result;
    } catch (error) {
        handleApiError(error, options.errorMessage || '提交失败');
        throw error;
    } finally {
        if (submitButton) {
            hideButtonLoading(submitButton);
        }
    }
}

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function}
 */
export function throttle(fn, limit = 300) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Check if dark theme is active
 * @returns {boolean}
 */
function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (YYYY-MM-DD, YYYY-MM-DD HH:mm:ss)
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * Validate form field
 * @param {HTMLInputElement} field - Input field
 * @param {Object} rules - Validation rules
 * @returns {Object} {valid: boolean, message: string}
 */
export function validateField(field, rules = {}) {
    const value = field.value.trim();

    if (rules.required && !value) {
        return { valid: false, message: rules.requiredMessage || '此字段为必填项' };
    }

    if (rules.minLength && value.length < rules.minLength) {
        return { valid: false, message: rules.minLengthMessage || `至少需要${rules.minLength}个字符` };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
        return { valid: false, message: rules.maxLengthMessage || `最多${rules.maxLength}个字符` };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
        return { valid: false, message: rules.patternMessage || '格式不正确' };
    }

    if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { valid: false, message: '请输入有效的邮箱地址' };
    }

    if (rules.phone && !/^1[3-9]\d{9}$/.test(value)) {
        return { valid: false, message: '请输入有效的手机号码' };
    }

    if (rules.custom && typeof rules.custom === 'function') {
        const result = rules.custom(value);
        if (result !== true) {
            return { valid: false, message: result || '验证失败' };
        }
    }

    return { valid: true, message: '' };
}

/**
 * Show validation error on field
 * @param {HTMLInputElement} field - Input field
 * @param {string} message - Error message
 */
export function showFieldError(field, message) {
    field.classList.add('error');

    let errorEl = field.nextElementSibling;
    if (!errorEl || !errorEl.classList.contains('field-error')) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        field.parentNode.insertBefore(errorEl, field.nextSibling);
    }

    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

/**
 * Hide validation error on field
 * @param {HTMLInputElement} field - Input field
 */
export function hideFieldError(field) {
    field.classList.remove('error');

    const errorEl = field.nextElementSibling;
    if (errorEl && errorEl.classList.contains('field-error')) {
        errorEl.style.display = 'none';
    }
}

// Make utilities globally available
if (typeof window !== 'undefined') {
    window.uiHelpers = {
        showLoading,
        hideLoading,
        showSkeleton,
        hideSkeleton,
        showButtonLoading,
        hideButtonLoading,
        showPageLoading,
        hidePageLoading,
        withLoading,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        handleApiError,
        handleFormSubmit,
        debounce,
        throttle,
        formatDate,
        validateField,
        showFieldError,
        hideFieldError
    };
}

export default {
    showLoading,
    hideLoading,
    showSkeleton,
    hideSkeleton,
    showButtonLoading,
    hideButtonLoading,
    showPageLoading,
    hidePageLoading,
    withLoading,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    handleApiError,
    handleFormSubmit,
    debounce,
    throttle,
    formatDate,
    validateField,
    showFieldError,
    hideFieldError
};