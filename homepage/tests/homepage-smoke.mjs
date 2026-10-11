import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const src=readFileSync(new URL('../index.js',import.meta.url),'utf8');
const page=src.match(/const PAGE=String\\.raw`([\\s\\S]*?)`;\\nfunction iconFallback/);
assert.ok(page,'Homepage HTML template found');
const script=page[1].match(/<script>([\\s\\S]*?)<\\/script>/);
assert.ok(script,'Homepage browser script found');
new Function(script[1]);
const start=script[1].indexOf('function externalDrag(e)');
const end=script[1].indexOf("$('board').addEventListener('dragstart'");
assert.ok(start>0&&end>start,'URL import handlers found');
const fns=vm.runInNewContext(script[1].slice(start,end)+'\n({externalDrag,droppedURL,importedTitle})',{URL,dragged:null});

const transfer=(type,value)=>({types:[type],getData:key=>key===type?value:''});

test('Chrome address-bar text/plain URL is imported',()=>{
 const dt=transfer('text/plain','https://www.youtube.com/');
 assert.equal(fns.droppedURL(dt),'https://www.youtube.com/');
 assert.equal(fns.externalDrag({dataTransfer:dt}),true);
});
test('URI list and Firefox URL drag are imported',()=>{
 assert.equal(fns.droppedURL(transfer('text/uri-list','# browser comment\nhttps://shopping.yahoo.co.jp/')),'https://shopping.yahoo.co.jp/');
 assert.equal(fns.droppedURL(transfer('text/x-moz-url','https://x.com/\nX')),'https://x.com/');
});
test('Unsafe and unrelated text is not imported',()=>{
 assert.equal(fns.droppedURL(transfer('text/plain','javascript:alert(1)')),null);
 assert.equal(fns.droppedURL(transfer('text/plain','Just ordinary text')),null);
 assert.equal(fns.droppedURL(transfer('text/plain','file:///etc/passwd')),null);
});
test('Imported links get readable titles',()=>{
 assert.equal(fns.importedTitle('https://mail.google.com/'),'Gmail');
 assert.equal(fns.importedTitle('https://to-do.office.com/'),'Microsoft To Do');
 assert.equal(fns.importedTitle('https://unknown.example/'),'unknown.example');
});
test('LAN and missing internal links have dedicated icons',()=>{
 assert.ok(src.includes('"nas":['));
 assert.ok(src.includes('"server":['));
 assert.ok(src.includes('"web":['));
 assert.ok(src.includes("privateHost?'/app-icon/'"));
 assert.ok(src.includes("KARIN_ICON_SET[slug]||KARIN_ICON_SET.web"));
});
