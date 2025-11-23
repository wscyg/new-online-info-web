/**
 * 前端缓存管理器
 * 提供 LocalStorage、SessionStorage 和内存缓存的统一管理
 * 支持过期时间、版本控制和缓存清理
 */

/**
 * 缓存类型
 */
export const CacheType = {
  LOCAL: 'local',      // LocalStorage
  SESSION: 'session',  // SessionStorage
  MEMORY: 'memory'     // 内存缓存
};

/**
 * 内存缓存存储
 */
const memoryCache = new Map();

/**
 * 缓存管理器类
 */
class CacheManager {
  constructor(options = {}) {
    this.prefix = options.prefix || 'app_cache_';
    this.version = options.version || '1.0';
    this.defaultExpiry = options.defaultExpiry || 3600000; // 默认1小时
    this.maxSize = options.maxSize || 100; // 内存缓存最大条目数
  }

  /**
   * 生成缓存键
   */
  _generateKey(key) {
    return `${this.prefix}${key}_v${this.version}`;
  }

  /**
   * 获取存储对象
   */
  _getStorage(type) {
    switch (type) {
      case CacheType.LOCAL:
        return localStorage;
      case CacheType.SESSION:
        return sessionStorage;
      case CacheType.MEMORY:
        return memoryCache;
      default:
        return localStorage;
    }
  }

  /**
   * 设置缓存
   *
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {Object} options - 选项
   * @param {string} options.type - 缓存类型
   * @param {number} options.expiry - 过期时间（毫秒）
   * @returns {boolean} 是否成功
   *
   * @example
   * cacheManager.set('user', userData, { type: CacheType.LOCAL, expiry: 3600000 });
   */
  set(key, value, options = {}) {
    const type = options.type || CacheType.LOCAL;
    const expiry = options.expiry || this.defaultExpiry;
    const cacheKey = this._generateKey(key);

    const cacheData = {
      value: value,
      timestamp: Date.now(),
      expiry: expiry
    };

    try {
      if (type === CacheType.MEMORY) {
        // 检查内存缓存大小
        if (memoryCache.size >= this.maxSize) {
          // 删除最旧的缓存
          const firstKey = memoryCache.keys().next().value;
          memoryCache.delete(firstKey);
        }
        memoryCache.set(cacheKey, cacheData);
      } else {
        const storage = this._getStorage(type);
        storage.setItem(cacheKey, JSON.stringify(cacheData));
      }
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      // 如果存储满了，尝试清理过期缓存
      if (error.name === 'QuotaExceededError') {
        this.clearExpired(type);
        // 再次尝试
        try {
          if (type === CacheType.MEMORY) {
            memoryCache.set(cacheKey, cacheData);
          } else {
            const storage = this._getStorage(type);
            storage.setItem(cacheKey, JSON.stringify(cacheData));
          }
          return true;
        } catch (retryError) {
          console.error('重试设置缓存失败:', retryError);
          return false;
        }
      }
      return false;
    }
  }

  /**
   * 获取缓存
   *
   * @param {string} key - 缓存键
   * @param {Object} options - 选项
   * @param {string} options.type - 缓存类型
   * @param {*} options.defaultValue - 默认值
   * @returns {*} 缓存值或默认值
   *
   * @example
   * const user = cacheManager.get('user', { type: CacheType.LOCAL, defaultValue: null });
   */
  get(key, options = {}) {
    const type = options.type || CacheType.LOCAL;
    const defaultValue = options.defaultValue !== undefined ? options.defaultValue : null;
    const cacheKey = this._generateKey(key);

    try {
      let cacheData;

      if (type === CacheType.MEMORY) {
        cacheData = memoryCache.get(cacheKey);
      } else {
        const storage = this._getStorage(type);
        const item = storage.getItem(cacheKey);
        if (!item) return defaultValue;
        cacheData = JSON.parse(item);
      }

      if (!cacheData) return defaultValue;

      // 检查是否过期
      const now = Date.now();
      if (cacheData.expiry && (now - cacheData.timestamp) > cacheData.expiry) {
        this.remove(key, { type });
        return defaultValue;
      }

      return cacheData.value;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除缓存
   *
   * @param {string} key - 缓存键
   * @param {Object} options - 选项
   * @returns {boolean} 是否成功
   */
  remove(key, options = {}) {
    const type = options.type || CacheType.LOCAL;
    const cacheKey = this._generateKey(key);

    try {
      if (type === CacheType.MEMORY) {
        return memoryCache.delete(cacheKey);
      } else {
        const storage = this._getStorage(type);
        storage.removeItem(cacheKey);
        return true;
      }
    } catch (error) {
      console.error('删除缓存失败:', error);
      return false;
    }
  }

  /**
   * 清除指定类型的所有缓存
   */
  clear(type = CacheType.LOCAL) {
    try {
      if (type === CacheType.MEMORY) {
        memoryCache.clear();
      } else {
        const storage = this._getStorage(type);
        const keys = Object.keys(storage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            storage.removeItem(key);
          }
        });
      }
      return true;
    } catch (error) {
      console.error('清除缓存失败:', error);
      return false;
    }
  }

  /**
   * 清除过期缓存
   */
  clearExpired(type = CacheType.LOCAL) {
    try {
      if (type === CacheType.MEMORY) {
        const now = Date.now();
        for (const [key, data] of memoryCache.entries()) {
          if (data.expiry && (now - data.timestamp) > data.expiry) {
            memoryCache.delete(key);
          }
        }
      } else {
        const storage = this._getStorage(type);
        const keys = Object.keys(storage);
        const now = Date.now();

        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            try {
              const item = storage.getItem(key);
              if (item) {
                const data = JSON.parse(item);
                if (data.expiry && (now - data.timestamp) > data.expiry) {
                  storage.removeItem(key);
                }
              }
            } catch (error) {
              // 无效的缓存项，删除
              storage.removeItem(key);
            }
          }
        });
      }
      return true;
    } catch (error) {
      console.error('清除过期缓存失败:', error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key, options = {}) {
    const type = options.type || CacheType.LOCAL;
    const cacheKey = this._generateKey(key);

    try {
      let cacheData;

      if (type === CacheType.MEMORY) {
        cacheData = memoryCache.get(cacheKey);
      } else {
        const storage = this._getStorage(type);
        const item = storage.getItem(cacheKey);
        if (!item) return false;
        cacheData = JSON.parse(item);
      }

      if (!cacheData) return false;

      // 检查是否过期
      const now = Date.now();
      if (cacheData.expiry && (now - cacheData.timestamp) > cacheData.expiry) {
        this.remove(key, { type });
        return false;
      }

      return true;
    } catch (error) {
      console.error('检查缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存大小（条目数）
   */
  size(type = CacheType.LOCAL) {
    try {
      if (type === CacheType.MEMORY) {
        return memoryCache.size;
      } else {
        const storage = this._getStorage(type);
        const keys = Object.keys(storage);
        return keys.filter(key => key.startsWith(this.prefix)).length;
      }
    } catch (error) {
      console.error('获取缓存大小失败:', error);
      return 0;
    }
  }

  /**
   * 获取所有缓存键
   */
  keys(type = CacheType.LOCAL) {
    try {
      if (type === CacheType.MEMORY) {
        return Array.from(memoryCache.keys()).map(key =>
          key.replace(this.prefix, '').replace(`_v${this.version}`, '')
        );
      } else {
        const storage = this._getStorage(type);
        const keys = Object.keys(storage);
        return keys
          .filter(key => key.startsWith(this.prefix))
          .map(key => key.replace(this.prefix, '').replace(`_v${this.version}`, ''));
      }
    } catch (error) {
      console.error('获取缓存键失败:', error);
      return [];
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const stats = {
      local: {
        size: this.size(CacheType.LOCAL),
        keys: this.keys(CacheType.LOCAL)
      },
      session: {
        size: this.size(CacheType.SESSION),
        keys: this.keys(CacheType.SESSION)
      },
      memory: {
        size: this.size(CacheType.MEMORY),
        keys: this.keys(CacheType.MEMORY)
      }
    };

    return stats;
  }

  /**
   * 清理所有缓存
   */
  clearAll() {
    this.clear(CacheType.LOCAL);
    this.clear(CacheType.SESSION);
    this.clear(CacheType.MEMORY);
  }
}

/**
 * 创建带缓存的API请求函数
 *
 * @param {CacheManager} cacheManager - 缓存管理器实例
 * @param {Object} options - 选项
 * @returns {Function} 包装后的fetch函数
 *
 * @example
 * const cachedFetch = createCachedFetch(cacheManager, { expiry: 300000 });
 * const data = await cachedFetch('/api/courses', { cacheKey: 'courses' });
 */
export function createCachedFetch(cacheManager, options = {}) {
  const defaultExpiry = options.expiry || 300000; // 默认5分钟
  const cacheType = options.type || CacheType.MEMORY;

  return async function cachedFetch(url, fetchOptions = {}) {
    const cacheKey = fetchOptions.cacheKey || url;
    const useCache = fetchOptions.useCache !== false;
    const expiry = fetchOptions.expiry || defaultExpiry;

    // 尝试从缓存获取
    if (useCache) {
      const cached = cacheManager.get(cacheKey, { type: cacheType });
      if (cached) {
        console.log('从缓存返回:', cacheKey);
        return cached;
      }
    }

    // 发起请求
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 保存到缓存
      if (useCache) {
        cacheManager.set(cacheKey, data, { type: cacheType, expiry });
      }

      return data;
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  };
}

/**
 * 创建全局缓存管理器实例
 */
export const cacheManager = new CacheManager({
  prefix: 'platform_',
  version: '1.0',
  defaultExpiry: 1800000, // 30分钟
  maxSize: 200
});

/**
 * 创建带缓存的fetch
 */
export const cachedFetch = createCachedFetch(cacheManager, {
  expiry: 300000, // 5分钟
  type: CacheType.MEMORY
});

/**
 * 定期清理过期缓存
 */
if (typeof window !== 'undefined') {
  // 每10分钟清理一次过期缓存
  setInterval(() => {
    cacheManager.clearExpired(CacheType.LOCAL);
    cacheManager.clearExpired(CacheType.SESSION);
    cacheManager.clearExpired(CacheType.MEMORY);
    console.log('缓存清理完成');
  }, 600000);

  // 页面卸载前清理会话缓存
  window.addEventListener('beforeunload', () => {
    cacheManager.clear(CacheType.SESSION);
  });
}

export default cacheManager;
