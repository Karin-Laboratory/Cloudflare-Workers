import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const src=readFileSync(new URL('../index.js',import.meta.url),'utf8');
const page=src.match(/const PAGE=String\.raw`([\s\S]*?)`;\nfunction iconFallback/);
assert.ok(page,'Homepage HTML template found');
const script=page[1].match(/<script>([\s\S]*?)<\/script>/);
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
test('Intranet site links use distinct thematic SVG icons',()=>{
 const start=script[1].indexOf('function intranetIconSlug(');
 const end=script[1].indexOf('function render(){',start);
 assert.ok(start>=0&&end>start,'intranet icon resolver exists');
 const iconFor=vm.runInNewContext(script[1].slice(start,end)+'\n(intranetIconSlug)');
 const samples=[
  ['z4g4 Proxmox','https://192.168.0.55:8006/','proxmox'],
  ['BS4K 録画サーバ','http://192.168.1.52:8888/','dvr'],
  ['Router / OpenWrt','http://192.168.0.1/','router'],
  ['TS5200','http://192.168.0.23/','storage'],
  ['Cloud Commander TS5200','http://192.168.0.23/','filemanager'],
  ['us-310ea Cockpit','#','cockpit'],
  ['us-310eb Cockpit','#','cockpit-alt'],
  ['Homepage','http://192.168.0.21:3000/','intranet-home'],
  ['Private app','http://10.0.0.5/','intranet'],
  ['Private app','http://172.23.0.5/','intranet'],
  ['Private app','http://100.71.4.3/','intranet']
 ];
 for(const [title,url,expected] of samples){
  assert.equal(iconFor({title,url,description:''},new URL(url,'https://example.test').hostname),expected,title);
  assert.ok(src.includes('"'+expected+'":['),'SVG definition exists for '+expected);
 }
 assert.equal(iconFor({title:'Public Site',url:'https://example.com',description:''},'example.com'),'');
 assert.ok(!src.includes("privateHost?'/app-icon/'"));
 assert.ok(src.includes('intranetIconSlug(l,host)'));
});

function linkEditFixture(){
 const begin=script[1].indexOf('function updateEditedLink(');
 const end=script[1].indexOf('function edit(',begin);
 assert.ok(begin>=0&&end>begin,'Link editor helper found');
 const groups=[
  {id:'first',links:[
   {id:'a',title:'A',url:'https://a.example',description:''},
   {id:'b',title:'B',url:'https://b.example',description:''},
   {id:'c',title:'C',url:'https://c.example',description:''}
  ]},
  {id:'second',links:[{id:'d',title:'D',url:'https://d.example',description:''}]}
 ];
 const update=vm.runInNewContext(script[1].slice(begin,end)+'\nupdateEditedLink',{
  findGroup:id=>groups.find(g=>g.id===id)
 });
 return {groups,update};
}

test('Editing an existing link in its group preserves its index and identity',()=>{
 const {groups,update}=linkEditFixture();
 const original=groups[0].links[1];
 assert.equal(update('first','b','first',{title:'Renamed',url:'https://new.example',description:'Updated'}),true);
 assert.deepEqual(groups[0].links.map(l=>l.id),['a','b','c']);
 assert.equal(groups[0].links[1],original);
 assert.equal(original.title,'Renamed');
 assert.equal(original.url,'https://new.example');
 assert.equal(original.description,'Updated');
 assert.deepEqual(groups[1].links.map(l=>l.id),['d']);
});

test('Changing a link group moves it to the destination end, without affecting other links',()=>{
 const {groups,update}=linkEditFixture();
 const original=groups[0].links[1];
 assert.equal(update('first','b','second',{title:'Moved',url:'https://moved.example',description:''}),true);
 assert.deepEqual(groups[0].links.map(l=>l.id),['a','c']);
 assert.deepEqual(groups[1].links.map(l=>l.id),['d','b']);
 assert.equal(groups[1].links[1],original);
 assert.equal(original.url,'https://moved.example');
});

test('Missing link or destination never reorders existing links',()=>{
 const {groups,update}=linkEditFixture();
 assert.equal(update('first','missing','second',{title:'Absent'}),false);
 assert.equal(update('first','b','missing',{title:'Absent'}),false);
 assert.deepEqual(groups[0].links.map(l=>l.id),['a','b','c']);
 assert.deepEqual(groups[1].links.map(l=>l.id),['d']);
 assert.equal(groups[0].links[1].title,'B');
});
