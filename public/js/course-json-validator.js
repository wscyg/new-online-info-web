/**
 * Course JSON Validator
 * - 面向 schema v2.0（COURSE_JSON_SCHEMA.md）
 * - 给管理端“校验/发布门禁”提供可读错误列表
 */
(function () {
  'use strict';

  function isObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  function push(errs, path, message, extra) {
    errs.push({ path, message, ...(extra || {}) });
  }

  function ensureString(errs, path, v, required = true) {
    if (v === undefined || v === null) {
      if (required) push(errs, path, '缺少字段');
      return;
    }
    if (typeof v !== 'string') push(errs, path, '应为 string');
  }

  function ensureArray(errs, path, v, required = true) {
    if (v === undefined || v === null) {
      if (required) push(errs, path, '缺少字段');
      return;
    }
    if (!Array.isArray(v)) push(errs, path, '应为 array');
  }

  function validateBlock(errs, block, path) {
    if (!isObject(block)) {
      push(errs, path, 'block 应为 object');
      return;
    }
    ensureString(errs, `${path}.type`, block.type, true);
    const type = block.type;

    // 允许未知 type，但强提示（发布门禁可改成 hard-fail）
    if (type && window.ChapterTemplateEngine && typeof window.ChapterTemplateEngine.renderBlock === 'function') {
      try {
        const html = window.ChapterTemplateEngine.renderBlock(block);
        if (typeof html === 'string' && html.includes('unknown-block')) {
          push(errs, `${path}.type`, `不支持的 block.type: ${type}`);
        }
      } catch (e) {
        push(errs, path, '渲染器处理该 block 时抛错', { error: e.message || String(e) });
      }
    }

    switch (type) {
      case 'prose':
        ensureArray(errs, `${path}.paragraphs`, block.paragraphs, false);
        break;
      case 'cardsGrid':
        ensureArray(errs, `${path}.cards`, block.cards, true);
        break;
      case 'timeline':
        ensureArray(errs, `${path}.items`, block.items, true);
        break;
      case 'table':
        ensureArray(errs, `${path}.headers`, block.headers, true);
        ensureArray(errs, `${path}.rows`, block.rows, true);
        break;
      case 'codeBlock':
        ensureString(errs, `${path}.code`, block.code, true);
        break;
      case 'living':
        ensureArray(errs, `${path}.steps`, block.steps, true);
        if (Array.isArray(block.steps) && block.steps.length === 0) {
          push(errs, `${path}.steps`, 'living.steps 不能为空');
        }
        break;
      default:
        break;
    }
  }

  function validateV2(errs, config) {
    ensureString(errs, 'version', config.version, true);
    if (config.version && String(config.version) !== '2.0') {
      push(errs, 'version', '建议使用 "2.0"');
    }
    ensureString(errs, 'id', config.id, true);
    ensureString(errs, 'title', config.title, true);
    ensureString(errs, 'templateId', config.templateId, true);
    ensureString(errs, 'accent', config.accent, false);
    ensureArray(errs, 'pages', config.pages, true);
    if (Array.isArray(config.pages) && config.pages.length === 0) push(errs, 'pages', '至少需要 1 页');

    (config.pages || []).forEach((page, i) => {
      const pPath = `pages[${i}]`;
      if (!isObject(page)) return push(errs, pPath, 'page 应为 object');
      ensureString(errs, `${pPath}.id`, page.id, true);
      ensureString(errs, `${pPath}.kind`, page.kind, true);
      if (page.kind && !['hero', 'section'].includes(page.kind)) {
        push(errs, `${pPath}.kind`, '应为 "hero" 或 "section"');
      }
      if (page.kind && !page.header) push(errs, `${pPath}.header`, '缺少 header');
      if (page.header && !isObject(page.header)) push(errs, `${pPath}.header`, 'header 应为 object');

      // blocks or html/rawHtml 二选一，但 blocks 更推荐
      if (page.rawHtml !== undefined) {
        ensureString(errs, `${pPath}.rawHtml`, page.rawHtml, true);
      } else if (page.blocks !== undefined) {
        ensureArray(errs, `${pPath}.blocks`, page.blocks, true);
        (page.blocks || []).forEach((b, bi) => validateBlock(errs, b, `${pPath}.blocks[${bi}]`));
      } else if (page.html !== undefined) {
        ensureString(errs, `${pPath}.html`, page.html, true);
      } else {
        push(errs, pPath, 'page 需要 blocks 或 html 或 rawHtml');
      }
    });
  }

  function validateCourseJson(input) {
    const errs = [];
    let config;
    try {
      config = (typeof input === 'string') ? JSON.parse(input) : input;
    } catch (e) {
      push(errs, '$', 'JSON 解析失败', { error: e.message || String(e) });
      return { ok: false, errors: errs };
    }

    if (!isObject(config)) {
      push(errs, '$', '根对象应为 object');
      return { ok: false, errors: errs };
    }

    // 尽量走 migrator，兼容 v1/unknown
    if (window.FormatMigrator && typeof window.FormatMigrator.ensureV2 === 'function') {
      try {
        config = window.FormatMigrator.ensureV2(config);
      } catch (e) {
        push(errs, '$', '格式迁移失败', { error: e.message || String(e) });
        return { ok: false, errors: errs };
      }
    }

    validateV2(errs, config);
    return { ok: errs.length === 0, errors: errs, normalized: config };
  }

  window.CourseJsonValidator = {
    validateCourseJson,
    VERSION: '0.1.0',
  };
})();

