# Web 端上线访问与发布链路（new-online-info-web）

你当前有三套工程：
- 后端：`/Users/wangshi05/Downloads/new-online-info-back`（API：`http://localhost:8070/api`）
- 管理端：`/Users/wangshi05/Downloads/information`（用于编辑/发布 JSON）
- Web 端：`/Users/wangshi05/WebstormProjects/new-online-info-web`（用户访问课程列表/课程详情/学习页）

本文件说明：如何保证 **管理端发布 → Web 端课程列表可见 → 点击进入 course-viewer 稳定渲染**。

---

## 1) 当前“不符合预期”的根因（已修复）

之前你在 `information` 里修了模板/渲染器，但用户端实际跑的是 `new-online-info-web`，它有自己的：
- `src/pages/course-viewer.html`
- `public/js/*`（渲染引擎）
- `public/templates/*`（模板清单与模板文件）
- `public/course-system/renderer/*`（旧渲染器）

结果就是：管理端预览 OK，但 Web 端仍用旧的渲染链路 → 线上不一致。

现在已经把 Web 端对齐到统一渲染方案：
- `src/pages/course-viewer.html` 改为 **统一 JSON+模板引擎（iframe srcdoc）**
- `public/templates/lstm-1p5.template.html` 同步为稳定 KaTeX 绝对路径
- `public/assets/vendor/katex/*` 已加入（避免 CDN 与路径问题）

---

## 2) 发布（管理端）

进入：`information/course-editor.html`

流程：
1) 选择模板（下拉来自 `information/templates/manifest.json`）
2) 粘贴课程 JSON（含 `templateId`）
3) 校验通过后保存（写入后端 `template_courses.content_json`）
4) 发布（状态变为 `published`）

后端关键接口：
- `PUT /api/course-templates/courses/by-course-id/{courseId}/content`
- `POST /api/course-templates/courses/{id}/publish`（numericId）

---

## 3) Web 端访问（用户端）

### 3.1 课程列表页
- `src/pages/courses.html` 会请求：
  - `GET /api/course-templates/products/by-status/published`（课程产品）
  - `GET /api/courses`（普通课程）

### 3.2 模板课程详情页
- `src/pages/course-detail.html` 会请求：
  - `GET http://localhost:8070/api/course-templates/courses/by-course-id/{courseId}`
  - 并从 `contentJson.pages` 生成章节列表

### 3.3 学习页（核心）
- `src/pages/course-viewer.html?id=<courseId>`
  - 请求：`GET http://localhost:8070/api/course-templates/courses/by-course-id/{courseId}/content`
  - 渲染：`public/js/unified-course-renderer.js` + `public/js/chapter-template-engine.js` + `public/templates/manifest.json`
  - 以 `iframe srcdoc` 承载模板（最大化兼容复杂模板的脚本初始化）

---

## 4) 启动建议（避免端口/工程混淆）

你需要跑两个前端：
- 管理端（information）：建议 3001
- Web 端（new-online-info-web）：建议 3000

这样用户永远不会访问到管理端页面，管理端也不会覆盖 Web 端资源。

