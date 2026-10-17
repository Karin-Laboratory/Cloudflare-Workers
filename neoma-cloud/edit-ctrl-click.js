// SPDX-License-Identifier: MIT
// Karin Neoma: clickable WikiLinks in CodeMirror's Edit and Split modes.
// Supports bullet-list links as well as inline [[Page]], [[Page|Alias]] and [[Page#Heading]].
// Does not change the Markdown, interfere with ordinary edits, or create notes.
(function installEditWikiLinks() {
  if (window.__karinEditWikiLinksV2) return;
  window.__karinEditWikiLinksV2 = true;

  const HIGHLIGHT_NAME = 'karin-neoma-edit-wikilinks';
  const WIKI_PATTERN = /\[\[([^\]\r\n]+)\]\]/g;
  const LINE_SELECTOR = '.editor-pane .cm-editor .cm-content .cm-line';
  const nodesOf = (line) => {
    const result = [];
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) result.push(walker.currentNode);
    return result;
  };

  // Select exact offsets across any number of CodeMirror syntax-highlight spans.
  function rangeFor(line, from, to) {
    const nodes = nodesOf(line);
    let position = 0;
    let start = null;
    let end = null;
    for (const node of nodes) {
      const size = node.textContent.length;
      if (!start && from >= position && from < position + size) {
        start = { node, offset: from - position };
      }
      if (start && to >= position && to <= position + size) {
        end = { node, offset: to - position };
        break;
      }
      position += size;
    }
    if (!start || !end) return null;
    const range = document.createRange();
    try {
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      return range;
    } catch {
      return null;
    }
  }

  function wikiRanges(line) {
    const source = line.textContent || '';
    const ranges = [];
    WIKI_PATTERN.lastIndex = 0;
    let match;
    while ((match = WIKI_PATTERN.exec(source))) {
      if (match.index > 0 && source[match.index - 1] === '!') continue;
      const raw = match[1];
      const [pageWithHeading] = raw.split('|', 1);
      const name = pageWithHeading.split('#', 1)[0].trim();
      if (!name) continue;
      const range = rangeFor(line, match.index, match.index + match[0].length);
      if (range) ranges.push({ name, range });
    }
    return ranges;
  }

  function atPoint(line, x, y) {
    for (const item of wikiRanges(line)) {
      for (const rect of item.range.getClientRects()) {
        // Browsers render exact text ranges and ignore list indentation / empty space.
        if (x >= rect.left - 1 && x <= rect.right + 1 &&
            y >= rect.top - 2 && y <= rect.bottom + 2) return item.name;
      }
    }
    return null;
  }

  function directOpen(page) {
    // Neoma's Files sidebar already owns the correct click handler, including
    // its tab-routing and vault selection. Prefer that over fragile key synthesis.
    const wanted = page.endsWith('.md') ? page : page + '.md';
    const items = document.querySelectorAll('button[title]');
    for (const btn of items) {
      const path = btn.getAttribute('title');
      if (path === wanted) {
        btn.click();
        return true;
      }
    }
    // Neoma also resolves a link by its basename rather than full path.
    const simple = wanted.split('/').pop()?.toLowerCase();
    if (!simple) return false;
    const matches = [...items].filter(btn =>
      btn.getAttribute('title')?.split('/').pop()?.toLowerCase() === simple);
    if (matches.length === 1) {
      matches[0].click();
      return true;
    }
    return false;
  }

  function paletteFallback(page) {
    // Search via Neoma's own Ctrl+O command, without creating missing notes.
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'o', code: 'KeyO', ctrlKey: true, bubbles: true, cancelable: true
    }));
    let tries = 0;
    const open = () => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Command palette"]');
      const input = dialog?.querySelector('input.palette-input');
      if (!input || input.placeholder !== 'Open note…') {
        if (++tries < 35) setTimeout(open, 30);
        return;
      }
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, page);
      else input.value = page;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      let attempts = 0;
      const select = () => {
        const desired = page.replace(/\.md$/i, '').toLocaleLowerCase();
        const results = [...dialog.querySelectorAll('.palette-item')];
        const exact = results.find(el => {
          const path = el.querySelector('.palette-category')?.textContent?.trim() || '';
          const title = el.querySelector('.palette-label')?.textContent?.trim() || '';
          return path.replace(/\.md$/i, '').toLocaleLowerCase() === desired ||
            title.toLocaleLowerCase() === desired;
        });
        if (exact) exact.click();
        else if (++attempts < 30) setTimeout(select, 40);
      };
      setTimeout(select, 60);
    };
    setTimeout(open, 0);
  }

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || !event.ctrlKey || event.shiftKey ||
        event.altKey || event.metaKey) return;
    const el = event.target;
    if (!(el instanceof Element)) return;
    const line = el.closest(LINE_SELECTOR);
    if (!line) return;
    const page = atPoint(line, event.clientX, event.clientY);
    if (!page) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!directOpen(page)) paletteFallback(page);
  }, true);

  // Highlight text without touching CodeMirror's managed DOM or undo history.
  // The Custom Highlight API is supported by current Chromium browsers.
  if (typeof Highlight === 'function' && CSS?.highlights) {
    const style = document.createElement('style');
    style.textContent = '::highlight(' + HIGHLIGHT_NAME + ') {' +
      'color: var(--color-accent, #478bf2);' +
      'text-decoration: underline;' +
      'text-decoration-color: var(--color-accent, #478bf2);' +
      'text-underline-offset: 2px; }';
    document.head.appendChild(style);
    let scheduled = false;
    const paint = () => {
      scheduled = false;
      const ranges = [];
      for (const line of document.querySelectorAll(LINE_SELECTOR)) {
        for (const link of wikiRanges(line)) ranges.push(link.range);
      }
      CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(paint);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    schedule();
  }
})();
