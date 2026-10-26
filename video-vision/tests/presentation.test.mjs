import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../site.html', import.meta.url), 'utf8');
const code = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const start = 'const PAGE = ';
const end = ';\nexport default';
assert.ok(code.startsWith(start) && code.includes(end), 'valid Worker wrapper');
assert.equal(JSON.parse(code.slice(start.length, code.indexOf(end))), html, 'generated HTML matches source');
assert.equal((html.match(/class="slide"/g) || []).length, 8, 'exactly 8 scenes');
for (let i = 1; i <= 8; i++) {
  assert.ok(html.includes('id="s' + i + '"'), 'scene ' + i + ' present');
}
assert.ok(html.includes('prefers-reduced-motion'), 'reduced-motion support');
assert.ok(html.includes('@media print'), 'presentation print styles');
assert.ok(html.includes('aria-label'), 'a11y controls');
assert.ok(html.includes('IntersectionObserver'), 'scroll-driven reveals');
assert.ok(html.includes('scrollIntoView'), 'slide navigation');
assert.ok(!/<script\s+src=/.test(html), 'no external script');
assert.ok(!/<link\s+[^>]*href="https?:/.test(html), 'no third-party stylesheet');
console.log('Presentation tests passed: 8 scenes / navigation / animation / accessibility');
