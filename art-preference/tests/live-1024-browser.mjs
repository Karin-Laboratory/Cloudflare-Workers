import assert from "node:assert/strict";
import {chromium} from "playwright";
const url="https://art.karin-lab.com/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:1200,height:920},deviceScaleFactor:1});
const page=await context.newPage();
const events=[];
page.on("pageerror",err=>{console.error("PAGEERROR",String(err))});
try{
 await page.route("**/api/events",async route=>{try{events.push(route.request().postDataJSON())}catch{}await route.fulfill({status:204,body:""})});
 const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
 assert.equal(response?.status(),200,"Public route should serve HTML");
 await page.locator("#quiz:not(.hidden) .art:not([disabled])").first().waitFor({timeout:30000});
 assert.equal(await page.locator("h1").textContent(),"どっちの絵が好き？");
 const visited=new Set();
 for(let n=1;n<=8;n++){
  await page.locator("#quiz .art:not([disabled])").first().waitFor({timeout:30000});
  assert.equal(await page.locator("#quiz .art").count(),2);
  const matches=await page.locator("#quiz .art img").evaluateAll(imgs=>imgs.map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth})));
  for(const item of matches){assert.ok(item.src.includes("/img/cma-"),"Actual R2 JPEG URL expected");assert.ok(item.complete&&item.width>0,"Decoded JPEG required");assert.ok(!visited.has(item.src));visited.add(item.src)}
  await page.locator("#quiz .art:not([disabled])").first().click();
 }
 await page.locator("#results:not(.hidden) .result").first().waitFor({timeout:30000});
 assert.equal(await page.locator(".result").count(),3);
 assert.equal(await page.locator(".rating button").count(),15);
 const recommended=await page.locator(".result img").evaluateAll(imgs=>imgs.map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth})));
 for(let i=0;i<recommended.length;i++){const p=recommended[i];assert.ok(p.src.includes("/img/cma-"));assert.ok(!visited.has(p.src));await page.locator(".result img").nth(i).evaluate(img=>img.decode());}
 await page.locator(".rating").first().getByRole("button",{name:"すごい好き！"}).click();
 await page.locator(".rating").first().getByRole("button",{name:"確かに好き"}).click();
 await page.waitForTimeout(200);
 assert.equal(events.filter(e=>e.type==="rating").length,2);
 assert.ok(events.some(e=>e.type==="result-shown"));
 assert.equal(events.filter(e=>e.type==="rating")[1].revisionCount,1);
 await page.screenshot({path:"/tmp/art-1024-live.png",fullPage:true});
 console.log("PASS live art.karin-lab.com: 1024 R2 dataset, 8 actual decoded rounds, 3 unseen recommendations, rating modification, event capture suppressed from production R2.");
}finally{await context.close();await browser.close()}
