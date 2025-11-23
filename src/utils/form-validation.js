/**
 * Form Validation Utility
 * Provides client-side form validation for registration, login, and other forms
 * Last updated: 2025-09-30
 */

// Validation rules
const VALIDATION_RULES = {
    username: {
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_]+$/,
        patternMessage: '用户名只能包含字母、数字和下划线'
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        patternMessage: '请输入有效的邮箱地址'
    },
    phone: {
        pattern: /^1[3-9]\d{9}$/,
        patternMessage: '请输入有效的11位手机号码'
    },
    password: {
        minLength: 6,
        maxLength: 32,
        patternMessage: '密码长度应在6-32个字符之间'
    },
    nickname: {
        minLength: 2,
        maxLength: 20,
        patternMessage: '昵称长度应在2-20个字符之间'
    }
};

/**
 * Validate a field based on validation rules
 * @param {HTMLInputElement} field - Input field
 * @param {Object} customRules - Custom validation rules
 * @returns {Object} {valid: boolean, message: string}
 */
function validateField(field, customRules = {}) {
    const value = field.value.trim();
    const fieldType = field.dataset.validate || field.type;
    const rules = { ...VALIDATION_RULES[fieldType], ...customRules };

    // Required check
    if (rules.required !== false && !value) {
        return {
            valid: false,
            message: rules.requiredMessage || `${field.placeholder || '此字段'}不能为空`
        };
    }

    // Skip other validations if empty and not required
    if (!value) {
        return { valid: true, message: '' };
    }

    // Min length check
    if (rules.minLength && value.length < rules.minLength) {
        return {
            valid: false,
            message: rules.minLengthMessage || `至少需要${rules.minLength}个字符`
        };
    }

    // Max length check
    if (rules.maxLength && value.length > rules.maxLength) {
        return {
            valid: false,
            message: rules.maxLengthMessage || `最多${rules.maxLength}个字符`
        };
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
        return {
            valid: false,
            message: rules.patternMessage || '格式不正确'
        };
    }

    // Custom validation function
    if (rules.custom && typeof rules.custom === 'function') {
        const result = rules.custom(value, field);
        if (result !== true) {
            return {
                valid: false,
                message: typeof result === 'string' ? result : '验证失败'
            };
        }
    }

    // Password confirmation check
    if (fieldType === 'password-confirm') {
        const passwordField = document.querySelector('[data-validate="password"]') ||
                              document.querySelector('input[type="password"]:not([data-validate="password-confirm"])');
        if (passwordField && value !== passwordField.value) {
            return {
                valid: false,
                message: '两次输入的密码不一致'
            };
        }
    }

    return { valid: true, message: '' };
}

/**
 * Show validation error on field
 * @param {HTMLInputElement} field - Input field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    // Add error class to field
    field.classList.add('error', 'border-red-500');
    field.classList.remove('border-gray-300');

    // Find or create error message element
    let errorEl = field.parentElement.querySelector('.field-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'field-error text-red-500 text-sm mt-1';
        field.parentElement.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

/**
 * Hide validation error on field
 * @param {HTMLInputElement} field - Input field
 */
function hideFieldError(field) {
    // Remove error class from field
    field.classList.remove('error', 'border-red-500');
    field.classList.add('border-gray-300');

    // Hide error message
    const errorEl = field.parentElement.querySelector('.field-error');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if form is valid
 */
function validateForm(form) {
    const fields = form.querySelectorAll('[data-validate], input[required]');
    let isValid = true;
    let firstInvalidField = null;

    fields.forEach(field => {
        const result = validateField(field);
        if (!result.valid) {
            showFieldError(field, result.message);
            isValid = false;
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            hideFieldError(field);
        }
    });

    // Focus first invalid field
    if (firstInvalidField) {
        firstInvalidField.focus();
    }

    return isValid;
}

/**
 * Add real-time validation to a field
 * @param {HTMLInputElement} field - Input field
 * @param {Object} customRules - Custom validation rules
 */
function addFieldValidation(field, customRules = {}) {
    // Validate on blur
    field.addEventListener('blur', () => {
        const result = validateField(field, customRules);
        if (!result.valid) {
            showFieldError(field, result.message);
        }
    });

    // Hide error on input
    field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
            hideFieldError(field);
        }
    });
}

/**
 * Initialize form validation
 * @param {string|HTMLFormElement} formSelector - Form selector or element
 * @param {Object} options - Validation options
 */
function initFormValidation(formSelector, options = {}) {
    const form = typeof formSelector === 'string'
        ? document.querySelector(formSelector)
        : formSelector;

    if (!form) {
        console.warn('[Form Validation] Form not found:', formSelector);
        return;
    }

    // Add validation to all fields with data-validate attribute
    const fields = form.querySelectorAll('[data-validate], input[required]');
    fields.forEach(field => {
        addFieldValidation(field, options[field.name] || {});
    });

    // Validate on form submit
    form.addEventListener('submit', (e) => {
        if (options.preventSubmit !== false) {
            e.preventDefault();
        }

        const isValid = validateForm(form);

        if (isValid && options.onSubmit) {
            options.onSubmit(e, new FormData(form));
        } else if (!isValid && options.onError) {
            options.onError(e);
        }
    });

    return {
        validate: () => validateForm(form),
        reset: () => {
            form.reset();
            fields.forEach(field => hideFieldError(field));
        }
    };
}

/**
 * Add validation styles to document
 */
function addValidationStyles() {
    if (document.getElementById('form-validation-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'form-validation-styles';
    style.textContent = `
        .field-error {
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: none;
        }

        input.error,
        textarea.error,
        select.error {
            border-color: #ef4444 !important;
        }

        input.error:focus,
        textarea.error:focus,
        select.error:focus {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }

        .field-success {
            border-color: #10b981 !important;
        }

        .field-success:focus {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addValidationStyles);
} else {
    addValidationStyles();
}

// Make utilities globally available
if (typeof window !== 'undefined') {
    window.formValidation = {
        validateField,
        showFieldError,
        hideFieldError,
        validateForm,
        addFieldValidation,
        initFormValidation,
        VALIDATION_RULES
    };
}

export {
    validateField,
    showFieldError,
    hideFieldError,
    validateForm,
    addFieldValidation,
    initFormValidation,
    VALIDATION_RULES
};

export default {
    validateField,
    showFieldError,
    hideFieldError,
    validateForm,
    addFieldValidation,
    initFormValidation,
    VALIDATION_RULES
};