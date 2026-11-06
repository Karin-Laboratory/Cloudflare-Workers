const $ = (id) => document.getElementById(id);
const expression = $('expression');
let wasm, degrees = true, finished = false;
const history = [];
const encoder = new TextEncoder(), decoder = new TextDecoder();
function evaluate(text) {
  const bytes = encoder.encode(text);
  const ptr = wasm.alloc(bytes.length);
  new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
  let out, len;
  try {
    out = wasm.calculate(ptr, bytes.length, degrees ? 1 : 0);
    len = wasm.output_len();
    return decoder.decode(new Uint8Array(wasm.memory.buffer, out, len));
  } finally {
    wasm.release(ptr, bytes.length);
    if (out !== undefined) wasm.release(out, len);
  }
}
function renderResult(text) {
  const error = text.startsWith('Error:');
  $('result').classList.toggle('error', error);
  $('result').textContent = error ? text.slice(7) : text;
  return !error;
}
function calculate() {
  if (!wasm) return;
  const text = expression.value.trim();
  if (!text) return;
  const answer = evaluate(text);
  if (renderResult(answer)) {
    history.unshift({ text, answer, mode: degrees ? 'DEG' : 'RAD' });
    history.splice(12);
    renderHistory();
    finished = true;
  }
}
function renderHistory() {
  $('history').replaceChildren();
  $('empty').hidden = history.length > 0;
  for (const item of history) {
    const li = document.createElement('li'), button = document.createElement('button');
    button.textContent = `${item.text} · ${item.mode}`;
    const strong = document.createElement('strong');
    strong.textContent = `= ${item.answer}`;
    button.append(strong);
    button.onclick = () => {
      expression.value = item.text;
      degrees = item.mode === 'DEG';
      $('angle').textContent = item.mode;
      renderResult(item.answer);
      finished = false;
      expression.focus();
    };
    li.append(button);
    $('history').append(li);
  }
}
function press(key) {
  if (key === '=') { calculate(); return; }
  if (key === 'AC') {
    expression.value = ''; renderResult('0'); finished = false; return;
  }
  if (key === 'DEL') {
    const start = expression.selectionStart, end = expression.selectionEnd;
    expression.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
  } else {
    const values = { '×': '*', '÷': '/', '−': '-', 'π': 'pi', '√': 'sqrt(' };
    if (finished && !['+', '−', '×', '÷', '^', '%', '!'].includes(key)) expression.value = '';
    if (finished && ['+', '−', '×', '÷', '^', '%', '!'].includes(key)) expression.value = $('result').textContent;
    expression.focus();
    expression.setRangeText(values[key] || key, expression.selectionStart, expression.selectionEnd, 'end');
  }
  finished = false;
  expression.focus();
}
const keys = ['AC','(',')','DEL','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','%','+','π','e','^','='];
for (const key of keys) {
  const button = document.createElement('button');
  button.textContent = key === 'DEL' ? '⌫' : key;
  button.setAttribute('aria-label', key === 'DEL' ? '一文字削除' : key);
  button.className = key === '=' ? 'equal' : ['AC','DEL','(',')'].includes(key) ? 'utility' : ['÷','×','−','+'].includes(key) ? 'operator' : '';
  button.onclick = () => press(key);
  $('keys').append(button);
}
for (const key of ['sin(', 'cos(', 'tan(', '√', 'log(', 'ln(', 'abs(', '!']) {
  const button = document.createElement('button');
  button.textContent = key.replace('(', '');
  button.onclick = () => press(key);
  $('functions').append(button);
}
$('science').onclick = () => {
  $('functions').hidden = !$('functions').hidden;
  $('science').setAttribute('aria-expanded', String(!$('functions').hidden));
};
$('angle').onclick = () => { degrees = !degrees; $('angle').textContent = degrees ? 'DEG' : 'RAD'; finished = false; };
$('clear-history').onclick = () => { history.length = 0; renderHistory(); };
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('result').textContent); $('status').textContent = 'コピーしました'; }
  catch { $('status').textContent = 'コピーできませんでした'; }
};
expression.oninput = () => { finished = false; };
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { event.preventDefault(); press('AC'); }
  if (event.key === 'Enter' && event.target === expression) { event.preventDefault(); calculate(); }
  if (event.target === expression && event.key === '=') { event.preventDefault(); calculate(); }
});
try {
  const response = await fetch('/calc.wasm');
  if (!response.ok) throw new Error('WASM unavailable');
  ({ instance: { exports: wasm } } = await WebAssembly.instantiate(await response.arrayBuffer()));
  $('status').textContent = 'READY';
} catch {
  $('status').textContent = '読込失敗 · 再読込してください';
  renderResult('Error: 計算エンジンを読み込めませんでした');
}
