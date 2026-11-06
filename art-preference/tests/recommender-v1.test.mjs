import test from "node:test";
import assert from "node:assert/strict";
import {QUESTION_COUNT,validateCatalog,nextPair,recommend,timingWeights,auditResult} from "../recommender-v1.mjs";
const items=Array.from({length:1024},(_,i)=>({
 id:"p-"+String(i).padStart(4,"0"),artist:"artist-"+(i%40),
 features:Array.from({length:16},(_,j)=>Math.sin(i*.21+j*.43)+Math.cos(i*.032+j*.6))
}));
test("catalog shape and length are audited",()=>{assert.equal(validateCatalog(items),16);assert.throws(()=>validateCatalog(items.slice(1)))});
test("eight distinct pairwise selections are deterministic",()=>{
 let records=[],exposed=new Set();
 for(let i=0;i<QUESTION_COUNT;i++){
  const a=nextPair(items,records),b=nextPair(items,records);
  assert.deepEqual(a,b);assert.equal(a.length,2);
  a.forEach(x=>{assert.ok(!exposed.has(x.id));exposed.add(x.id)});
  records.push({pair:a.map(x=>x.id),choice:i%2,ms:500+i*700});
 }
 const a=auditResult(items,records),b=auditResult(items,records);
 assert.deepEqual(a,b);assert.equal(a.recommendations.length,3);
 a.recommendations.forEach(x=>assert.ok(!exposed.has(x.id)));
 assert.notEqual(new Set(a.recommendations.map(x=>x.id)).size,1);
});
test("time weighting does not fabricate position bias",()=>{
 const records=Array.from({length:8},(_,i)=>({ms:500+i*200}));
 assert.equal(timingWeights(records,{enable:false}).every(v=>v===1),true);
 assert.ok(timingWeights(records).some(v=>v!==1));
 assert.equal(recommend(items,records.map((r,i)=>({...r,pair:[items[2*i].id,items[2*i+1].id],choice:i%2}))).sideBiasMode,"none: deterministic seeded positions; balance not validated");
});