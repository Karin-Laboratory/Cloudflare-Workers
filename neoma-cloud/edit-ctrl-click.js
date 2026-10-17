// SPDX-License-Identifier: MIT
// Karin-Lab enhancement: Ctrl+click on [[wiki links]] inside CodeMirror Edit view.
// No Neoma core/source bundle modifications are required.
(function installEditWikiCtrlClick() {
  if (window.__karinEditCtrlClickInstalled) return;
  window.__karinEditCtrlClickInstalled = true;

  // Resolve the clicked character offset across CodeMirror's syntax-highlight spans.
  function textOffsetAtPoint(line, x, y) {
    let node, offset;
    const caret = document.caretPositionFromPoint?.(x, y);
    if (caret) {
      node = caret.offsetNode;
      offset = caret.offset;
    } else {
      const range = document.caretRangeFromPoint?.(x, y);
      if (!range) return null;
      node = range.startContainer;
      offset = range.startOffset;
    }
    if (!(node === line || line.contains(node))) return null;
    try {
      const before = document.createRange();
      before.selectNodeContents(line);
      before.setEnd(node, offset);
      return before.toString().length;
    } catch {
      return null;
    }
  }

  // This matches Neoma's standard [[path]], [[path|alias]] and [[path#heading]] syntax.
  function wikiTargetAt(text, offset) {
    const re = /\[\[([^\]\r\n]+)\]\]/g;
    let match;
    while ((match = re.exec(text))) {
      if (match.index > 0 && text[match.index - 1] === '!') continue; // embeds
      if (offset < match.index || offset > match.index + match[0].length) continue;
      const raw = match[1];
      const beforeAlias = raw.split('|', 1)[0];
      const target = beforeAlias.split('#', 1)[0].trim();
      if (!target) return null;
      return target;
    }
    return null;
  }

  function navigateToNote(target) {
    // Reuse Neoma's existing Open page palette, which respects aliases and
    // current vault metadata. This avoids bypassing the application state store.
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'o', code: 'KeyO', ctrlKey: true, bubbles: true, cancelable: true,
    }));

    let attempts = 0;
    const openAndFind = () => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Command palette"]');
      const input = dialog?.querySelector('input.palette-input[role="combobox"]');
      if (!input || input.placeholder !== 'Open note…') {
        if (++attempts < 35) setTimeout(openAndFind, 30);
        return;
      }

      // Set React-controlled input through its native setter, then notify React.
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype, 'value'
      )?.set;
      if (setter) setter.call(input, target);
      else input.value = target;
      input.dispatchEvent(new Event('input', { bubbles: true }));

      let polls = 0;
      const chooseExact = () => {
        const items = [...dialog.querySelectorAll('#palette-listbox .palette-item')];
        const targetNoExt = target.replace(/\.md$/i, '').toLowerCase();
        const exact = items.find((item) => {
          const category = (item.querySelector('.palette-category')?.textContent || '').trim();
          const label = (item.querySelector('.palette-label')?.textContent || '').trim();
          return category.replace(/\.md$/i, '').toLowerCase() === targetNoExt ||
            label.toLowerCase() === targetNoExt;
        });
        if (exact) {
          exact.click();
          return;
        }
        if (items.length === 1 && polls >= 2) {
          // The only result may be a configured alias of a note.
          items[0].click();
          return;
        }
        // Leave the palette open if the link cannot be resolved; never create a note.
        if (++polls < 24) setTimeout(chooseExact, 40);
      };
      setTimeout(chooseExact, 35);
    };
    setTimeout(openAndFind, 0);
  }

  document.addEventListener('mousedown', (event) => {
    if (event.button !== 0 || !event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const line = target.closest('.editor-pane .cm-editor .cm-content .cm-line');
    if (!line) return; // Reading mode / normal clicks are handled by Neoma.
    const offset = textOffsetAtPoint(line, event.clientX, event.clientY);
    if (offset === null) return;
    const wiki = wikiTargetAt(line.textContent || '', offset);
    if (!wiki) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigateToNote(wiki);
  }, true);
})();