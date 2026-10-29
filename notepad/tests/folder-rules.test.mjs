import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileRule as serverRule } from "../worker.js";
import vm from "node:vm";

const workerSource=readFileSync(new URL("../worker.js",import.meta.url),"utf8");
const encoded=workerSource.match(/const JS=("(?:\\.|[^"\\])*");/);
assert.ok(encoded,"embedded browser script exists");
const clientCode=JSON.parse(encoded[1]);
const start=clientCode.indexOf("function fileRule(content){");
const end=clientCode.indexOf("function cleaned(name){",start);
assert.ok(start>=0&&end>start,"browser classifier available");
const clientRule=vm.runInNewContext(clientCode.slice(start,end)+"\nfileRule");

function sample(text,folder,name){
 for(const rule of [serverRule,clientRule]){
  const got=rule(text);
  assert.equal(got.folder,folder);
  assert.equal(got.name,name);
 }
}
test("explicit 1st-line commands route, with 2nd-line first ten characters",()=>{
 const s="不要になった買い物リストです";
 sample("削除\n"+s,"trash","削除("+Array.from(s).slice(0,10).join("")+").txt");
 const t="OpenWrtのLAN設定を修正する";
 sample("完了\n"+t,"archive","完了("+Array.from(t).slice(0,10).join("")+").txt");
 sample("終了\nメモの整理","archive","終了(メモの整理).txt");
});
test("only exact first-line command is recognized",()=>{
 for(const line of ["削除予定","完了しました","終了 の予定","未完了","通常のメモ"]){
  sample(line+"\n内容","root",null);
 }
 sample(" 完了 \r\nレポート","archive","完了(レポート).txt");
});
test("empty and unsafe names remain safe",()=>{
 sample("削除\n","trash","削除(内容なし).txt");
 sample("完了\n  a/b:c?d*e  ","archive","完了(a b c d e).txt");
 sample("終了\n\n3行目","archive","終了(3行目).txt");
 sample("削除\n\n  \n","trash","削除(内容なし).txt");
});
test("editing second line or reverting first line updates category",()=>{
 const a=serverRule("完了\n初期内容");
 const b=serverRule("完了\n変更後の内容");
 assert.notEqual(a.name,b.name);
 sample("作業中\n変更後の内容","root",null);
});
test("surrogate-pair characters count as a single character",()=>{
 const snippet="🧪".repeat(12);
 sample("削除\n"+snippet,"trash","削除("+"🧪".repeat(10)+").txt");
});

test("status skips all blank and whitespace-only lines before filename source",()=>{
 sample("削除\n\n\t\nこんにちは！ ご連絡ありがとうございます。","trash","削除(こんにちは！ ご連絡).txt");
 sample("完了\n \n\nOpenWrtのLAN設定を修正する","archive","完了(OpenWrtのLA).txt");
 sample("終了\r\n  \r\n \r\n三行以降の文章","archive","終了(三行以降の文章).txt");
});
test("root files scroll independently and two folders remain immediately visible",()=>{
 class MockElement{
  constructor(tag){this.tag=tag;this.children=[];this.textContent="";this.value="";this.open=false;this.className="";}
  replaceChildren(){this.children=[];}
  append(...children){this.children.push(...children);}
  addEventListener(){}
 }
 const elements={
  "cloudopen-dialog":new MockElement("dialog"),
  "cloudopen-search":new MockElement("input"),
  "cloudopen-list":new MockElement("div")
 };
 elements["cloudopen-dialog"].open=true;
 const cloudFiles=new Map();
 for(let i=0;i<22;i++)cloudFiles.set("r"+i,{id:"r"+i,name:"通常"+i+".txt",folder:"root"});
 for(let i=0;i<3;i++)cloudFiles.set("a"+i,{id:"a"+i,name:"完了("+i+").txt",folder:"archive"});
 for(let i=0;i<11;i++)cloudFiles.set("t"+i,{id:"t"+i,name:"削除("+i+").txt",folder:"trash"});
 const begin=clientCode.indexOf("const cloudFolderOpen={");
 const end=clientCode.indexOf("function openCloud(id){",begin);
 assert.ok(begin>=0&&end>begin);
 const picker=vm.runInNewContext(clientCode.slice(begin,end)+"\n({refreshCloudList,cloudFolderOpen})",{
  document:{createElement:tag=>new MockElement(tag)},
  $:id=>elements[id],cloudFiles,docs:[],connected:true,fileRule:clientRule,openCloud:()=>{}
 });
 picker.refreshCloudList();
 const [roots,archive,trash]=elements["cloudopen-list"].children;
 assert.equal(elements["cloudopen-list"].children.length,3);
 assert.equal(roots.className,"cloud-root-list");
 assert.equal(roots.children.length,22);
 assert.match(archive.children[0].textContent,/アーカイブ \(3\)/);
 assert.match(trash.children[0].textContent,/ごみ箱 \(11\)/);
 assert.equal(archive.open,false);
 assert.equal(trash.open,false);
 assert.equal(picker.cloudFolderOpen.archive,false);
 assert.equal(picker.cloudFolderOpen.trash,false);
 const cssEncoded=workerSource.match(/const CSS=("(?:\\.|[^"\\])*");/);
 assert.ok(cssEncoded);
 const css=JSON.parse(cssEncoded[1]);
 assert.match(css,/\.cloud-root-list\{[^}]*max-height:[^}]*overflow-y:auto/);
 assert.match(css,/#cloudopen-list\{[^}]*overflow:visible/);
 elements["cloudopen-search"].value="完了";
 picker.refreshCloudList();
 assert.equal(elements["cloudopen-list"].children.length,1);
 assert.equal(elements["cloudopen-list"].children[0].open,true);
});
