/**
 * 防抖和节流工具函数
 * 用于优化前端性能，减少不必要的函数调用
 */

/**
 * 防抖函数 (Debounce)
 * 在事件触发n秒后才执行回调，如果在这n秒内又触发了事件，则重新计时
 * 适用场景：输入框搜索、窗口resize等
 *
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 *
 * @example
 * const debouncedSearch = debounce((keyword) => {
 *   console.log('搜索：', keyword);
 * }, 300);
 *
 * searchInput.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * 节流函数 (Throttle)
 * 限制函数在一定时间内只能执行一次
 * 适用场景：滚动事件、鼠标移动、按钮点击等
 *
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('滚动位置：', window.scrollY);
 * }, 200);
 *
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle(func, limit = 200) {
  let inThrottle;
  let lastResult;

  return function executedFunction(...args) {
    const context = this;

    if (!inThrottle) {
      lastResult = func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * 增强版节流函数 - 支持首次和末次调用
 *
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在开始时调用
 * @param {boolean} options.trailing - 是否在结束时调用
 * @returns {Function} 节流后的函数
 */
export function throttleAdvanced(func, limit = 200, options = {}) {
  let timeout;
  let previous = 0;
  let result;

  const { leading = true, trailing = true } = options;

  return function executedFunction(...args) {
    const context = this;
    const now = Date.now();

    if (!previous && !leading) previous = now;

    const remaining = limit - (now - previous);

    if (remaining <= 0 || remaining > limit) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      result = func.apply(context, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        result = func.apply(context, args);
      }, remaining);
    }

    return result;
  };
}

/**
 * 请求动画帧节流
 * 使用requestAnimationFrame来节流，确保在浏览器重绘前执行
 * 适用于动画和视觉更新
 *
 * @param {Function} func - 要执行的函数
 * @returns {Function} 节流后的函数
 */
export function rafThrottle(func) {
  let rafId = null;

  return function executedFunction(...args) {
    const context = this;

    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      func.apply(context, args);
      rafId = null;
    });
  };
}

/**
 * 函数去抖动 - 仅执行最后一次
 * 适用于连续触发但只需要最后结果的场景
 *
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 处理后的函数
 */
export function debounceLeading(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 批量执行优化
 * 将多次调用合并为一次批量执行
 *
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 批量执行函数
 */
export function batchExecute(func, wait = 100) {
  let queue = [];
  let timeout = null;

  return function executedFunction(...args) {
    queue.push(args);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      const allArgs = queue;
      queue = [];
      func(allArgs);
    }, wait);
  };
}

/**
 * 延迟执行（Promise版本）
 *
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} Promise对象
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建防抖的异步函数
 *
 * @param {Function} asyncFunc - 异步函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的异步函数
 */
export function debounceAsync(asyncFunc, wait = 300) {
  const debounced = debounce(asyncFunc, wait);

  return async function executedFunction(...args) {
    return await debounced.apply(this, args);
  };
}

/**
 * 使用示例
 */

// 1. 搜索输入防抖
// const searchInput = document.getElementById('searchInput');
// const debouncedSearch = debounce((keyword) => {
//   fetch(`/api/search?q=${keyword}`)
//     .then(res => res.json())
//     .then(data => console.log(data));
// }, 500);
// searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));

// 2. 滚动事件节流
// const throttledScroll = throttle(() => {
//   const scrollTop = window.scrollY;
//   console.log('Scroll position:', scrollTop);
// }, 200);
// window.addEventListener('scroll', throttledScroll);

// 3. 窗口大小调整
// const throttledResize = rafThrottle(() => {
//   console.log('Window resized:', window.innerWidth, window.innerHeight);
// });
// window.addEventListener('resize', throttledResize);

// 4. 批量提交表单数据
// const batchSubmit = batchExecute((dataArray) => {
//   fetch('/api/batch-submit', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ items: dataArray })
//   });
// }, 1000);

export default {
  debounce,
  throttle,
  throttleAdvanced,
  rafThrottle,
  debounceLeading,
  batchExecute,
  delay,
  debounceAsync
};
