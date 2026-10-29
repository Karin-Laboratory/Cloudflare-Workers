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
 sample("終了\n\n3行目","archive","終了(内容なし).txt");
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
