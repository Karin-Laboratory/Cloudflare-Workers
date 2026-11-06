import test from "node:test";
import assert from "node:assert/strict";
class Fake{
 constructor(tag="div",id=""){this.tag=tag;this.id=id;this.children=[];this.listeners={};this.dataset={};this.style={};this.className="";this.disabled=false;this.textContent="";this.innerHTML="";this.attributes={};const c=new Set();this.classList={add:x=>c.add(x),remove:x=>c.delete(x),toggle:(x,b)=>b?c.add(x):c.delete(x),contains:x=>c.has(x)}}
 append(...x){this.children.push(...x)}
 replaceChildren(...x){this.children=x}
 addEventListener(type,fn){this.listeners[type]=fn}
 setAttribute(a,b){this.attributes[a]=b}
 querySelectorAll(q){return q==="button"?this.children.filter(x=>x.tag==="button"):[]}
 decode(){return Promise.resolve()}
}
const names=["status","quiz","results","question","fill","paintings","recommendations","explanation","audit","restart"];
const elements=new Map(names.map(id=>[id,new Fake("div",id)]));
const eventHandlers={};const reports=[];
const artworks=Array.from({length:1024},(_,i)=>({id:"cma-"+(10000+i),title:"Picture "+i,artist:"Artist "+(i%17),license:"CC0",image_sha256:"sha"+i,source_url:"https://www.clevelandart.org/art/"+(10000+i)}));
const features=artworks.map((a,i)=>({id:a.id,features:Array.from({length:22},(_,j)=>Math.sin(i*.15+j*.41)+Math.cos(j*.19+i*.029))}));
globalThis.document={getElementById:id=>elements.get(id),createElement:tag=>new Fake(tag),addEventListener:(x,y)=>eventHandlers[x]=y,hidden:false};
globalThis.window={addEventListener:(x,y)=>eventHandlers[x]=y};
globalThis.Image=class extends Fake{constructor(){super("img");this.naturalWidth=700}set src(v){this._src=v}get src(){return this._src}};
globalThis.requestAnimationFrame=fn=>fn();
let tick=1000;
globalThis.performance={now:()=>tick+=200};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.navigator={sendBeacon:()=>true};
globalThis.fetch=async (url,opts={})=>{if(url==="/api/catalog")return{ok:true,json:async()=>({status:"FROZEN_METADATA_AND_IMAGES",count:1024,artworks})};if(url==="/api/features")return{ok:true,json:async()=>({status:"FEATURES_FROZEN_UNVALIDATED_RECOMMENDATION",count:1024,items:features})};if(url==="/api/events"){reports.push(JSON.parse(opts.body));return{ok:true,status:204}};throw Error(url)};
async function flush(){for(let i=0;i<20;i++)await Promise.resolve()}
test("1024 verified paintings, 8 clicks, 3 unseen results and passive revisions",async()=>{
 await import("../app-v1.js");
 await flush();
 const seen=new Set();
 for(let i=0;i<8;i++){
  const nodes=elements.get("paintings").children;
  assert.equal(nodes.length,2);
  const images=nodes.map(n=>n.children[0]._src);
  images.forEach(x=>{assert.match(x,/^\/img\/cma-/);assert.ok(!seen.has(x));seen.add(x)});
  assert.equal(nodes[0].disabled,false);
  nodes[i%2].onclick();
  await flush();
 }
 const results=elements.get("recommendations").children;
 assert.equal(results.length,3);
 for(const r of results){assert.equal(r.children[2].children.length,5);assert.ok(!seen.has(r.children[0]._src))}
 const rating=results[0].children[2];
 rating.children[0].onclick();
 rating.children[1].onclick();
 await flush();
 assert.equal(reports.filter(r=>r.type==="result-shown").length,1);
 assert.equal(reports.filter(r=>r.type==="rating").length,2);
 assert.equal(reports.filter(r=>r.type==="rating")[1].revisionCount,1);
 eventHandlers.pagehide();
 await flush();
 const close=reports.find(r=>r.type==="pagehide");
 assert.equal(close.ratings[0].answered,true);
 assert.equal(close.ratings[1].answered,false);
 assert.equal(close.ratings[2].answered,false);
});
