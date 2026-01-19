(function (global) {
  "use strict";

  function escapeHtml(input) {
    return String(input ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(input) {
    return escapeHtml(input).replaceAll("\n", " ");
  }

  function ensureString(name, value) {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value;
    throw new Error(name + " must be string");
  }

  function dataDelayAttr(delay) {
    if (delay === undefined || delay === null || delay === "") return "";
    const n = Number(delay);
    return Number.isFinite(n) ? ` data-delay="${String(Math.max(0, n))}"` : "";
  }

  function hash8(input) {
    const str = typeof input === "string" ? input : JSON.stringify(input ?? "");
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
  }

  function renderTypingText(text, { delay = 0, speed, cursor = true } = {}) {
    const d = Number(delay);
    const s = speed === undefined ? undefined : Number(speed);
    const delayAttr = Number.isFinite(d) && d > 0 ? ` data-delay="${String(d)}"` : "";
    const speedAttr = Number.isFinite(s) ? ` data-speed="${String(s)}"` : "";
    const t = escapeAttr(text);
    return (
      `<span class="typing-text" data-text="${t}"${delayAttr}${speedAttr}></span>` +
      (cursor ? `<span class="typing-cursor"></span>` : "")
    );
  }

  function renderBridgeRow(block) {
    const prev = escapeHtml(block.prev ?? "");
    const current = escapeHtml(block.current ?? "");
    const next = escapeHtml(block.next ?? "");
    return `
<div class="bridge-row"${dataDelayAttr(block.delay ?? 90)}>
  <div class="bridge-item"><span class="bridge-k">${escapeHtml(block.prevLabel ?? "上一页")}</span> ${prev}</div>
  <div class="bridge-arrow">→</div>
  <div class="bridge-item current"><span class="bridge-k">${escapeHtml(block.currentLabel ?? "本页")}</span> ${current}</div>
  <div class="bridge-arrow">→</div>
  <div class="bridge-item"><span class="bridge-k">${escapeHtml(block.nextLabel ?? "下一页")}</span> ${next}</div>
</div>`.trim();
  }

  function renderMicroLead(block) {
    const text = ensureString("microLead.text", block.text);
    return `
<div class="micro-lead">
  ${renderTypingText(text, { delay: block.delay ?? 160, speed: block.speed ?? 18 })}
</div>`.trim();
  }

  function renderKeyline(block) {
    const dot = escapeHtml(block.dot ?? "!");
    const html = ensureString("keyline.html", block.html);
    return `
<div class="keyline"${dataDelayAttr(block.delay ?? 60)}>
  <div class="kdot">${dot}</div>
  <div class="ktext">${html}</div>
</div>`.trim();
  }

  function renderAccordion(block) {
    const summary = escapeHtml(block.summary ?? "");
    const badge = escapeHtml(block.badge ?? "More");
    const variant = block.variant ? String(block.variant).trim() : "";
    const extraClass = variant ? ` ${variant}` : "";
    const openAttr = block.open ? " open" : "";
    const contentHtml = ensureString("accordion.contentHtml", block.contentHtml ?? block.html ?? "");
    return `
<details class="accordion${extraClass}"${dataDelayAttr(block.delay)}${openAttr}>
  <summary>
    <span>${summary}</span>
    <span class="accordion-badge">${badge}</span>
    <span class="accordion-caret">⌄</span>
  </summary>
  <div class="accordion-content">
    ${contentHtml}
  </div>
</details>`.trim();
  }

  function renderThinkBox(block) {
    const qid = escapeAttr(block.qid ?? "");
    const title = escapeHtml(block.title ?? "");
    const text = ensureString("thinkBox.text", block.text);
    const qidAttr = qid ? ` data-qid="${qid}"` : "";
    return `
<div class="think-box"${qidAttr}>
  <div class="think-icon">?</div>
  <div class="think-meta">
    <div class="think-title">${title}</div>
    <div class="think-text">${text}</div>
  </div>
</div>`.trim();
  }

  function renderProse(block) {
    const paragraphs = Array.isArray(block.paragraphs) ? block.paragraphs : block.html ? [block.html] : [];
    const html = paragraphs.map((p) => `<p>${ensureString("prose.paragraph", p)}</p>`).join("\n");
    return `
<div class="prose">
  ${html}
</div>`.trim();
  }

  function renderCallout(block) {
    const title = escapeHtml(block.title ?? "");
    const tag = escapeHtml(block.tag ?? "Note");
    const bodyHtml = ensureString("callout.bodyHtml", block.bodyHtml ?? block.html ?? "");
    const idAttr = block.id ? ` id="${escapeAttr(block.id)}"` : "";
    return `
<div class="callout"${idAttr}>
  <div class="callout-head">
    <div class="callout-title">${title}</div>
    <span class="tag">${tag}</span>
  </div>
  <div class="callout-body">
    ${bodyHtml}
  </div>
</div>`.trim();
  }

  function renderCodeBlock(block) {
    const filename = escapeHtml(block.file ?? block.filename ?? block.title ?? "code.py");
    const code = ensureString("codeBlock.code", block.code ?? "");
    const escapedCode = escapeHtml(code);
    return `
<div class="code-container"${dataDelayAttr(block.delay ?? 120)}>
  <div class="code-header">
    <div class="code-dots"><span class="code-dot red"></span><span class="code-dot yellow"></span><span class="code-dot green"></span></div>
    <span class="code-lang">${filename}</span>
  </div>
  <div class="code-body"><pre>${escapedCode}</pre></div>
</div>`.trim();
  }

  function renderMiniMatrix(matrix) {
    if (!matrix) return "";
    const cols = Number.isFinite(Number(matrix.cols)) ? Number(matrix.cols) : undefined;
    const rows = Array.isArray(matrix.rows) ? matrix.rows : [];
    const colStyle = cols ? ` style="--cols:${String(cols)};"` : "";
    const rowsHtml = rows
      .map((r) => {
        const cells = Array.isArray(r) ? r : [];
        const cellsHtml = cells
          .map((cell) => {
            if (cell && typeof cell === "object") {
              const cls = cell.className ? String(cell.className) : cell.class ? String(cell.class) : "";
              const extra = cls ? ` ${cls}` : "";
              const text = cell.html !== undefined ? ensureString("matrix.cell.html", cell.html) : escapeHtml(cell.text ?? "");
              return `<div class="mini-cell${extra}">${text}</div>`;
            }
            return `<div class="mini-cell">${escapeHtml(cell ?? "")}</div>`;
          })
          .join("");
        return `<div class="mini-row">${cellsHtml}</div>`;
      })
      .join("\n");
    return `<div class="mini-matrix"${colStyle}>${rowsHtml}</div>`;
  }

  function renderShapeRow(shapePills) {
    const pills = Array.isArray(shapePills) ? shapePills : [];
    if (!pills.length) return "";
    const html = pills
      .map((p) => {
        if (typeof p === "string") return `<div class="shape-pill">${escapeHtml(p)}</div>`;
        if (!p || typeof p !== "object") return "";
        const name = escapeHtml(p.name ?? "");
        const shape = escapeHtml(p.shape ?? "");
        if (!name) return `<div class="shape-pill">${shape}</div>`;
        return `<div class="shape-pill"><b>${name}</b> ${shape}</div>`;
      })
      .filter(Boolean)
      .join("");
    return `<div class="shape-row">${html}</div>`;
  }

  function renderVizList(bullets) {
    const items = Array.isArray(bullets) ? bullets : [];
    if (!items.length) return "";
    const html = items
      .map((item) => {
        const text = typeof item === "string" ? escapeHtml(item) : ensureString("vizList.item", item?.html ?? "");
        return `<li><span class="viz-dot">!</span><span>${text}</span></li>`;
      })
      .join("\n");
    return `<ul class="viz-list">${html}</ul>`;
  }

  function renderLivingStepViz(step) {
    if (step.vizHtml) return ensureString("living.step.vizHtml", step.vizHtml);
    const viz = step.viz && typeof step.viz === "object" ? step.viz : {};
    const title = escapeHtml(viz.title ?? "");
    const sub = escapeHtml(viz.sub ?? "");
    const extraHtml = viz.html ? ensureString("living.step.viz.html", viz.html) : "";
    const matrixHtml = renderMiniMatrix(viz.matrix);
    const shapeRowHtml = renderShapeRow(viz.shapePills ?? viz.shapes);
    const listHtml = renderVizList(viz.bullets);
    return `
<div class="viz-card">
  ${title ? `<div class="viz-title">${title}</div>` : ""}
  ${sub ? `<div class="viz-sub">${sub}</div>` : ""}
  ${matrixHtml}
  ${shapeRowHtml}
  ${listHtml}
  ${extraHtml}
</div>`.trim();
  }

  function renderLiving(block) {
    const title = escapeHtml(block.title ?? block.codeTitle ?? "代码（逐行可视化：点击左侧）");
    const vizTitle = escapeHtml(block.vizTitle ?? "visualization");
    const hintDefault = escapeHtml(block.hint ?? "提示：点击左侧代码行");
    const steps = Array.isArray(block.steps) ? block.steps : [];
    if (!steps.length) throw new Error("living.steps must be non-empty array");

    const linesHtml = steps
      .map((step, idx) => {
        const id = escapeAttr(step.id ?? `step-${idx + 1}`);
        const active = step.active || (!steps.some((s) => s && s.active) && idx === 0) ? " active" : "";
        const label = escapeAttr(step.label ?? `Step ${idx + 1}`);
        const hint = escapeAttr(step.hint ?? "");
        const hintAttr = hint ? ` data-hint="${hint}"` : "";
        const lineHtml = step.codeHtml !== undefined
          ? ensureString("living.step.codeHtml", step.codeHtml)
          : escapeHtml(step.code ?? step.text ?? "");
        const lineBody = String(lineHtml).replaceAll("\n", "<br/>");
        return `<div class="code-line${active}" data-target="${id}" data-label="${label}"${hintAttr}>${lineBody}</div>`;
      })
      .join("\n");

    const stepsHtml = steps
      .map((step, idx) => {
        const id = escapeAttr(step.id ?? `step-${idx + 1}`);
        const active = step.active || (!steps.some((s) => s && s.active) && idx === 0) ? " active" : "";
        const body = renderLivingStepViz(step);
        return `<div class="viz-step${active}" data-step="${id}">${body}</div>`;
      })
      .join("\n");

    return `
<div class="living"${dataDelayAttr(block.delay ?? 160)}>
  <div class="code-panel">
    <div class="code-panel-head">
      <div class="code-dots"><span class="code-dot red"></span><span class="code-dot yellow"></span><span class="code-dot green"></span></div>
      <div class="code-panel-title">${title}</div>
    </div>
    <div class="code-lines">
      ${linesHtml}
    </div>
  </div>

  <div class="visual-panel">
    <div class="visual-head">
      <div class="visual-title">${vizTitle}</div>
      <div class="visual-title" data-role="viz-label"></div>
      <div class="hint" data-role="viz-hint">${hintDefault}</div>
    </div>
    <div class="visual-body">
      ${stepsHtml}
    </div>
  </div>
</div>`.trim();
  }

  // ========== 新增 block 类型支持 ==========

  function renderDiagram(block) {
    const title = escapeHtml(block.title ?? "");
    const caption = escapeHtml(block.caption ?? "");
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";
    // 支持 svg, html, image 三种模式
    let content = "";
    if (block.svg) {
      content = block.svg; // SVG直接嵌入
    } else if (block.html) {
      content = ensureString("diagram.html", block.html);
    } else if (block.image || block.src) {
      const src = escapeAttr(block.image ?? block.src);
      const alt = escapeAttr(block.alt ?? title);
      content = `<img src="${src}" alt="${alt}" class="diagram-img"/>`;
    }
    return `
<div class="diagram${variant}"${dataDelayAttr(block.delay)}>
  ${title ? `<div class="diagram-title">${title}</div>` : ""}
  <div class="diagram-content">${content}</div>
  ${caption ? `<div class="diagram-caption">${caption}</div>` : ""}
</div>`.trim();
  }

  function renderExampleBox(block) {
    const title = escapeHtml(block.title ?? "示例");
    const icon = escapeHtml(block.icon ?? "");
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";
    // 支持 schema 的 code/note 和兼容的 bodyHtml/content
    const code = block.code ? `<div class="example-code"><code>${escapeHtml(block.code)}</code></div>` : "";
    const note = block.note ? `<div class="example-note">${escapeHtml(block.note)}</div>` : "";
    const bodyHtml = ensureString("exampleBox.bodyHtml", block.bodyHtml ?? block.html ?? block.content ?? "");
    const hasSchemaFields = block.code || block.note;
    return `
<div class="example-box${variant}"${dataDelayAttr(block.delay)}>
  <div class="example-head">
    ${icon ? `<span class="example-icon">${icon}</span>` : ""}
    <span class="example-title">${title}</span>
  </div>
  <div class="example-body">${hasSchemaFields ? code + note : bodyHtml}</div>
</div>`.trim();
  }

  function renderFormulaBox(block) {
    // 支持 schema 的 label/math/desc 和兼容的 title/formula/explanation
    const label = escapeHtml(block.label ?? block.title ?? "");
    const math = ensureString("formulaBox.math", block.math ?? block.formula ?? block.latex ?? block.html ?? "");
    const desc = block.desc ?? block.explanation ?? "";
    const descHtml = desc ? ensureString("formulaBox.desc", desc) : "";
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";
    return `
<div class="formula-box${variant}"${dataDelayAttr(block.delay)}>
  ${label ? `<div class="formula-label">${label}</div>` : ""}
  <div class="formula-content">${math}</div>
  ${descHtml ? `<div class="formula-desc">${descHtml}</div>` : ""}
</div>`.trim();
  }

  function renderTable(block) {
    const title = escapeHtml(block.title ?? "");
    const headers = Array.isArray(block.headers) ? block.headers : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";

    const headerHtml = headers.length
      ? `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`
      : "";

    const bodyHtml = rows.map(row => {
      const cells = Array.isArray(row) ? row : [];
      return `<tr>${cells.map(cell => {
        if (cell && typeof cell === "object") {
          const content = cell.html !== undefined ? ensureString("table.cell.html", cell.html) : escapeHtml(cell.text ?? cell.value ?? "");
          const cls = cell.className ? ` class="${escapeAttr(cell.className)}"` : "";
          const colspan = cell.colspan ? ` colspan="${cell.colspan}"` : "";
          return `<td${cls}${colspan}>${content}</td>`;
        }
        return `<td>${escapeHtml(cell ?? "")}</td>`;
      }).join("")}</tr>`;
    }).join("\n");

    return `
<div class="table-container${variant}"${dataDelayAttr(block.delay)}>
  ${title ? `<div class="table-title">${title}</div>` : ""}
  <table class="data-table">
    ${headerHtml}
    <tbody>${bodyHtml}</tbody>
  </table>
</div>`.trim();
  }

  function renderTimeline(block) {
    const title = escapeHtml(block.title ?? "");
    const items = Array.isArray(block.items) ? block.items : [];
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";

    const itemsHtml = items.map((item, idx) => {
      const itemTitle = escapeHtml(item.title ?? item.label ?? `Step ${idx + 1}`);
      const content = item.html !== undefined
        ? ensureString("timeline.item.html", item.html)
        : escapeHtml(item.content ?? item.text ?? "");
      const icon = escapeHtml(item.icon ?? (idx + 1));
      const active = item.active ? " active" : "";
      return `
<div class="timeline-item${active}">
  <div class="timeline-marker">${icon}</div>
  <div class="timeline-content">
    <div class="timeline-item-title">${itemTitle}</div>
    <div class="timeline-item-body">${content}</div>
  </div>
</div>`;
    }).join("\n");

    return `
<div class="timeline${variant}"${dataDelayAttr(block.delay)}>
  ${title ? `<div class="timeline-title">${title}</div>` : ""}
  <div class="timeline-items">${itemsHtml}</div>
</div>`.trim();
  }

  function renderCardsGrid(block) {
    const title = escapeHtml(block.title ?? "");
    const cards = Array.isArray(block.cards) ? block.cards : [];
    // 支持 schema 的 columns 和兼容的 cols
    const columns = block.columns ?? block.cols;
    const colsStyle = columns ? ` style="--grid-cols:${Number(columns)}"` : "";
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";

    const cardsHtml = cards.map(card => {
      const cardTitle = escapeHtml(card.title ?? "");
      const cardSubtitle = card.subtitle ? `<div class="card-subtitle">${escapeHtml(card.subtitle)}</div>` : "";
      // 支持 schema 的 text 和 bullets
      const cardText = card.text ? escapeHtml(card.text) : "";
      const cardBullets = Array.isArray(card.bullets) && card.bullets.length
        ? `<ul class="card-bullets">${card.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";
      const cardContent = card.html !== undefined
        ? ensureString("cardsGrid.card.html", card.html)
        : (cardText || cardBullets ? cardText + cardBullets : escapeHtml(card.content ?? ""));
      // 支持 schema 的 icon 和 iconHtml
      const icon = card.iconHtml
        ? `<div class="card-icon">${card.iconHtml}</div>`
        : card.icon ? `<div class="card-icon">${escapeHtml(card.icon)}</div>` : "";
      const accent = card.accent ? ` data-accent="${escapeAttr(card.accent)}"` : "";
      const cardClass = card.className ? ` ${escapeAttr(card.className)}` : "";
      return `
<div class="grid-card${cardClass}"${accent}>
  ${icon}
  <div class="card-head">
    <div class="card-title">${cardTitle}</div>
    ${cardSubtitle}
  </div>
  <div class="card-body">${cardContent}</div>
</div>`;
    }).join("\n");

    return `
<div class="cards-grid${variant}"${colsStyle}${dataDelayAttr(block.delay)}>
  ${title ? `<div class="cards-grid-title">${title}</div>` : ""}
  <div class="cards-container">${cardsHtml}</div>
</div>`.trim();
  }

  // ========== head.html 中的额外组件 ==========

  function renderMathBlock(block) {
    const title = escapeHtml(block.title ?? "");
    const rows = Array.isArray(block.rows) ? block.rows : [];
    const result = block.result ? ensureString("mathBlock.result", block.result) : "";

    const rowsHtml = rows.map(row => {
      const step = row.step ? `<span class="math-step">${escapeHtml(row.step)}</span>` : "";
      const expr = row.html !== undefined
        ? ensureString("mathBlock.row.html", row.html)
        : escapeHtml(row.expr ?? row.text ?? "");
      const comment = row.comment ? `<span class="math-comment">// ${escapeHtml(row.comment)}</span>` : "";
      return `<div class="math-row">${step}${expr}${comment}</div>`;
    }).join("\n");

    return `
<div class="math-block"${dataDelayAttr(block.delay)}>
  ${title ? `<div class="math-title">${title}</div>` : ""}
  ${rowsHtml}
  ${result ? `<div class="math-result">${result}</div>` : ""}
</div>`.trim();
  }

  function renderQuoteBox(block) {
    const text = ensureString("quoteBox.text", block.text ?? block.quote ?? "");
    const author = block.author ? `<div class="quote-author">— ${escapeHtml(block.author)}</div>` : "";
    const variant = block.variant ? ` ${escapeAttr(block.variant)}` : "";
    return `
<div class="quote-box${variant}"${dataDelayAttr(block.delay)}>
  <div class="quote-text">${text}</div>
  ${author}
</div>`.trim();
  }

  function renderStickyNote(block) {
    const title = block.title ? `<div class="sticky-title">${escapeHtml(block.title)}</div>` : "";
    const text = ensureString("stickyNote.text", block.text ?? block.html ?? "");
    // 颜色: yellow, pink, blue, green, purple, orange
    const color = escapeAttr(block.color ?? block.variant ?? "yellow");
    return `
<div class="sticky-note ${color}"${dataDelayAttr(block.delay)}>
  ${title}
  <div class="sticky-text">${text}</div>
</div>`.trim();
  }

  function renderLabCard(block) {
    const title = escapeHtml(block.title ?? "");
    const sub = block.sub ? `<div class="lab-sub">${escapeHtml(block.sub)}</div>` : "";
    const hint = block.hint ? `<div class="lab-hint">${ensureString("labCard.hint", block.hint)}</div>` : "";
    const bodyHtml = block.html !== undefined
      ? ensureString("labCard.html", block.html)
      : "";
    const controls = Array.isArray(block.controls) ? block.controls : [];

    const controlsHtml = controls.length ? `<div class="lab-controls">${controls.map(ctrl => {
      const label = escapeHtml(ctrl.label ?? "");
      const type = ctrl.type ?? "range";
      const value = ctrl.value ?? "";
      const min = ctrl.min ?? 0;
      const max = ctrl.max ?? 100;
      const id = escapeAttr(ctrl.id ?? `ctrl-${Math.random().toString(36).slice(2, 8)}`);
      if (type === "range") {
        return `<div class="lab-control">
          <label for="${id}">${label}</label>
          <input type="range" id="${id}" min="${min}" max="${max}" value="${value}"/>
          <div class="lab-control-value">${value}</div>
        </div>`;
      }
      return `<div class="lab-control"><label>${label}</label><span>${escapeHtml(value)}</span></div>`;
    }).join("\n")}</div>` : "";

    return `
<div class="lab-grid"${dataDelayAttr(block.delay)}>
  <div class="lab-card">
    <div class="lab-head">
      <div>
        <div class="lab-title">${title}</div>
        ${sub}
      </div>
    </div>
    <div class="lab-body">
      ${bodyHtml}
      ${controlsHtml}
      ${hint}
    </div>
  </div>
</div>`.trim();
  }

  function renderCodeDiagramSplit(block) {
    const codeTitle = escapeHtml(block.codeTitle ?? block.file ?? "code.py");
    const code = block.code ? escapeHtml(block.code) : "";
    const codeHtml = block.codeHtml ?? "";
    const diagramHtml = block.diagramHtml ?? block.svg ?? "";
    const diagramCaption = block.diagramCaption ? `<div class="diagram-caption">${escapeHtml(block.diagramCaption)}</div>` : "";

    return `
<div class="code-diagram-split"${dataDelayAttr(block.delay)}>
  <div class="code-panel">
    <div class="code-panel-header">
      <div class="code-panel-dots"><span></span><span></span><span></span></div>
      <div class="code-panel-title">${codeTitle}</div>
    </div>
    <pre class="code-panel-body">${codeHtml || code}</pre>
  </div>
  <div class="diagram-panel">
    ${diagramHtml}
    ${diagramCaption}
  </div>
</div>`.trim();
  }

  function renderPageTransition(block) {
    const icon = escapeHtml(block.icon ?? "→");
    const text = ensureString("pageTransition.text", block.text ?? block.html ?? "");
    return `
<div class="page-transition"${dataDelayAttr(block.delay)}>
  <div class="page-transition-icon">${icon}</div>
  <div class="page-transition-text">${text}</div>
</div>`.trim();
  }

  function renderBlock(block) {
    if (!block) return "";
    if (typeof block === "string") return block;
    if (typeof block !== "object") return "";

    switch (block.type) {
      case "html":
        return ensureString("html.html", block.html);
      case "bridgeRow":
        return renderBridgeRow(block);
      case "microLead":
        return renderMicroLead(block);
      case "keyline":
        return renderKeyline(block);
      case "accordion":
        return renderAccordion(block);
      case "thinkBox":
        return renderThinkBox(block);
      case "prose":
        return renderProse(block);
      case "callout":
        return renderCallout(block);
      case "codeBlock":
        return renderCodeBlock(block);
      case "living":
        return renderLiving(block);
      // ========== 新增 block 类型 ==========
      case "diagram":
        return renderDiagram(block);
      case "exampleBox":
        return renderExampleBox(block);
      case "formulaBox":
        return renderFormulaBox(block);
      case "table":
        return renderTable(block);
      case "timeline":
        return renderTimeline(block);
      case "cardsGrid":
        return renderCardsGrid(block);
      // ========== head.html 额外组件 ==========
      case "mathBlock":
        return renderMathBlock(block);
      case "quoteBox":
        return renderQuoteBox(block);
      case "stickyNote":
        return renderStickyNote(block);
      case "labCard":
        return renderLabCard(block);
      case "codeDiagramSplit":
        return renderCodeDiagramSplit(block);
      case "pageTransition":
        return renderPageTransition(block);
      default:
        // 改为警告而不是抛出错误，返回空字符串
        console.warn("Unknown block type: " + block.type + ", skipping...");
        return `<div class="unknown-block" data-type="${escapeAttr(block.type)}">[不支持的block类型: ${escapeHtml(block.type)}]</div>`;
    }
  }

  function renderStandardHeader(header) {
    if (!header) return "";
    const label = header.label ? `<span class="section-label">${escapeHtml(header.label)}</span>` : "";
    const title = header.title
      ? `<h2 class="section-title">${renderTypingText(header.title, { delay: header.delay ?? 0, speed: header.speed })}</h2>`
      : "";
    const desc = header.descHtml ? `<p class="section-desc">${header.descHtml}</p>` : "";
    return [label, title, desc].filter(Boolean).join("\n");
  }

  function renderHeroHeader(header) {
    if (!header) return "";
    const badge = header.badgeHtml ?? "";
    const title = header.title
      ? `<h1 class="hero-title"><span class="hero-title-gradient">${renderTypingText(header.title, { delay: header.delay ?? 0 })}</span></h1>`
      : "";
    const sub = header.subtitle
      ? `<p class="hero-subtitle">${renderTypingText(header.subtitle, { delay: header.subtitleDelay ?? 480 })}</p>`
      : "";
    const extra = header.extraHtml ?? "";
    return [badge, title, sub, extra].filter(Boolean).join("\n");
  }

  function renderPage(page, index) {
    if (!page || typeof page !== "object") throw new Error("page must be object");

    const pageIndex = Number.isFinite(Number(page.page)) ? Number(page.page) : index;
    const id = page.id ? String(page.id) : `p-${pageIndex}`;
    const accent = page.accent ? String(page.accent) : "cyan";

    const cls = new Set(["page"]);
    const extraClasses = []
      .concat(page.className ? [page.className] : [])
      .concat(Array.isArray(page.classes) ? page.classes : []);
    extraClasses.filter(Boolean).forEach((c) => cls.add(String(c)));
    if (index === 0) cls.add("active");

    const dataTitle = escapeAttr(page.dataTitle ?? page.title ?? "");
    const dataSub = escapeAttr(page.dataSub ?? page.sub ?? "");

    // 支持 rawHtml 模式：完全跳过 page-inner 包装，直接使用原始 HTML
    // 适用于 gpt-course 等模版的特殊页面结构
    if (page.rawHtml) {
      const stable = hash8({ id, accent, dataTitle, dataSub, rawHtml: page.rawHtml });
      return `
<section class="${Array.from(cls).join(" ")}" id="${escapeAttr(id)}" data-page="${String(pageIndex)}" data-accent="${escapeAttr(accent)}"
         data-title="${dataTitle}"
         data-sub="${dataSub}" data-hash="${stable}">
${page.rawHtml}
</section>`.trim();
    }

    const headerHtml = page.kind === "hero" ? renderHeroHeader(page.header) : renderStandardHeader(page.header);

    const blocksHtml = Array.isArray(page.blocks)
      ? page.blocks.map((b) => renderBlock(b)).filter(Boolean).join("\n\n")
      : ensureString("page.html", page.html ?? "");

    const stable = hash8({ id, accent, dataTitle, dataSub, header: page.header ?? null, blocks: page.blocks ?? page.html ?? "" });

    return `
<section class="${Array.from(cls).join(" ")}" id="${escapeAttr(id)}" data-page="${String(pageIndex)}" data-accent="${escapeAttr(accent)}"
         data-title="${dataTitle}"
         data-sub="${dataSub}" data-hash="${stable}">
  <div class="page-inner">
    ${headerHtml}
    ${blocksHtml}
  </div>
</section>`.trim();
  }

  function renderPages(pages) {
    if (!Array.isArray(pages)) throw new Error("config.pages must be an array");
    return pages.map((p, i) => renderPage(p, i)).join("\n\n");
  }

  function applyTemplate({ templateHtml, title, pagesHtml }) {
    const START = "<!-- TEMPLATE_PAGES_START -->";
    const END = "<!-- TEMPLATE_PAGES_END -->";
    const s = templateHtml.indexOf(START);
    const e = templateHtml.indexOf(END);
    if (s === -1 || e === -1 || e <= s) {
      throw new Error("Template markers not found. Expected " + START + " ... " + END);
    }

    const before = templateHtml.slice(0, s + START.length);
    const after = templateHtml.slice(e);
    const withPages = `${before}\n\n${pagesHtml}\n\n${after}`;
    const htmlTitle = escapeHtml(title ?? "");
    return withPages.replace(/<title>[\s\S]*?<\/title>/, `<title>${htmlTitle}</title>`);
  }

  global.ChapterTemplateEngine = {
    escapeHtml,
    escapeAttr,
    renderBlock,
    renderPage,
    renderPages,
    applyTemplate,
    VERSION: "0.2.0",
  };
})(window);
