/**
 * 图片懒加载工具
 * 使用 Intersection Observer API 实现高性能的图片懒加载
 */

/**
 * 创建懒加载观察器
 *
 * @param {Object} options - 配置选项
 * @param {string} options.rootMargin - 根边距，提前加载的距离
 * @param {number} options.threshold - 交叉比例阈值
 * @param {string} options.selector - 图片选择器
 * @param {string} options.dataAttribute - 数据属性名
 * @param {Function} options.onLoad - 加载完成回调
 * @param {Function} options.onError - 加载失败回调
 * @returns {Object} 懒加载实例
 *
 * @example
 * // HTML:
 * // <img class="lazy" data-src="image.jpg" src="placeholder.jpg" alt="描述">
 *
 * // JavaScript:
 * const lazyLoader = createLazyLoader({
 *   rootMargin: '50px',
 *   threshold: 0.01
 * });
 * lazyLoader.observe();
 */
export function createLazyLoader(options = {}) {
  const config = {
    rootMargin: options.rootMargin || '50px',
    threshold: options.threshold || 0.01,
    selector: options.selector || 'img[data-src], img[data-lazy]',
    dataAttribute: options.dataAttribute || 'src',
    onLoad: options.onLoad || null,
    onError: options.onError || null
  };

  let observer = null;

  /**
   * 加载图片
   */
  const loadImage = (img) => {
    const src = img.dataset.src || img.dataset.lazy;

    if (!src) return;

    // 创建新的Image对象用于预加载
    const imageLoader = new Image();

    imageLoader.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      img.classList.remove('loading');

      // 移除data属性
      delete img.dataset.src;
      delete img.dataset.lazy;

      if (config.onLoad) {
        config.onLoad(img);
      }
    };

    imageLoader.onerror = () => {
      img.classList.add('error');
      img.classList.remove('loading');

      if (config.onError) {
        config.onError(img);
      }
    };

    // 添加加载中类
    img.classList.add('loading');

    // 开始加载
    imageLoader.src = src;
  };

  /**
   * 创建观察器
   */
  const createObserver = () => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });
    }
  };

  /**
   * 开始观察
   */
  const observe = (container = document) => {
    if (!observer) {
      createObserver();
    }

    if (observer) {
      const images = container.querySelectorAll(config.selector);
      images.forEach(img => observer.observe(img));
    } else {
      // 降级方案：直接加载所有图片
      const images = container.querySelectorAll(config.selector);
      images.forEach(img => loadImage(img));
    }
  };

  /**
   * 停止观察
   */
  const disconnect = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  /**
   * 立即加载所有图片
   */
  const loadAll = (container = document) => {
    const images = container.querySelectorAll(config.selector);
    images.forEach(img => loadImage(img));
  };

  return {
    observe,
    disconnect,
    loadAll
  };
}

/**
 * 背景图片懒加载
 *
 * @param {Object} options - 配置选项
 * @returns {Object} 懒加载实例
 *
 * @example
 * // HTML:
 * // <div class="lazy-bg" data-bg="background.jpg"></div>
 *
 * // JavaScript:
 * const bgLazyLoader = createBackgroundLazyLoader();
 * bgLazyLoader.observe();
 */
export function createBackgroundLazyLoader(options = {}) {
  const config = {
    rootMargin: options.rootMargin || '50px',
    threshold: options.threshold || 0.01,
    selector: options.selector || '[data-bg]',
    onLoad: options.onLoad || null
  };

  let observer = null;

  const loadBackground = (element) => {
    const bgUrl = element.dataset.bg;

    if (!bgUrl) return;

    const img = new Image();

    img.onload = () => {
      element.style.backgroundImage = `url('${bgUrl}')`;
      element.classList.add('bg-loaded');
      element.classList.remove('bg-loading');
      delete element.dataset.bg;

      if (config.onLoad) {
        config.onLoad(element);
      }
    };

    element.classList.add('bg-loading');
    img.src = bgUrl;
  };

  const createObserver = () => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            loadBackground(element);
            observer.unobserve(element);
          }
        });
      }, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });
    }
  };

  const observe = (container = document) => {
    if (!observer) {
      createObserver();
    }

    if (observer) {
      const elements = container.querySelectorAll(config.selector);
      elements.forEach(el => observer.observe(el));
    } else {
      const elements = container.querySelectorAll(config.selector);
      elements.forEach(el => loadBackground(el));
    }
  };

  const disconnect = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  return {
    observe,
    disconnect
  };
}

/**
 * 响应式图片懒加载
 * 支持根据屏幕尺寸加载不同的图片
 *
 * @example
 * // HTML:
 * // <img class="lazy-responsive"
 * //      data-src-small="small.jpg"
 * //      data-src-medium="medium.jpg"
 * //      data-src-large="large.jpg"
 * //      alt="响应式图片">
 */
export function createResponsiveLazyLoader(options = {}) {
  const config = {
    rootMargin: options.rootMargin || '50px',
    threshold: options.threshold || 0.01,
    selector: options.selector || 'img[data-src-small]',
    breakpoints: options.breakpoints || {
      small: 640,
      medium: 1024,
      large: 1920
    },
    onLoad: options.onLoad || null
  };

  let observer = null;

  const getAppropriateSource = (img) => {
    const width = window.innerWidth;
    const { small, medium, large } = config.breakpoints;

    if (width <= small) {
      return img.dataset.srcSmall;
    } else if (width <= medium) {
      return img.dataset.srcMedium || img.dataset.srcSmall;
    } else if (width <= large) {
      return img.dataset.srcLarge || img.dataset.srcMedium || img.dataset.srcSmall;
    } else {
      return img.dataset.srcXlarge || img.dataset.srcLarge || img.dataset.srcMedium || img.dataset.srcSmall;
    }
  };

  const loadImage = (img) => {
    const src = getAppropriateSource(img);

    if (!src) return;

    const imageLoader = new Image();

    imageLoader.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      img.classList.remove('loading');

      if (config.onLoad) {
        config.onLoad(img);
      }
    };

    img.classList.add('loading');
    imageLoader.src = src;
  };

  const createObserver = () => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            loadImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });
    }
  };

  const observe = (container = document) => {
    if (!observer) {
      createObserver();
    }

    if (observer) {
      const images = container.querySelectorAll(config.selector);
      images.forEach(img => observer.observe(img));
    } else {
      const images = container.querySelectorAll(config.selector);
      images.forEach(img => loadImage(img));
    }
  };

  const disconnect = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  return {
    observe,
    disconnect
  };
}

/**
 * 全局初始化懒加载
 * 自动为页面上所有符合条件的图片启用懒加载
 */
export function initGlobalLazyLoad() {
  // 图片懒加载
  const imageLazyLoader = createLazyLoader({
    onLoad: (img) => {
      console.log('图片加载完成:', img.src);
    },
    onError: (img) => {
      console.error('图片加载失败:', img);
      // 设置默认图片
      img.src = '/images/placeholder.svg';
    }
  });

  // 背景图懒加载
  const bgLazyLoader = createBackgroundLazyLoader();

  // 开始观察
  imageLazyLoader.observe();
  bgLazyLoader.observe();

  // 监听DOM变化，自动为新添加的图片启用懒加载
  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              imageLazyLoader.observe(node);
              bgLazyLoader.observe(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  return {
    imageLazyLoader,
    bgLazyLoader
  };
}

/**
 * CSS样式建议
 *
 * .lazy {
 *   opacity: 0;
 *   transition: opacity 0.3s;
 * }
 *
 * .lazy.loading {
 *   opacity: 0.5;
 *   background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
 *   background-size: 200% 100%;
 *   animation: loading 1.5s infinite;
 * }
 *
 * .lazy.loaded {
 *   opacity: 1;
 * }
 *
 * .lazy.error {
 *   opacity: 0.5;
 *   filter: grayscale(100%);
 * }
 *
 * @keyframes loading {
 *   0% { background-position: 200% 0; }
 *   100% { background-position: -200% 0; }
 * }
 */

export default {
  createLazyLoader,
  createBackgroundLazyLoader,
  createResponsiveLazyLoader,
  initGlobalLazyLoad
};
