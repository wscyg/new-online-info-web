/**
 * JSON Path Locator
 * - 将 validator 的 path（如 pages[3].blocks[2].type）映射到原始 JSON 字符串的字符区间
 * - 目标：定位足够精准，且不引入第三方库
 *
 * 注意：
 * - 这是一个“面向编辑器”的近似定位器：假设 JSON 来自 JSON.stringify(...,2) 或格式化后的常规 JSON。
 * - 对极端格式（单行、混合注释、重复键）不做保证。
 */
(function () {
  'use strict';

  function parseSegments(path) {
    if (!path || path === '$') return [];
    const cleaned = path.replace(/^\$\./, '').replace(/^\$/, '');
    if (!cleaned) return [];

    const segs = [];
    let i = 0;
    while (i < cleaned.length) {
      if (cleaned[i] === '.') { i++; continue; }
      const mIndex = cleaned.slice(i).match(/^\[(\d+)\]/);
      if (mIndex) {
        segs.push({ type: 'index', value: Number(mIndex[1]) });
        i += mIndex[0].length;
        continue;
      }
      const mKey = cleaned.slice(i).match(/^([a-zA-Z0-9_]+)/);
      if (mKey) {
        segs.push({ type: 'key', value: mKey[1] });
        i += mKey[0].length;
        continue;
      }
      // unknown char, skip
      i++;
    }
    return segs;
  }

  function findNth(haystack, needle, n, fromIndex) {
    let pos = fromIndex ?? 0;
    let count = 0;
    while (true) {
      const at = haystack.indexOf(needle, pos);
      if (at === -1) return -1;
      if (count === n) return at;
      count++;
      pos = at + needle.length;
    }
  }

  function findObjectStartFrom(text, fromIndex) {
    const at = text.indexOf('{', fromIndex);
    return at;
  }

  function findArrayStartFrom(text, fromIndex) {
    const at = text.indexOf('[', fromIndex);
    return at;
  }

  function locatePathRange(jsonText, path) {
    const text = String(jsonText || '');
    const segs = parseSegments(path);
    if (!segs.length) return { start: 0, end: 0 };

    // 基于“逐段搜索”的近似：先找 key，再进入其对象/数组区域
    let cursor = 0;
    let lastKey = null;
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      if (seg.type === 'key') {
        lastKey = seg.value;
        const needle = `"${seg.value}"`;
        const at = text.indexOf(needle, cursor);
        if (at === -1) return null;
        // move cursor to after key
        cursor = at + needle.length;
        continue;
      }
      if (seg.type === 'index') {
        // find array after current cursor
        const arrStart = findArrayStartFrom(text, cursor);
        if (arrStart === -1) return null;
        // approximate: find nth '{' inside this array scope
        let pos = arrStart + 1;
        let found = -1;
        let count = -1;
        while (pos < text.length) {
          const ch = text[pos];
          if (ch === '{') {
            count++;
            if (count === seg.value) { found = pos; break; }
          }
          // stop if array ends before we find (very rough)
          if (ch === ']' && count < seg.value) return null;
          pos++;
        }
        if (found === -1) return null;
        cursor = found;
        continue;
      }
    }

    // 生成一个最终范围：优先选中 lastKey 的 value 区域，否则从 cursor 起选一小段
    if (lastKey) {
      const needle = `"${lastKey}"`;
      const keyAt = text.lastIndexOf(needle, cursor);
      if (keyAt !== -1) {
        const start = keyAt;
        // try to include value
        const colonAt = text.indexOf(':', keyAt + needle.length);
        if (colonAt !== -1) {
          const end = Math.min(colonAt + 220, text.length);
          return { start, end };
        }
        return { start, end: Math.min(start + 220, text.length) };
      }
    }
    return { start: Math.max(0, cursor), end: Math.min(cursor + 220, text.length) };
  }

  window.JsonPathLocator = {
    parseSegments,
    locatePathRange,
    VERSION: '0.1.0',
  };
})();

