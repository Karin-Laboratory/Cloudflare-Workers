import { chromium } from "playwright";
import fs from "node:fs";
const target=process.env.ART_URL||"https://art.karin-lab.com/?v=4";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on("pageerror",e=>errors.push("JS: "+e.message));
const result={url:target,at:new Date().toISOString(),status:"FAIL",steps:[],errors};
try{
 const response=await page.goto(target,{waitUntil:"domcontentloaded",timeout:30000});
 result.http_status=response.status();
 await page.locator(".art img").first().waitFor({timeout:20000});
 for(let i=0;i<8;i++){
  const buttons=page.locator("#paintings button.art");
  await buttons.first().waitFor({state:"visible",timeout:15000});
  const images=await page.locator("#paintings img").evaluateAll(els=>els.map(e=>({complete:e.complete,width:e.naturalWidth,height:e.naturalHeight})));
  if(images.length!==2||images.some(img=>!img.complete||img.width===0))throw Error("Images missing at round "+(i+1)+": "+JSON.stringify(images));
  const label=await page.locator("#question").textContent();
  if(!label.includes((i+1)+" / 8"))throw Error("Wrong step label: "+label);
  await buttons.first().click({timeout:15000});
  result.steps.push({round:i+1,label,image_count:images.length});
 }
 await page.locator("#recommendations .result").first().waitFor({timeout:15000});
 const results=await page.locator("#recommendations .result").count();
 if(results!==3)throw Error("Expected 3 recommendations, got "+results);
 if(errors.length)throw Error("Browser errors: "+errors.join("; "));
 result.status="PASS";result.result_count=results;
}catch(e){result.failure=String(e.stack||e)}
finally{
 await fs.promises.mkdir("art-preference/tests",{recursive:true});
 await fs.promises.writeFile("art-preference/tests/live-smoke-result.json",JSON.stringify(result,null,2)+"\n");
 await browser.close();console.log(JSON.stringify(result,null,2));
 if(result.status!=="PASS")process.exitCode=1;
}
