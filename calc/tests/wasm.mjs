import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const {instance:{exports:w}} = await WebAssembly.instantiate(readFileSync('dist/calc.wasm'));
function calc(text, mode=1) {
 const bytes = new TextEncoder().encode(text), ptr = w.alloc(bytes.length);
 new Uint8Array(w.memory.buffer,ptr,bytes.length).set(bytes);
 const out = w.calculate(ptr,bytes.length,mode), len = w.output_len();
 const result = new TextDecoder().decode(new Uint8Array(w.memory.buffer,out,len));
 w.release(ptr,bytes.length); w.release(out,len); return result;
}
for (const [s, want] of [['1+2*3','7'],['0.1+0.2','0.3'],['2^3^2','512'],['sin(30)','0.5'],['5!','120'],['200*10%','20']]) assert.equal(calc(s),want);
assert.ok(calc('1/0').startsWith('Error:'));
assert.equal(calc('sin(pi/2)',0),'1');
for(let i=0;i<10000;i++) assert.equal(calc('sqrt(81)'), '9');
console.log('WASM ABI, calculations, errors and 10,000 allocation cycles PASS');
