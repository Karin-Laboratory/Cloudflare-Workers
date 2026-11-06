import { readFileSync, writeFileSync } from 'node:fs';
const assets = {};
for (const [path, type] of [['index.html','text/html; charset=utf-8'],['style.css','text/css'],['app.js','text/javascript']]) {
  assets[`/${path}`] = [type, readFileSync(`dist/${path}`, 'utf8')];
}
assets['/'] = assets['/index.html'];
writeFileSync('dist/worker.js', `
const assets = ${JSON.stringify(assets)};
export default { async fetch(request) {
 const path = new URL(request.url).pathname;
 if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405});
 const entry = assets[path];
 const headers = {'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'Cache-Control':'no-cache'};
 if (path === '/calc.wasm') {
  headers['Content-Type'] = 'application/wasm';
  return new Response(request.method === 'HEAD' ? null : wasmBytes, {headers});
 }
 if (!entry) return new Response('Not found', {status:404});
 headers['Content-Type'] = entry[0];
 headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
 return new Response(request.method === 'HEAD' ? null : entry[1], {headers});
}};
const wasmBytes = Uint8Array.from(atob(${JSON.stringify(readFileSync('dist/calc.wasm').toString('base64'))}), c => c.charCodeAt(0));
`);
