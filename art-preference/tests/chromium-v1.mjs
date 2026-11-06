import assert from "node:assert/strict";
import {chromium} from "playwright";
const jpgFixture=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YkgV0cAAAAASUVORK5CYII=","base64");
const works=Array.from({length:1024},(_,i)=>({
 id:"cma-"+(10000+i),title:"Painting "+i,artist:"Painter "+(i%47),
 source_url:"https://www.clevelandart.org/art/"+(10000+i),license:"CC0",image_sha256:"testsha"+i
}));
const vectors=works.map((x,i)=>({id:x.id,features:Array.from({length:22},(_,j)=>Math.sin(i*.17+j*.29)+Math.cos(i*.038+j*.46)),visual:Array.from({length:6},(_,j)=>Math.sin(i*.13+j*.41))}));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:1400,height:900}});
const page=await context.newPage(),events=[];
try{
 await page.route("**/api/**",async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==="/api/catalog")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({count:1024,status:"FROZEN_METADATA_AND_IMAGES",artworks:works})});
  if(path==="/api/features")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({count:1024,status:"FEATURES_FROZEN_UNVALIDATED_RECOMMENDATION",items:vectors})});
  if(path==="/api/events"){events.push(route.request().postDataJSON());return route.fulfill({status:204,body:""})}
  return route.abort();
 });
 await page.route("**/img/*.jpg",route=>route.fulfill({status:200,contentType:"image/png",body:jpgFixture}));
 await page.goto("http://127.0.0.1:8765/index-v1.html",{waitUntil:"domcontentloaded",timeout:30000});
 for(let n=0;n<8;n++){
  await page.locator(".art:not([disabled])").first().waitFor({timeout:30000});
  const label=await page.locator("#question").textContent();
  assert.match(label,new RegExp("^"+(n+1)+" / 8"));
  assert.equal(await page.locator(".art").count(),2);
  await page.locator(".art:not([disabled])").first().click();
 }
 await page.locator("#results:not(.hidden) .result").first().waitFor({timeout:30000});
 assert.equal(await page.locator(".result").count(),3);
 assert.equal(await page.locator(".rating").count(),3);
 assert.equal(await page.locator(".rating button").count(),15);
 await page.locator(".rating").first().getByRole("button",{name:"すごい好き！"}).click();
 await page.locator(".rating").first().getByRole("button",{name:"確かに好き"}).click();
 await page.waitForTimeout(100);
 const unique=new Map(events.map(x=>[x.eventId,x]));
 const ratings=[...unique.values()].filter(x=>x.type==="rating");
 assert.equal(ratings.length,2);
 assert.equal(ratings[1].revisionCount,1);
 console.log("PASS live Chromium 8 clicks, 3 recommendations, 5 ratings per artwork, automatic revisions; "+events.length+" events");
}finally{await context.close();await browser.close()}
