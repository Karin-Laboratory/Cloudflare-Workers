import test from "node:test";
import assert from "node:assert/strict";

class FakeElement {
  constructor(tag,id){this.tag=tag;this.id=id;this.children=[];this.listeners={};this.dataset={};this.style={};this.classList={add(){},remove(){}};this.textContent="";this.innerHTML="";this.disabled=false}
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=children}
  addEventListener(type,fn){this.listeners[type]=fn}
  setAttribute(){}
  decode(){return Promise.resolve()}
  querySelector(tag){return this.children.find(node=>node.tag===tag)||null}
}
const elements=new Map();
for(const id of ["fill","question","paintings","results","quiz","recommendations","explanation","restart","audit"])elements.set(id,new FakeElement("div",id));
globalThis.document={getElementById:id=>elements.get(id),createElement:tag=>new FakeElement(tag)};
let now=1000;globalThis.performance={now:()=>now+=900};
globalThis.requestAnimationFrame=fn=>fn();
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};

test("offline preview renders two valid image URLs in every round and returns 3 recommendations",async()=>{
  const source=await import("../app.js");
  await flush();
  for(let i=0;i<8;i++){
    const pair=elements.get("paintings").children;
    assert.equal(pair.length,2,"Two options at round "+(i+1));
    assert.match(elements.get("question").textContent,new RegExp("^"+(i+1)+" / 8"));
    for(const button of pair){
      assert.equal(button.disabled,false,"Image fully prepared");
      assert.ok(button.children[0].src.startsWith("data:image/svg+xml;charset=utf-8,"),"Offline SVG image");
    }
    pair[0].listeners.click();
    await flush();
  }
  assert.equal(elements.get("recommendations").children.length,3);
  assert.ok(elements.get("audit").textContent.includes('"questions"'));
});
